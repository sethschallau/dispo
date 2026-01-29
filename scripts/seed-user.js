// Seed a test user using Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dispo-2faf1'
});

const db = admin.firestore();

async function seedUser() {
  const userId = 'pear_guy';
  
  const userData = {
    phone: '+1234567890',
    username: 'pearguy',
    fullName: 'Pear Guy',
    bio: 'Your friendly neighborhood familiar 🍐',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    groupIds: []
  };

  try {
    await db.collection('users').doc(userId).set(userData);
    console.log('✅ Created user:', userId);
    
    // Verify by reading it back
    const doc = await db.collection('users').doc(userId).get();
    console.log('📄 User data:', doc.data());
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedUser();
