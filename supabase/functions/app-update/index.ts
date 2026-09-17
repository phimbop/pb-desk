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
    const arch = url.searchParams.get("arch")?.trim();
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

    // Build candidate targets for database lookup
    const targetLower = target.toLowerCase();
    const candidateTargets = new Set<string>();
    candidateTargets.add(target);
    candidateTargets.add(targetLower);

    if (targetLower === "linux" || targetLower.startsWith("linux-")) {
      candidateTargets.add("linux");
      candidateTargets.add("linux-x86_64");
      candidateTargets.add("linux-x86_64-appimage");
      candidateTargets.add("linux-x86_64-deb");
    } else if (targetLower === "windows" || targetLower.startsWith("windows-")) {
      candidateTargets.add("windows");
      candidateTargets.add("windows-x86_64");
      candidateTargets.add("windows-x86_64-nsis");
      candidateTargets.add("windows-x86_64-msi");
    } else if (targetLower === "darwin" || targetLower.startsWith("darwin-")) {
      candidateTargets.add("darwin");
      if (arch === "x86_64") {
        candidateTargets.add("darwin-x86_64");
        candidateTargets.add("darwin-x86_64-app");
      } else {
        candidateTargets.add("darwin-aarch64");
        candidateTargets.add("darwin-aarch64-app");
        candidateTargets.add("darwin-x86_64");
      }
    }

    // Lấy danh sách các bản phát hành active cho candidate targets và channel
    const { data: releases, error } = await supabase
      .from("app_versions")
      .select("*")
      .in("target", Array.from(candidateTargets))
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

    // Lấy tất cả records cho phiên bản này để tạo platforms dictionary đầy đủ
    const { data: allVersionRecords } = await supabase
      .from("app_versions")
      .select("*")
      .eq("version", latest.version)
      .eq("channel", channel)
      .eq("is_active", true);

    const platforms: Record<string, { signature: string; url: string }> = {};

    for (const rec of allVersionRecords || [latest]) {
      const artifact = {
        signature: rec.signature,
        url: rec.download_url,
      };
      platforms[rec.target] = artifact;

      // Chuẩn hóa và mở rộng các alias nền tảng cho Tauri v2
      if (rec.target === "linux-x86_64" || rec.target === "linux") {
        platforms["linux"] = artifact;
        platforms["linux-x86_64"] = artifact;
        platforms["linux-x86_64-appimage"] = artifact;
        platforms["linux-x86_64-deb"] = artifact;
      } else if (rec.target === "windows-x86_64" || rec.target === "windows") {
        platforms["windows"] = artifact;
        platforms["windows-x86_64"] = artifact;
        platforms["windows-x86_64-nsis"] = artifact;
        platforms["windows-x86_64-msi"] = artifact;
      } else if (rec.target === "darwin-aarch64") {
        platforms["darwin"] = artifact;
        platforms["darwin-aarch64"] = artifact;
        platforms["darwin-aarch64-app"] = artifact;
      } else if (rec.target === "darwin-x86_64") {
        platforms["darwin-x86_64"] = artifact;
        platforms["darwin-x86_64-app"] = artifact;
      }
    }

    // Đảm bảo target được gọi có trong dictionary
    if (!platforms[target]) {
      platforms[target] = {
        signature: latest.signature,
        url: latest.download_url,
      };
    }

    // Trả về JSON theo chuẩn Tauri v2 Updater Protocol
    const responsePayload = {
      version: latest.version,
      notes: latest.release_notes || "",
      pub_date: latest.published_at,
      platforms,
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
