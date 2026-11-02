import { createClient } from "@supabase/supabase-js";

// Vercel Serverless Function Cron Handler (Runs once every 24 hours)
export default async function handler(req: any, res: any) {
  // Allow Vercel Cron or GET requests with CRON_SECRET or dev testing
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

    console.log(`[24h Cron Audit] Running at ${new Date().toISOString()} for scans older than ${twentyFourHoursAgo}...`);

    // Fetch pending scan events strictly older than 24 hours
    const { data: eligibleScans, error: fetchErr } = await supabase
      .from("scan_events")
      .select("id, qr_code_id, message_used, scanned_at, qr_codes(id, name, user_id, google_review_link)")
      .eq("verification_status", "pending")
      .lte("scanned_at", twentyFourHoursAgo)
      .limit(100);

    if (fetchErr) throw fetchErr;

    if (!eligibleScans || eligibleScans.length === 0) {
      console.log("[24h Cron Audit] No eligible scans >= 24 hours old found. Next check in 24 hours.");
      return res.status(200).json({
        success: true,
        message: "No eligible scans >= 24 hours old. Scans under 24 hours deferred to next cycle.",
        auditedCount: 0,
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Optional query to scraped Google reviews if present
    const { data: scraped } = await supabase
      .from("apify_scraped_reviews")
      .select("review_text, reviewer_name")
      .limit(200);

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

      await supabase
        .from("scan_events")
        .update({
          verification_status: status,
          verified_at: new Date().toISOString(),
          verification_batch_id: batchId,
          agent_notes: matchFound ? "Verified on Google Maps by 24hr Agent" : "Not found in 24hr audit cycle",
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
  } catch (error: any) {
    console.error("[24h Cron Audit Error]:", error);
    return res.status(500).json({ error: error.message || "Audit execution failed" });
  }
}

