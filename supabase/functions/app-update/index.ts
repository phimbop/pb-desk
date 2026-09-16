import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Hàm so sánh SemVer đơn giản: trả về > 0 nếu v1 > v2, 0 nếu v1 == v2, < 0 nếu v1 < v2
export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^v/, "").split("-")[0];
  const parts1 = clean(v1).split(".").map((n) => parseInt(n, 10) || 0);
  const parts2 = clean(v2).split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Tauri v2 endpoints truyền: target (ví dụ windows-x86_64) và current_version (ví dụ 0.1.0)
    const target = url.searchParams.get("target");
    const currentVersion = url.searchParams.get("current_version") || "0.0.0";
    const channel = url.searchParams.get("channel") || "stable";

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing 'target' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Truy vấn phiên bản mới nhất đang active cho target và channel này
    const { data: releases, error } = await supabase
      .from("app_versions")
      .select("*")
      .eq("target", target)
      .eq("channel", channel)
      .eq("is_active", true)
      .order("published_at", { ascending: false });

    if (error || !releases || releases.length === 0) {
      // 204 No Content thông báo cho Tauri updater rằng không có bản cập nhật
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Tìm bản release có version cao nhất lớn hơn current_version
    const latest = releases.find((r) => compareSemver(r.version, currentVersion) > 0);

    if (!latest) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Kiểm tra Staged Rollout (nếu rollout_percentage < 100)
    if (latest.rollout_percentage < 100) {
      const random = Math.floor(Math.random() * 100);
      if (random >= latest.rollout_percentage) {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
    }

    // Kiểm tra tính chất force update nếu phiên bản hiện tại nhỏ hơn min_supported_version
    const isUnderMinVersion = latest.min_supported_version
      ? compareSemver(currentVersion, latest.min_supported_version) < 0
      : false;
    const isCritical = latest.is_critical || isUnderMinVersion;

    // Chuẩn format JSON của Tauri v2 Updater Plugin
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
      // Metadata mở rộng hỗ trợ UI client
      is_critical: isCritical,
      min_supported_version: latest.min_supported_version,
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
