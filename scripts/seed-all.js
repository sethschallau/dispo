// Seed test data for Dispo MVP
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dispo-2faf1'
});

const db = admin.firestore();

async function seedAll() {
  try {
    // 1. Create another test user (Seth)
    const sethId = 'seth_test';
    await db.collection('users').doc(sethId).set({
      phone: '+19195551234',
      username: 'clive',
      fullName: 'Seth',
      bio: 'Building cool stuff',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      groupIds: []
    });
    console.log('✅ Created user:', sethId);

    // 2. Create a group
    const groupRef = db.collection('groups').doc();
    const groupId = groupRef.id;
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await groupRef.set({
      name: 'Test Squad',
      ownerId: sethId,
      members: [sethId, 'pear_guy'],
      joinCode: joinCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Created group:', groupId, '(join code:', joinCode + ')');

    // Update users' groupIds
    await db.collection('users').doc(sethId).update({
      groupIds: admin.firestore.FieldValue.arrayUnion(groupId)
    });
    await db.collection('users').doc('pear_guy').update({
      groupIds: admin.firestore.FieldValue.arrayUnion(groupId)
    });
    console.log('✅ Updated users with groupId');

    // 3. Create a public event
    const publicEventRef = db.collection('events').doc();
    await publicEventRef.set({
      title: 'Public Hangout',
      description: 'Everyone is welcome!',
      eventDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-15T18:00:00')),
      location: 'Downtown Raleigh',
      visibility: 'public',
      creatorId: sethId,
      groupId: null,
      imageUrl: null,
      excludedUserIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Created public event:', publicEventRef.id);

    // 4. Create a group event
    const groupEventRef = db.collection('events').doc();
    await groupEventRef.set({
      title: 'Squad Movie Night',
      description: 'Watching something fun with the crew',
      eventDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-20T20:00:00')),
      location: 'My place',
      visibility: 'group',
      creatorId: sethId,
      groupId: groupId,
      imageUrl: null,
      excludedUserIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Created group event:', groupEventRef.id);

    // 5. Add a comment to the public event
    await publicEventRef.collection('comments').add({
      authorId: 'pear_guy',
      authorName: 'Pear Guy',
      text: 'Looking forward to this! 🍐',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Added comment to public event');

    // 6. Create a notification for pear_guy
    await db.collection('users').doc('pear_guy').collection('notifications').add({
      type: 'new_event',
      message: "Seth created 'Squad Movie Night' in Test Squad",
      relatedId: groupEventRef.id,
      relatedType: 'event',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      fromUserId: sethId
    });
    console.log('✅ Created notification for pear_guy');

    console.log('\n🎉 All seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAll();
