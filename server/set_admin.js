require('dotenv').config();
const admin = require('firebase-admin');

// Ensure you have a service account or FIREBASE_PROJECT_ID set
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'jagadeeshdashboard'
});

async function setAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Success! Granted admin claim to ${email} (UID: ${user.uid})`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin claim:', error);
    process.exit(1);
  }
}

const targetEmail = process.env.ADMIN_EMAIL;
if (!targetEmail) {
  console.error('Please set ADMIN_EMAIL in your .env file');
  process.exit(1);
}

setAdminClaim(targetEmail);
