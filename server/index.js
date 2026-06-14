require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const multer = require('multer');
const exifr = require('exifr');
const imghash = require('imghash');
const Tesseract = require('tesseract.js');
const { Jimp } = require('jimp');

const upload = multer({ storage: multer.memoryStorage() });

// Helper to send Push Notification
async function sendPushNotification(userId, title, body) {
  try {
    // 1. Get user FCM token
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('fcm_token')
      .eq('user_id', userId)
      .single();

    // 2. Save notification to database
    await supabase.from('notifications').insert({
      user_id: userId,
      title: title,
      message: body
    });

    // 3. Send Push Notification if they have a token
    if (userProfile && userProfile.fcm_token) {
      await admin.messaging().send({
        token: userProfile.fcm_token,
        notification: {
          title,
          body
        }
      });
      console.log(`Push notification sent to ${userId}`);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

async function notifyAdmin(title, body) {
  if (!process.env.ADMIN_EMAIL) return;
  try {
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', process.env.ADMIN_EMAIL)
      .single();
      
    if (adminProfile) {
      await sendPushNotification(adminProfile.user_id, title, body);
    }
  } catch (err) {
    console.error('Error notifying admin:', err);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend (with dummy key if missing)
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

// Initialize Firebase Admin (only for token verification, no service account needed just projectId)
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'jagadeeshdashboard'
});

console.log("Starting DumpAReview Backend Cron Services and API...");

// -------------------------------------------------------------
// MIDDLEWARE: Verify Firebase Auth Token
// -------------------------------------------------------------
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('requireAuth failed: missing or invalid header. Header is:', authHeader);
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error.message, error.code);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// -------------------------------------------------------------
// CRON: 20-Minute Anti-Hoarding Timer
// -------------------------------------------------------------
// Runs every 5 minutes to release tasks locked longer than 20 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('[CRON] Running 20-minute anti-hoarding check...');
  try {
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    
    // Find all assigned messages where assigned_at is older than 20 mins
    const { data: expiredTasks, error: fetchErr } = await supabase
      .from('review_messages')
      .select('id')
      .eq('status', 'assigned')
      .lt('assigned_at', twentyMinsAgo);

    if (fetchErr) throw fetchErr;

    if (expiredTasks && expiredTasks.length > 0) {
      const expiredIds = expiredTasks.map(t => t.id);
      
      const { error: updateErr } = await supabase
        .from('review_messages')
        .update({ status: 'available', assigned_to: null, assigned_at: null })
        .in('id', expiredIds);

      if (updateErr) throw updateErr;
      
      console.log(`[CRON] Released ${expiredTasks.length} hoarded tasks.`);
    } else {
      console.log(`[CRON] No hoarded tasks found.`);
    }
  } catch (error) {
    console.error('[CRON ERROR] Anti-hoarding check failed:', error.message);
  }
});

