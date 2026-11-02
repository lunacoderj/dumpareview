const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server', 'index.js');
let content = fs.readFileSync(serverFile, 'utf8');

const target = 'const PORT = process.env.PORT || 5000;';

const addition = `
// =========================================================================
// 24-HOUR REVIEW VERIFICATION AUDIT AGENT (Daily at 00:00 midnight)
// =========================================================================
async function run24HourReviewAudit() {
  console.log('[24H AUDIT AGENT] Starting daily verification cycle at 00:00...');
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const batchId = 'BATCH-' + new Date().toISOString().slice(0, 10);

    const { data: eligibleScans, error: scanErr } = await supabase
      .from('scan_events')
      .select('id, qr_code_id, message_used, scanned_at, qr_codes(id, name, user_id, google_review_link)')
      .eq('verification_status', 'pending')
      .lte('scanned_at', twentyFourHoursAgo);

    if (scanErr) throw scanErr;
    if (!eligibleScans || eligibleScans.length === 0) {
      console.log('[24H AUDIT AGENT] No pending scans >= 24 hours old. Pending scans under 24 hours deferred to next 24h run.');
      return { success: true, count: 0 };
    }

    console.log('[24H AUDIT AGENT] Found ' + eligibleScans.length + ' eligible scans to verify...');

    const { data: scraped } = await supabase
      .from('apify_scraped_reviews')
      .select('review_text, reviewer_name, stars')
      .limit(200);

    let successCount = 0;
    let failCount = 0;

    for (const scan of eligibleScans) {
      const msg = (scan.message_used || '').toLowerCase().replace(/[^\\w\\s]/g, '').trim();
      let matchFound = false;

      if (scraped && scraped.length > 0 && msg.length > 5) {
        for (const rev of scraped) {
          const revText = (rev.review_text || '').toLowerCase().replace(/[^\\w\\s]/g, '').trim();
          if (revText.includes(msg) || msg.includes(revText)) {
            matchFound = true;
            break;
          }
        }
      }

      const status = matchFound ? 'verified_success' : 'verified_fail';
      if (status === 'verified_success') successCount++;
      else failCount++;

      await supabase
        .from('scan_events')
        .update({
          verification_status: status,
          verified_at: new Date().toISOString(),
          verification_batch_id: batchId,
          agent_notes: matchFound ? 'Verified on Google Maps by 24hr Agent' : 'Not found in 24hr audit cycle',
        })
        .eq('id', scan.id);
    }

    console.log('[24H AUDIT AGENT] Audit finished. ' + successCount + ' verified success, ' + failCount + ' fail.');
    return { success: true, count: eligibleScans.length, successCount, failCount };
  } catch (err) {
    console.error('[24H AUDIT AGENT ERROR]:', err);
    return { success: false, error: err.message };
  }
}

// Daily Cron at 00:00 midnight (24-hour cycle)
cron.schedule('0 0 * * *', () => {
  console.log('[CRON] Executing 24-Hour Review Verification Audit...');
  run24HourReviewAudit();
});

// Endpoint for manual or Vercel cron invocation
app.get('/api/cron/audit-reviews', async (req, res) => {
  const result = await run24HourReviewAudit();
  res.json(result);
});

app.post('/api/cron/audit-reviews', async (req, res) => {
  const result = await run24HourReviewAudit();
  res.json(result);
});

`;

if (!content.includes('run24HourReviewAudit')) {
  content = content.replace(target, addition + target);
  fs.writeFileSync(serverFile, content, 'utf8');
  console.log('Successfully updated server/index.js');
} else {
  console.log('Already updated');
}
