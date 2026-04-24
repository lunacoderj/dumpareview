import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const OLD_DB_DIR = 'old-database';
const PROFILES_CSV = path.join(OLD_DB_DIR, 'profiles-export-2026-04-23_09-51-38.csv');
const QR_CODES_CSV = path.join(OLD_DB_DIR, 'qr_codes-export-2026-04-23_09-52-35.csv');
const SCAN_EVENTS_CSV = path.join(OLD_DB_DIR, 'scan_events-export-2026-04-23_09-48-58.csv');

async function migrate() {
  console.log('Starting migration...');

  // 1. Fetch live profiles
  const { data: liveProfiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) throw pError;
  
  const emailToLiveUserId = new Map();
  liveProfiles.forEach(p => emailToLiveUserId.set(p.email.toLowerCase(), p.user_id));

  // 2. Read profiles CSV to map CSV user_id to email
  const profilesContent = fs.readFileSync(PROFILES_CSV, 'utf-8');
  const csvProfiles = parse(profilesContent, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true
  });

  const csvUserIdToLiveUserId = new Map();
  csvProfiles.forEach(p => {
    const liveUserId = emailToLiveUserId.get(p.email.toLowerCase());
    if (liveUserId) {
      csvUserIdToLiveUserId.set(p.user_id, liveUserId);
      console.log(`Mapped CSV user ${p.user_id} to live user ${liveUserId} (${p.email})`);
    } else {
      console.warn(`No live profile found for email: ${p.email}`);
    }
  });

  // 3. Migrate QR Codes
  console.log('Migrating QR codes...');
  const qrCodesContent = fs.readFileSync(QR_CODES_CSV, 'utf-8');
  const csvQrCodes = parse(qrCodesContent, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true
  });

  const qrCodesToUpsert = csvQrCodes.map(row => {
    const liveUserId = csvUserIdToLiveUserId.get(row.user_id);
    if (!liveUserId) {
      console.error(`Skipping QR code ${row.id}: No mapping for CSV user_id ${row.user_id}`);
      return null;
    }

    // Parse messages array
    let messages = [];
    try {
      if (row.messages.startsWith('[') || row.messages.startsWith('{')) {
         // Replace Postgres style array {a,b} with JSON style ["a","b"] if needed
         let jsonStr = row.messages;
         if (jsonStr.startsWith('{')) jsonStr = '[' + jsonStr.slice(1, -1) + ']';
         messages = JSON.parse(jsonStr);
      } else {
         messages = [row.messages];
      }
    } catch (e) {
      console.warn(`Error parsing messages for QR ${row.id}:`, e.message);
      // Fallback: split by comma if it looks like a simple list
      messages = row.messages.replace(/[[\]{}]/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }

    // Parse message_used_counts array
    let usedCounts = [];
    try {
      if (row.message_used_counts.startsWith('[') || row.message_used_counts.startsWith('{')) {
        let jsonStr = row.message_used_counts;
        if (jsonStr.startsWith('{')) jsonStr = '[' + jsonStr.slice(1, -1) + ']';
        usedCounts = JSON.parse(jsonStr);
      } else if (row.message_used_counts) {
        usedCounts = row.message_used_counts.split(',').map(Number);
      }
    } catch (e) {
      console.warn(`Error parsing usedCounts for QR ${row.id}:`, e.message);
      usedCounts = row.message_used_counts.replace(/[[\]{}]/g, '').split(',').map(Number);
    }

    return {
      id: row.id,
      user_id: liveUserId,
      name: row.name,
      google_review_link: row.google_review_link,
      messages: messages,
      current_message_index: parseInt(row.current_message_index) || 0,
      successful_scans: parseInt(row.successful_scans) || 0,
      message_used_counts: usedCounts,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }).filter(Boolean);

  if (qrCodesToUpsert.length > 0) {
    const { error: qrUpsertError } = await supabase.from('qr_codes').upsert(qrCodesToUpsert);
    if (qrUpsertError) {
      console.error('Error upserting QR codes:', qrUpsertError);
    } else {
      console.log(`Successfully upserted ${qrCodesToUpsert.length} QR codes.`);
    }
  }

  // 4. Migrate Scan Events
  console.log('Migrating Scan events...');
  const scanEventsContent = fs.readFileSync(SCAN_EVENTS_CSV, 'utf-8');
  const csvScanEvents = parse(scanEventsContent, {
    columns: true,
    delimiter: ',', // Commas for scan events
    skip_empty_lines: true
  });

  // Verify qr_code_id mapping (though they are UUIDs and should match)
  const scanEventsToUpsert = csvScanEvents.map(row => ({
    id: row.id,
    qr_code_id: row.qr_code_id,
    message_used: row.message_used,
    message_index: parseInt(row.message_index) || 0,
    scanned_at: row.scanned_at
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < scanEventsToUpsert.length; i += BATCH_SIZE) {
    const batch = scanEventsToUpsert.slice(i, i + BATCH_SIZE);
    const { error: seError } = await supabase.from('scan_events').upsert(batch);
    if (seError) {
      console.error(`Error upserting scan events batch starting at ${i}:`, seError);
    } else {
      console.log(`Upserted scan events batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)`);
    }
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