// -------------------------------------------------------------
// CRON: 6-Hour Maturation Timer
// -------------------------------------------------------------
// Runs every hour to flag mature submissions for admin audit
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running 6-hour maturation check...');
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data: matureSubs, error: fetchErr } = await supabase
      .from('submissions')
      .select('id, user_profiles(email, full_name)')
      .eq('status', 'pending')
      .eq('twelve_hour_check_triggered', false)
      .lt('submitted_at', sixHoursAgo);

    if (fetchErr) throw fetchErr;

    if (matureSubs && matureSubs.length > 0) {
      const matureIds = matureSubs.map(s => s.id);
      
      const { error: updateErr } = await supabase
        .from('submissions')
        .update({ twelve_hour_check_triggered: true })
        .in('id', matureIds);

      if (updateErr) throw updateErr;
      
      console.log(`[CRON] Flagged ${matureSubs.length} submissions for admin review.`);

      // Optional: Send Notification/Email to Admin
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: 'Admin <onboarding@resend.dev>',
          to: process.env.ADMIN_EMAIL,
          subject: 'DumpAReview: Submissions Ready for Audit',
          html: `<p>${matureSubs.length} submissions have matured past 6 hours and are waiting in the queue.</p>`
        }).catch(err => console.error("Email error:", err.message));
      }

    } else {
      console.log(`[CRON] No new mature submissions found.`);
    }
  } catch (error) {
    console.error('[CRON ERROR] Maturation check failed:', error.message);
  }
});

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Endpoint to get Wall of Fame (Public)
app.get('/api/public/wall-of-fame', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wall_of_fame')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty array gracefully
        return res.json([]);
      }
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching wall of fame:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to add to Wall of Fame (Admin)
app.post('/api/admin/wall-of-fame', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { image_url, description, amount } = req.body;
    if (!image_url || !description) return res.status(400).json({ error: "Missing required fields" });

    const { data, error } = await supabase
      .from('wall_of_fame')
      .insert([{ image_url, description, amount }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error adding to wall of fame:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to delete from Wall of Fame (Admin)
app.delete('/api/admin/wall-of-fame/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('wall_of_fame')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting from wall of fame:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS API
// -------------------------------------------------------------

// Update FCM Token
app.post('/api/user/fcm-token', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const { error } = await supabase
      .from('user_profiles')
      .update({ fcm_token: token })
      .eq('user_id', req.user.uid);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get User Notifications
app.get('/api/user/notifications', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.uid)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === '42P01') return res.json([]); // Table doesn't exist yet
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
app.put('/api/user/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', req.user.uid);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/user/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.uid)
      .eq('read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to trigger resend email (Can be called from Frontend Admin proofs)
app.post('/api/send-payout-email', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { to, amount, name } = req.body;
    if (!to || !amount) return res.status(400).json({ error: "Missing to or amount" });

    const data = await resend.emails.send({
      from: 'DumpAReview <onboarding@resend.dev>',
      to: [to],
      subject: 'Payout Sent! 💰',
      html: `<p>Hi ${name || 'User'},</p><p>We just sent ₹${amount} to your PhonePe account! Check your dashboard for the receipt.</p>`,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// NEW SECURE API ROUTES (Replacing direct frontend calls)
// -------------------------------------------------------------

// -- USER ROUTES --
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.uid)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Create if missing
      let { data: newData, error: insertError } = await supabase
        .from('user_profiles')
        .insert([{ user_id: req.user.uid, email: req.user.email, last_login: new Date().toISOString() }])
        .select()
        .single();
        
      if (insertError && insertError.message && insertError.message.includes('last_login')) {
        // Fallback if last_login column hasn't been added to Supabase yet
        const retry = await supabase
          .from('user_profiles')
          .insert([{ user_id: req.user.uid, email: req.user.email }])
          .select()
          .single();
        newData = retry.data;
        insertError = retry.error;
      }
      
      if (insertError) throw insertError;
      data = newData;
      // Notify admin of new user
      await notifyAdmin('New User Registration 👤', `A new user (${req.user.email}) has joined DumpAReview.`);
    } else if (error) {
      throw error;
    } else {
      // Update last_login on profile fetch to track user login/activity time
      const currentLogin = new Date().toISOString();
      await supabase
        .from('user_profiles')
        .update({ last_login: currentLogin })
        .eq('user_id', req.user.uid);
      data.last_login = currentLogin;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { phonepe_details } = req.body;
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ phonepe_details })
      .eq('user_id', req.user.uid)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/active', requireAuth, async (req, res) => {
  try {
    const { data: camps, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (campError) throw campError;

    const availableCamps = (camps || []).filter(c => c.current_count < c.target_count);
    res.json(availableCamps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Issued View logic
app.get('/api/public/campaigns/:id/task', async (req, res) => {
  try {
    const campaignId = req.params.id;
    // Just assign a new message to nobody (assigned_to: null, but status: assigned? Or just send one without locking if we want to allow public use without hoarding lock, but wait! We should lock it to avoid giving same message to two people at same time)
    // To keep it simple, we can just assign to a dummy ID or just set status='assigned'
    let msgToUse = null;
    
    const { data: availableMsgs } = await supabase
      .from('review_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'available')
      .limit(1);

    if (!availableMsgs || availableMsgs.length === 0) return res.status(404).json({ error: "No tasks left" });

    const targetMsg = availableMsgs[0];
    const { data: updatedMsg, error: lockErr } = await supabase
      .from('review_messages')
      .update({ status: 'assigned', assigned_at: new Date().toISOString() })
      .eq('id', targetMsg.id)
      .eq('status', 'available')
      .select()
      .single();

    if (lockErr || !updatedMsg) return res.status(409).json({ error: "Task unavailable" });
    msgToUse = updatedMsg;

    const { data: camp } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    res.json({ message: msgToUse, campaign: camp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/check-email', async (req, res) => {
  try {
    const { campaign_id, email } = req.query;
    if (!campaign_id || !email) return res.status(400).json({ error: 'Missing parameters' });
    
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('extracted_email', email)
      .neq('status', 'rejected')
      .limit(1);
      
    if (existing && existing.length > 0) {
      return res.json({ exists: true });
    }
    
    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id/task', requireAuth, async (req, res) => {
  try {
    const campaignId = req.params.id;
    // 1. Check existing submission
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', req.user.uid)
      .single();

    if (existingSub) {
      const { data: msg } = await supabase.from('review_messages').select('*').eq('id', existingSub.message_id).single();
      const { data: camp } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
      return res.json({ submission: existingSub, message: msg, campaign: camp });
    }

    // 2. Check assigned message
    let msgToUse = null;
    const { data: activeMsg } = await supabase
      .from('review_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('assigned_to', req.user.uid)
      .eq('status', 'assigned')
      .single();

    if (activeMsg) {
      msgToUse = activeMsg;
    } else {
      // 3. Assign new
      const { data: availableMsgs } = await supabase
        .from('review_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'available')
        .limit(1);

      if (!availableMsgs || availableMsgs.length === 0) return res.status(404).json({ error: "No tasks left" });

      const targetMsg = availableMsgs[0];
      const { data: updatedMsg, error: lockErr } = await supabase
        .from('review_messages')
        .update({ status: 'assigned', assigned_to: req.user.uid, assigned_at: new Date().toISOString() })
        .eq('id', targetMsg.id)
        .eq('status', 'available')
        .select()
        .single();

      if (lockErr || !updatedMsg) return res.status(409).json({ error: "Task unavailable" });
      msgToUse = updatedMsg;
    }

    const { data: camp } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    res.json({ submission: null, message: msgToUse, campaign: camp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function processImageSubmission(buffer, cropCoordsStr, campaign_company_name) {
  let is_flagged = false;
  try {
    const exifData = await exifr.parse(buffer);
    if (exifData && exifData.Software) {
      is_flagged = true;
    }
  } catch (e) {}

  let image_hash = null;
  try {
    image_hash = await imghash.hash(buffer);
  } catch (e) {
    console.error("Error hashing image:", e);
  }

  let jimpImage = await Jimp.read(buffer);
  let uploadImage = jimpImage.clone(); // Clone the full image for uploading

  if (cropCoordsStr) {
    try {
      const coords = JSON.parse(cropCoordsStr);
      if (coords.width && coords.height) {
        jimpImage.crop({ x: Math.round(coords.x), y: Math.round(coords.y), w: Math.round(coords.width), h: Math.round(coords.height) });
      }
    } catch(e) {
      console.error("Error cropping image:", e);
    }
  }

  // Optimize cropped image for OCR
  if (jimpImage.bitmap.width > 1024) {
    jimpImage.resize({ w: 1024 });
  }
  const ocrBuffer = await jimpImage.getBuffer('image/jpeg', { quality: 80 });

  // Optimize full image for upload
  if (uploadImage.bitmap.width > 1024) {
    uploadImage.resize({ w: 1024 });
  }
  const uploadBuffer = await uploadImage.getBuffer('image/jpeg', { quality: 80 });

  let extracted_name = null;
  let ocr_verified = false;
  try {
    const { data: { text } } = await Tesseract.recognize(ocrBuffer, 'eng');
    if (campaign_company_name && text.toLowerCase().includes(campaign_company_name.toLowerCase())) {
      ocr_verified = true;
    }
    const byMatch = text.match(/By\s+([A-Z][a-z]+(\s[A-Z][a-z]+)*)/i);
    if (byMatch) {
      extracted_name = byMatch[1];
    }
  } catch (e) {
    console.error("OCR Error:", e);
  }

  const filename = `submissions/${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('screenshots')
    .upload(filename, uploadBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) throw new Error("Failed to upload image: " + uploadError.message);

  const { data: publicUrlData } = supabase.storage.from('screenshots').getPublicUrl(filename);
  
  return {
    screenshot_url: publicUrlData.publicUrl,
    is_flagged,
    image_hash,
    ocr_verified,
    extracted_name
  };
}

app.post('/api/submissions', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { campaign_id, message_id, extracted_email, crop_coords } = req.body;
    
    const { data: camp } = await supabase.from('campaigns').select('company_name').eq('id', campaign_id).single();
    
    let screenshot_url = req.body.screenshot_url;
    let is_flagged = false;
    let image_hash = null;

    if (req.file) {
      const result = await processImageSubmission(req.file.buffer, crop_coords, camp?.company_name);
      screenshot_url = result.screenshot_url;
      is_flagged = result.is_flagged;
      image_hash = result.image_hash;
    }

    if (extracted_email) {
      // Check if email already exists for this campaign
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('campaign_id', campaign_id)
        .eq('extracted_email', extracted_email)
        .neq('status', 'rejected')
        .limit(1);
        
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "Email already exists for this campaign. Submission rejected." });
      }
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert([{
        user_id: req.user.uid,
        campaign_id,
        message_id,
        screenshot_url,
        extracted_email,
        image_hash,
        is_flagged,
        status: 'pending'
      }])
      .select()
      .single();
    if (error) throw error;
    
    // Notify Admin of new submission
    await notifyAdmin('New Review Submitted 📝', `A new review is waiting in the queue for campaign ID: ${campaign_id}.`);
    
    res.json(data);
  } catch (err) {
    console.error("Submission Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUBLIC ENDPOINTS

app.get('/api/public/campaigns/:id/task', async (req, res) => {
  try {
    const campaignId = req.params.id;
    // Pick a random available message
    const { data: availableMsgs } = await supabase
      .from('review_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'available')
      .limit(1);

    if (!availableMsgs || availableMsgs.length === 0) return res.status(404).json({ error: "No tasks left" });

    const targetMsg = availableMsgs[0];
    const { data: updatedMsg, error: lockErr } = await supabase
      .from('review_messages')
      .update({ status: 'assigned', assigned_to: 'public_pending', assigned_at: new Date().toISOString() })
      .eq('id', targetMsg.id)
      .eq('status', 'available')
      .select()
      .single();

    if (lockErr || !updatedMsg) return res.status(409).json({ error: "Task unavailable, please try again." });

    const { data: camp } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    res.json({ message: updatedMsg, campaign: camp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/public/submissions', upload.single('screenshot'), async (req, res) => {
  try {
    console.log('[DEBUG] /api/public/submissions hit.');
    console.log('[DEBUG] req.body:', req.body);
    console.log('[DEBUG] req.file:', req.file);
    console.log('[DEBUG] Content-Type:', req.headers['content-type']);
    const { campaign_id, extracted_email, referrer_uid, crop_coords } = req.body || {};
    let { message_id } = req.body || {};

    if (!campaign_id) {
      return res.status(400).json({ error: "Campaign ID is missing." });
    }
    if (!referrer_uid) {
      return res.status(400).json({ error: "Referrer UID is missing. Cannot attribute reward." });
    }

    if (!message_id) {
      // Find a message that was assigned to public_pending for this campaign
      const { data: pendingMsgs } = await supabase
        .from('review_messages')
        .select('id')
        .eq('campaign_id', campaign_id)
        .eq('status', 'assigned')
        .eq('assigned_to', 'public_pending')
        .limit(1);
      
      if (pendingMsgs && pendingMsgs.length > 0) {
        message_id = pendingMsgs[0].id;
      } else {
        // Fallback: Pick an available message if no public_pending is found
        const { data: availableMsgs } = await supabase
          .from('review_messages')
          .select('id')
          .eq('campaign_id', campaign_id)
          .eq('status', 'available')
          .limit(1);
          
        if (availableMsgs && availableMsgs.length > 0) {
          message_id = availableMsgs[0].id;
        }
      }
    }

    const { data: camp } = await supabase.from('campaigns').select('company_name').eq('id', campaign_id).single();

    let screenshot_url = req.body.screenshot_url;
    let is_flagged = false;
    let image_hash = null;

    if (req.file) {
      const result = await processImageSubmission(req.file.buffer, crop_coords, camp?.company_name);
      screenshot_url = result.screenshot_url;
      is_flagged = result.is_flagged;
      image_hash = result.image_hash;
    }

    if (extracted_email) {
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('campaign_id', campaign_id)
        .eq('extracted_email', extracted_email)
        .neq('status', 'rejected')
        .limit(1);

      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "Email already exists for this campaign. Submission rejected." });
      }
    }

    // Insert submission attributed to the referrer
    const { data, error } = await supabase
      .from('submissions')
      .insert([{
        user_id: referrer_uid,
        campaign_id,
        message_id,
        screenshot_url,
        extracted_email,
        image_hash,
        is_flagged,
        status: 'pending'
      }])
      .select()
      .single();
    if (error) throw error;

    // Optional: mark message as completed
    if (message_id) {
      await supabase.from('review_messages').update({ status: 'completed' }).eq('id', message_id);
    }

    await notifyAdmin('New Public Review Submitted 📝', `A new public review is waiting in the queue for campaign ID: ${campaign_id}.`);

    res.json(data);
  } catch (err) {
    console.error("Public Submission Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submissions/:id/trigger', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('submissions')
      .update({ twelve_hour_check_triggered: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.uid);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/submissions', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, campaigns(company_name), review_messages(message_text)')
      .eq('user_id', req.user.uid)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/status', requireAuth, async (req, res) => {
  try {
    // 1. Check for active disputes
    const { data: disputes } = await supabase
      .from('review_disputes')
      .select('*, submissions( campaigns(company_name) )')
      .eq('user_id', req.user.uid)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);

    if (disputes && disputes.length > 0) {
      return res.json({ status: 'dispute', dispute: disputes[0] });
    }

    // 2. Check for recent payouts
    const { data: payouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', req.user.uid)
      .order('created_at', { ascending: false })
      .limit(1);

    if (payouts && payouts.length > 0) {
      const p = payouts[0];
      return res.json({ status: p.status === 'pending' ? 'processing' : 'completed', payout: p });
    }

    // Check streak
    const { data: profile } = await supabase.from('user_profiles').select('current_streak').eq('user_id', req.user.uid).single();
    if (profile && profile.current_streak >= 10) {
      return res.json({ status: 'processing' });
    }

    res.json({ status: 'none' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/disputes/:id/resolve', requireAuth, async (req, res) => {
  try {
    await supabase.from('review_disputes').update({ status: 'resolved' }).eq('id', req.params.id).eq('user_id', req.user.uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- ADMIN ROUTES --
// Fetch all campaigns (Admin)
app.get('/api/admin/campaigns', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('campaigns').select('*, review_messages (id, status, message_text)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all registered users (Admin)
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/campaigns', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { company_name, google_review_link, target_count, current_count, is_active } = req.body;
    const { data, error } = await supabase.from('campaigns').insert([{
      company_name, google_review_link, target_count, current_count, is_active
    }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/campaigns/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    const { error } = await supabase.from('campaigns').update({ is_active }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { company_name, google_review_link, target_count, current_count } = req.body;
    const { data, error } = await supabase.from('campaigns').update({
      company_name, google_review_link, target_count, current_count
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('campaigns').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/campaigns/:id/messages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { messages } = req.body;
    const payload = messages.map(m => ({ campaign_id: req.params.id, message_text: m, status: 'available' }));
    const { error } = await supabase.from('review_messages').insert(payload);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/messages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('review_messages').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/messages/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { message_text } = req.body;
    const { error } = await supabase.from('review_messages').update({ message_text }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/queue', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, screenshot_url, submitted_at, twelve_hour_check_triggered, status, rejection_reason, extracted_email, image_hash, is_flagged, user_profiles ( user_id, full_name, email ), campaigns ( id, company_name ), review_messages ( id, message_text )')
      .order('submitted_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/queue/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sub } = req.body;
    await supabase.from('submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', sub.id);
    await supabase.from('review_messages').update({ status: 'completed' }).eq('id', sub.review_messages.id);
    
    const { data: camp } = await supabase.from('campaigns').select('current_count').eq('id', sub.campaigns.id).single();
    if (camp) await supabase.from('campaigns').update({ current_count: camp.current_count + 1 }).eq('id', sub.campaigns.id);

    const { data: usr } = await supabase.from('user_profiles').select('current_streak, lifetime_reviews').eq('user_id', sub.user_profiles.user_id).single();
    if (usr) {
      const newStreak = usr.current_streak + 1;
      await supabase.from('user_profiles').update({ current_streak: newStreak, lifetime_reviews: usr.lifetime_reviews + 1 }).eq('user_id', sub.user_profiles.user_id);
      
      // Send general approval notification
      await sendPushNotification(sub.user_profiles.user_id, 'Review Approved! ✅', `Your review submission for ${sub.campaigns.company_name} was approved. You are at ${newStreak}/10 reviews!`);

      // If completed 10 reviews
      if (newStreak === 10) {
        await notifyAdmin('Payout Milestone Reached! 🏆', `User ${sub.user_profiles.email} has completed 10 reviews.`);
        await sendPushNotification(sub.user_profiles.user_id, 'Milestone Reached! 🎉', 'You have completed 10 reviews! Admin will review your account for payout.');
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/queue/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sub, reason } = req.body;
    await supabase.from('submissions').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', sub.id);
    if (sub.review_messages) {
      await supabase.from('review_messages').update({ status: 'available', assigned_to: null, assigned_at: null }).eq('id', sub.review_messages.id);
    }
    
    await sendPushNotification(sub.user_profiles.user_id, 'Review Rejected ❌', `Your recent review submission was rejected. Reason: ${reason}. Please check your active tasks to try again.`);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/queue/bulk-approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { submissionIds } = req.body;
    if (!submissionIds || !submissionIds.length) return res.status(400).json({ error: "No submissions provided" });

    const { data: subs, error: fetchErr } = await supabase
      .from('submissions')
      .select('id, campaigns(id, company_name), user_profiles(user_id, current_streak, lifetime_reviews, email), review_messages(id)')
      .in('id', submissionIds);
      
    if (fetchErr) throw fetchErr;

    for (const sub of subs) {
      await supabase.from('submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', sub.id);
      if (sub.review_messages) {
        await supabase.from('review_messages').update({ status: 'completed' }).eq('id', sub.review_messages.id);
      }
      
      if (sub.campaigns) {
        const { data: camp } = await supabase.from('campaigns').select('current_count').eq('id', sub.campaigns.id).single();
        if (camp) await supabase.from('campaigns').update({ current_count: camp.current_count + 1 }).eq('id', sub.campaigns.id);
      }

      if (sub.user_profiles) {
        const newStreak = sub.user_profiles.current_streak + 1;
        await supabase.from('user_profiles').update({ current_streak: newStreak, lifetime_reviews: sub.user_profiles.lifetime_reviews + 1 }).eq('user_id', sub.user_profiles.user_id);
        
        await sendPushNotification(sub.user_profiles.user_id, 'Review Approved! ✅', `Your review submission for ${sub.campaigns.company_name} was approved. You are at ${newStreak}/10 reviews!`);

        if (newStreak === 10) {
          await notifyAdmin('Payout Milestone Reached! 🏆', `User ${sub.user_profiles.email} has completed 10 reviews.`);
          await sendPushNotification(sub.user_profiles.user_id, 'Milestone Reached! 🎉', 'You have completed 10 reviews! Admin will review your account for payout.');
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/queue/bulk-reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { submissionIds, reason } = req.body;
    if (!submissionIds || !submissionIds.length) return res.status(400).json({ error: "No submissions provided" });

    const { data: subs, error: fetchErr } = await supabase
      .from('submissions')
      .select('id, user_profiles(user_id), review_messages(id)')
      .in('id', submissionIds);
      
    if (fetchErr) throw fetchErr;

    for (const sub of subs) {
      await supabase.from('submissions').update({ status: 'rejected', rejection_reason: reason || 'Bulk Rejected', reviewed_at: new Date().toISOString() }).eq('id', sub.id);
      if (sub.review_messages) {
        await supabase.from('review_messages').update({ status: 'available', assigned_to: null, assigned_at: null }).eq('id', sub.review_messages.id);
      }
      
      if (sub.user_profiles) {
        await sendPushNotification(sub.user_profiles.user_id, 'Review Rejected ❌', `Your recent review submission was rejected. Reason: ${reason || 'Bulk Rejected'}. Please check your active tasks to try again.`);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/audit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').gte('current_streak', 10).order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/audit/:uid/submissions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, screenshot_url, status, campaigns(company_name), review_messages(message_text)')
      .eq('user_id', req.params.uid)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/audit/:uid/clear', requireAuth, requireAdmin, async (req, res) => {
  try {
    await supabase.from('payouts').insert([{ user_id: req.params.uid, amount: 50, receipt_url: '', status: 'pending' }]);
    await supabase.from('user_profiles').update({ current_streak: 0 }).eq('user_id', req.params.uid);
    
    await sendPushNotification(req.params.uid, 'Account Audited & Payout Initiated 💸', 'Admin has verified your 10 reviews and initiated a ₹50 payout to your PhonePe account.');
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/audit/:uid/dispute', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { submissionId, adminMsg, currentStreak } = req.body;
    await supabase.from('review_disputes').insert([{ user_id: req.params.uid, submission_id: submissionId, admin_message: adminMsg }]);
    await supabase.from('user_profiles').update({ current_streak: Math.max(0, currentStreak - 1) }).eq('user_id', req.params.uid);
    
    await sendPushNotification(req.params.uid, 'Review Disputed ⚠️', `Admin message: ${adminMsg}`);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/proofs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('id, amount, status, created_at, user_profiles ( user_id, full_name, email, phonepe_details )')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/proofs/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { publicUrl } = req.body;
    
    // Get the payout to notify the right user
    const { data: payout } = await supabase.from('payouts').select('user_id, amount').eq('id', req.params.id).single();
    
    await supabase.from('payouts').update({ status: 'completed', receipt_url: publicUrl }).eq('id', req.params.id);
    
    if (payout) {
      await sendPushNotification(payout.user_id, 'Payout Completed! 💰', `Your payout of ₹${payout.amount} has been sent and the receipt is available.`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
