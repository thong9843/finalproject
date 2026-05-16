const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let bucket = null;

try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // The user must set FIREBASE_STORAGE_BUCKET in .env
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-bucket-name.appspot.com'
        });

        bucket = admin.storage().bucket();
        console.log('Firebase Admin initialized successfully.');
    } else {
        console.warn('Firebase serviceAccountKey.json not found. Firebase features will be disabled.');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
}

module.exports = bucket;
