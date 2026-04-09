const admin = require('firebase-admin');
const path = require('path');

// NOTE: Use the service account JSON you just downloaded
const serviceAccountPath = 'c:\\Users\\uwaba\\Downloads\\extremestudio-46b04006478c.json';

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const auth = admin.auth();
const db = admin.firestore();

const CEO_EMAIL = 'nadjibullahu@gmail.com';
const CEO_PASSWORD = 'Nadjibullah001!';

async function bootstrap() {
  console.log('--- CEO Bootstrapping Script ---');
  
  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(CEO_EMAIL);
      console.log('User already exists in Firebase Auth.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new user in Firebase Auth...');
        userRecord = await auth.createUser({
          email: CEO_EMAIL,
          password: CEO_PASSWORD,
          emailVerified: true,
          displayName: 'CEO'
        });
        console.log('Successfully created user.');
      } else {
        throw error;
      }
    }

    console.log('Updating Firestore document for user:', userRecord.uid);
    await db.collection('users').doc(userRecord.uid).set({
      email: CEO_EMAIL,
      role: 'CEO',
      approved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('Successfully updated Firestore role to CEO.');
    console.log('--- Done ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during bootstrapping:', err);
    process.exit(1);
  }
}

bootstrap();
