import { createClient } from "@supabase/supabase-js";

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
}

// Vercel Serverless Function Cron Handler (Runs daily at 00:00 UTC)
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Missing Supabase credentials in environment" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const batchId = `BATCH-${new Date().toISOString().slice(0, 10)}`;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    console.log(`[Daily Cron Audit] Running at ${new Date().toISOString()}...`);

    // 1. Forward audit execution to Render backend (which has Apify Google Maps scraper)
    try {
      const serverRes = await fetch("https://dumpareview.onrender.com/api/cron/audit-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        return res.status(200).json({
          success: true,
          forwardedToServer: true,
          serverResult: serverData,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("[Cron Audit] Render backend trigger delayed, falling back to database check:", err);
    }

    // 2. Fallback: Database scan check
    const { data: pendingScans, error: fetchErr } = await supabase
      .from("scan_events")
      .select("id, qr_code_id, message_used, scanned_at, marked_for_audit, audit_count, qr_codes(id, name, user_id, google_review_link)")
      .eq("verification_status", "pending")
      .order("scanned_at", { ascending: true })
      .limit(200);

    if (fetchErr) throw fetchErr;

    // Dual-Condition Eligibility Filter:
    // Either manually marked by owner (marked_for_audit = true) OR aged >= 24 hours
    const eligibleScans = (pendingScans || []).filter((s: { marked_for_audit?: boolean; scanned_at: string }) => {
      if (s.marked_for_audit) return true;
      return new Date(s.scanned_at) <= new Date(twentyFourHoursAgo);
    });

    if (eligibleScans.length === 0) {
      console.log("[Daily Cron Audit] No eligible scans. Scans under 24 hours not marked for audit deferred to next cycle.");
      return res.status(200).json({
        success: true,
        message: "No eligible scans ready. Scans under 24 hours deferred to next cycle.",
        auditedCount: 0,
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Query scraped Google reviews
    const { data: scraped } = await supabase
      .from("apify_scraped_reviews")
      .select("review_text, reviewer_name")
      .limit(300);

    for (const scan of eligibleScans) {
      const msg = (scan.message_used || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
      let matchFound = false;

      if (scraped && scraped.length > 0 && msg.length > 5) {
        for (const rev of scraped) {
          const revText = (rev.review_text || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
          if (revText.includes(msg) || msg.includes(revText)) {
            matchFound = true;
            break;
          }
        }
      }

      const status = matchFound ? "verified_success" : "verified_fail";
      if (status === "verified_success") successCount++;
      else failCount++;

      const currentAuditCount = (scan.audit_count || 0) + 1;

      await supabase
        .from("scan_events")
        .update({
          verification_status: status,
          marked_for_audit: false,
          audit_count: currentAuditCount,
          verified_at: new Date().toISOString(),
          verification_batch_id: batchId,
          agent_notes: matchFound ? "Verified on Google Maps by Daily Agent" : "Not found in daily audit cycle",
        })
        .eq("id", scan.id);
    }

    return res.status(200).json({
      success: true,
      batchId,
      auditedCount: eligibleScans.length,
      successCount,
      failCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[Daily Cron Audit Error]:", error);
    const message = error instanceof Error ? error.message : "Audit execution failed";
    return res.status(500).json({ error: message });
  }
}
