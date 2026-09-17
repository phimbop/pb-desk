import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * So sánh chuẩn Semantic Versioning (SemVer) bao gồm cả pre-release tag:
 * Trả về > 0 nếu v1 > v2, < 0 nếu v1 < v2, 0 nếu v1 == v2.
 * Quy tắc: 1.0.0 > 1.0.0-rc1, 1.0.0-rc2 > 1.0.0-rc1
 */
export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => v.trim().replace(/^v/, "");
  const [core1, pre1] = clean(v1).split("-");
  const [core2, pre2] = clean(v2).split("-");

  const parts1 = core1.split(".").map((n) => parseInt(n, 10) || 0);
  const parts2 = core2.split(".").map((n) => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  // Nếu phần số giống nhau, bản không có pre-release lớn hơn bản có pre-release
  if (!pre1 && pre2) return 1;
  if (pre1 && !pre2) return -1;
  if (pre1 && pre2) {
    return pre1.localeCompare(pre2, undefined, { numeric: true });
  }

  return 0;
}

/**
 * Tính toán bucket phân phối tất định (0..99) dựa trên SHA-256 của:
 * installationId + target + version
 */
export async function computeRolloutBucket(
  installationId: string,
  target: string,
  version: string
): Promise<number> {
  const data = new TextEncoder().encode(`${installationId.toLowerCase()}:${target.toLowerCase()}:${version}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  const view = new DataView(hashArray.buffer);
  return view.getUint32(0, false) % 100;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-installation-id",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("target")?.trim();
    const currentVersion = url.searchParams.get("current_version")?.trim() || "0.0.0";
    const channel = url.searchParams.get("channel")?.trim() || "stable";
    const installationId =
      url.searchParams.get("installation_id")?.trim() ||
      req.headers.get("x-installation-id")?.trim();

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing 'target' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Lấy danh sách các bản phát hành active cho target và channel
    const { data: releases, error } = await supabase
      .from("app_versions")
      .select("*")
      .eq("target", target)
      .eq("channel", channel)
      .eq("is_active", true);

    if (error || !releases || releases.length === 0) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Lọc các bản có version > current_version và sort giảm dần theo SemVer chuẩn
    const eligible = releases
      .filter((r) => compareSemver(r.version, currentVersion) > 0)
      .sort((a, b) => compareSemver(b.version, a.version));

    if (eligible.length === 0) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const latest = eligible[0];

    // Kiểm tra Staged Rollout tất định
    if (latest.rollout_percentage < 100) {
      if (latest.rollout_percentage <= 0) {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (!installationId || !UUID_REGEX.test(installationId)) {
        return new Response(
          JSON.stringify({
            error: "Valid UUIDv4 'installation_id' is required for rollout evaluation",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const bucket = await computeRolloutBucket(installationId, target, latest.version);
      if (bucket >= latest.rollout_percentage) {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
    }

    // Đánh giá tính chất bắt buộc cập nhật
    const isUnderMinVersion = latest.min_supported_version
      ? compareSemver(currentVersion, latest.min_supported_version) < 0
      : false;
    const isCritical = latest.is_critical || isUnderMinVersion;

    // Trả về JSON theo chuẩn Tauri v2 Updater Protocol
    const responsePayload = {
      version: latest.version,
      notes: latest.release_notes || "",
      pub_date: latest.published_at,
      platforms: {
        [target]: {
          signature: latest.signature,
          url: latest.download_url,
        },
      },
      is_critical: isCritical,
      min_supported_version: latest.min_supported_version,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
