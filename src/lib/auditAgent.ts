import { supabase } from "@/lib/supabase/client";
import { differenceInHours } from "date-fns";

export interface AuditScanResult {
  scanId: string;
  qrId: string;
  qrName: string;
  messageUsed: string;
  scannedAt: string;
  hoursAgo: number;
  status: "verified_success" | "verified_fail";
  notes: string;
}

export interface AuditRunSummary {
  batchId: string;
  totalEligible: number;
  successCount: number;
  failCount: number;
  scansChecked: AuditScanResult[];
}

/**
 * Normalizes review text for reliable matching by removing excess whitespace,
 * punctuation, and casing differences.
 */
function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes simple word-overlap similarity ratio (0 to 1)
 */
function computeSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;
  if (norm2.includes(norm1) || norm1.includes(norm2)) return 0.95;

  const words1 = new Set(norm1.split(" "));
  const words2 = new Set(norm2.split(" "));
  let match = 0;
  for (const w of words1) {
    if (words2.has(w) && w.length > 2) match++;
  }
  const denominator = Math.max(words1.size, words2.size);
  return denominator > 0 ? match / denominator : 0;
}

/**
 * Executes 24-Hour Review Verification Audit
 * Enforces the strict 24-hour maturation rule:
 * Scans < 24 hours old are strictly held back for the next 24-hour cycle.
 */
export async function run24HourAuditAgent(userId?: string): Promise<AuditRunSummary> {
  const batchId = `BATCH-${new Date().toISOString().slice(0, 10)}`;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch pending scan events older than 24 hours
  let query = supabase
    .from("scan_events")
    .select("id, qr_code_id, message_used, scanned_at, qr_codes(id, name, user_id, google_review_link)")
    .eq("verification_status", "pending")
    .lte("scanned_at", twentyFourHoursAgo)
    .order("scanned_at", { ascending: true });

  const { data: eligibleScans, error: fetchErr } = await query;

  if (fetchErr || !eligibleScans || eligibleScans.length === 0) {
    return {
      batchId,
      totalEligible: 0,
      successCount: 0,
      failCount: 0,
      scansChecked: [],
    };
  }

  // Filter by user if specified
  const filtered = userId
    ? eligibleScans.filter((s: { qr_codes?: { user_id?: string } }) => s.qr_codes?.user_id === userId)
    : eligibleScans;

  let successCount = 0;
  let failCount = 0;
  const results: AuditScanResult[] = [];

  for (const scan of filtered) {
    const hours = differenceInHours(new Date(), new Date(scan.scanned_at));
    const msg = scan.message_used || "";
    const qrObj = scan.qr_codes as unknown as { id: string; name: string; google_review_link: string; user_id: string } | null;
    const qrName = qrObj?.name || "Business";

    // Matching against live Google review text
    // If Apify scraped reviews exist in database for this campaign/qr, query them:
    let matchFound = false;
    let matchNotes = "Audit completed by 24hr Agent";

    try {
      const { data: scraped } = await supabase
        .from("apify_scraped_reviews")
        .select("review_text, reviewer_name, stars")
        .limit(100);

      if (scraped && scraped.length > 0) {
        for (const rev of scraped) {
          const sim = computeSimilarity(msg, rev.review_text || "");
          if (sim >= 0.75) {
            matchFound = true;
            matchNotes = `Matched Google Review (${(sim * 100).toFixed(0)}% similarity by ${rev.reviewer_name || "customer"})`;
            break;
          }
        }
      }
    } catch {
      // apify_scraped_reviews table might be empty or optional
    }

    const finalStatus: "verified_success" | "verified_fail" = matchFound ? "verified_success" : "verified_fail";

    if (finalStatus === "verified_success") {
      successCount++;
    } else {
      failCount++;
    }

    // 2. Update scan event with audit result
    await supabase
      .from("scan_events")
      .update({
        verification_status: finalStatus,
        verified_at: new Date().toISOString(),
        verification_batch_id: batchId,
        agent_notes: matchNotes,
      })
      .eq("id", scan.id);

    results.push({
      scanId: scan.id,
      qrId: scan.qr_code_id,
      qrName,
      messageUsed: msg,
      scannedAt: scan.scanned_at,
      hoursAgo: hours,
      status: finalStatus,
      notes: matchNotes,
    });
  }

  // 3. Insert notification if user is logged in
  if (userId && results.length > 0) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "batch_audit_completed",
      title: "24-Hour Review Audit Complete",
      message: `24-Hour Agent verified ${results.length} scan(s): ${successCount} verified on Google, ${failCount} not found.`,
      action_type: "none",
      action_status: "accepted",
    });
  }

  return {
    batchId,
    totalEligible: results.length,
    successCount,
    failCount,
    scansChecked: results,
  };
}

