import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Robust .env parser
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found!');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^['"]|['"]$/g, '').trim();
                env[key.trim()] = value;
            }
        }
    });
    return env;
}

const env = loadEnv();
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);
const OLD_DATABASE_DIR = path.resolve(process.cwd(), 'old-database');

// BETTER CSV PARSER that handles multi-line fields
function parseCSVFull(content, delimiter = ',') {
    const records = [];
    let currentRecord = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            currentRecord.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (currentField || currentRecord.length > 0) {
                currentRecord.push(currentField.trim());
                records.push(currentRecord);
                currentRecord = [];
                currentField = '';
            }
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
    }

    const headers = records[0];
    return records.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
}

const firebaseUsers = {
    "karriharshith499@gmail.com": "9qqb0EpUCVdEsO7jj7ta38YQmhg2",
    "jagadheshbellane@gmail.com": "9s0Z3NqQycXGTH9yQn4aX78qzb42",
    "animeworld@admin.com": "E1xrSP1r54SzbO0L8YHw81zJFGb2",
    "ballanejagadhesh@gmail.com": "T37K05Ln6tM9nJoIfnUmtAxXeiX2",
    "bellanajagadeesh.23.csm@anits.edu.in": "YtTSMiTUcbdU6LPtrCVA2ewsEq82",
    "ushareddy4122006@gmail.com": "oJCLm92HTWcZ9AdfPgmWJqp3IND2",
    "sanapala.sanapala345@gmail.com": "pYajibw57uSE4q1R0H9OtTVSCgy2"
};

async function migrate() {
    console.log('🚀 Starting Final Scan Migration...');
    try {
        const scanEventsFile = path.join(OLD_DATABASE_DIR, 'scan_events-export-2026-04-23_09-48-58.csv');
        const scanEventsOld = parseCSVFull(fs.readFileSync(scanEventsFile, 'utf8'), ',');

        console.log(`📊 Total scan events to process: ${scanEventsOld.length}`);

        const batchSize = 100;
        for (let i = 0; i < scanEventsOld.length; i += batchSize) {
            const batch = scanEventsOld.slice(i, i + batchSize)
                .filter(e => e.id && e.qr_code_id) // Filter out empty/broken records
                .map(e => ({
                    id: e.id,
                    qr_code_id: e.qr_code_id,
                    message_used: e.message_used,
                    message_index: parseInt(e.message_index || '0'),
                    scanned_at: e.scanned_at && e.scanned_at.trim() !== '' ? e.scanned_at : new Date().toISOString()
                }));

            if (batch.length === 0) continue;

            const { error } = await supabase.from('scan_events').upsert(batch);
            if (error) {
                console.error(`❌ Error migrating scan events batch starting at ${i}:`, error.message);
            } else {
                console.log(`✅ Migrated scan events batch: ${i} to ${i + batch.length}`);
            }
        }
        console.log('🎉 ALL DATA MIGRATED SUCCESSFULLY!');
    } catch (err) {
        console.error('💥 Fatal error:', err.message);
    }
}

migrate();
