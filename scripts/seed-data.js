// Seed realistic test data for Dispo MVP
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dispo-2faf1'
});

const db = admin.firestore();

async function clearCollections() {
  console.log('🧹 Clearing existing data...');
  
  const collections = ['users', 'groups', 'events'];
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log(`   Deleted ${snapshot.docs.length} docs from ${col}`);
    }
  }
}

async function seedAll() {
  try {
    await clearCollections();
    
    // ===== USERS =====
    console.log('\n👤 Creating users...');
    
    const users = [
      {
        id: '9195551234',
        data: {
          phone: '9195551234',
          username: 'clive',
          fullName: 'Seth',
          bio: 'Building things. Running places.',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          groupIds: []
        }
      },
      {
        id: '9195552345',
        data: {
          phone: '9195552345',
          username: 'amanda_k',
          fullName: 'Amanda',
          bio: 'Weekend adventurer',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          groupIds: []
        }
      },
      {
        id: '9195553456',
        data: {
          phone: '9195553456',
          username: 'mike_runs',
          fullName: 'Mike',
          bio: 'Marathon enthusiast',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          groupIds: []
        }
      }
    ];

    for (const user of users) {
      await db.collection('users').doc(user.id).set(user.data);
      console.log(`   ✅ ${user.data.fullName} (${user.id})`);
    }

    // ===== GROUPS =====
    console.log('\n👥 Creating groups...');
    
    const charlestonGroup = db.collection('groups').doc('charleston_crew');
    await charlestonGroup.set({
      name: 'Charleston Race Crew',
      description: 'Half marathon squad',
      ownerId: '9195551234',
      members: ['9195551234', '9195552345', '9195553456'],
      joinCode: 'RACE26',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Charleston Race Crew');

    const hikingGroup = db.collection('groups').doc('nc_hikers');
    await hikingGroup.set({
      name: 'NC Hikers',
      description: 'Triangle area trails',
      ownerId: '9195551234',
      members: ['9195551234', '9195552345'],
      joinCode: 'HIKE26',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ NC Hikers');

    // Update users with group IDs
    await db.collection('users').doc('9195551234').update({
      groupIds: ['charleston_crew', 'nc_hikers']
    });
    await db.collection('users').doc('9195552345').update({
      groupIds: ['charleston_crew', 'nc_hikers']
    });
    await db.collection('users').doc('9195553456').update({
      groupIds: ['charleston_crew']
    });

    // ===== EVENTS =====
    console.log('\n📅 Creating events...');

    // Event 1: Charleston post-race beers (group)
    const event1 = db.collection('events').doc('charleston_beers');
    await event1.set({
      title: 'Post-Race Beers',
      description: 'Celebrating surviving the half! Meet at the finish area, then we\'ll find a spot downtown.',
      eventDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-01T17:00:00')),
      location: 'Downtown Charleston',
      visibility: 'group',
      creatorId: '9195551234',
      groupId: 'charleston_crew',
      imageUrl: null,
      excludedUserIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Post-Race Beers (group)');

    // Event 2: Umstead recovery run (public)
    const event2 = db.collection('events').doc('umstead_recovery');
    await event2.set({
      title: 'Umstead Recovery Run',
      description: 'Easy 5 miles on the trails. Shake out the legs after race weekend.',
      eventDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-05T07:30:00')),
      location: 'Umstead State Park - Harrison Ave entrance',
      visibility: 'public',
      creatorId: '9195551234',
      groupId: null,
      imageUrl: null,
      excludedUserIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Umstead Recovery Run (public)');

    // Event 3: Pilot Mountain hike (group - hikers)
    const event3 = db.collection('events').doc('pilot_mountain');
    await event3.set({
      title: 'Pilot Mountain Day Trip',
      description: 'Summit hike + picnic. Bring snacks. Weather permitting.',
      eventDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-15T09:00:00')),
      location: 'Pilot Mountain State Park',
      visibility: 'group',
      creatorId: '9195552345',
      groupId: 'nc_hikers',
      imageUrl: null,
      excludedUserIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Pilot Mountain Day Trip (group)');

    // Event 4: Private reminder
    const event4 = db.collection('events').doc('dentist_appt');
    await event4.set({
      title: 'Dentist Appointment',
      description: 'Cleaning at 2pm',
      eventDate: admin.firestore.Timestamp.fromDate(new Date('2026-02-10T14:00:00')),
      location: 'Downtown Dental',
      visibility: 'private',
      creatorId: '9195551234',
      groupId: null,
      imageUrl: null,
      excludedUserIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Dentist Appointment (private)');

    // ===== COMMENTS =====
    console.log('\n💬 Adding comments...');

    await event1.collection('comments').add({
      authorId: '9195552345',
      authorName: 'Amanda',
      text: 'Can\'t wait! Any restaurant preferences?',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await event1.collection('comments').add({
      authorId: '9195553456',
      authorName: 'Mike',
      text: 'Somewhere with good beer selection 🍺',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    await event2.collection('comments').add({
      authorId: '9195552345',
      authorName: 'Amanda',
      text: 'I might join! How far is easy?',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('   ✅ Added comments to events');

    // ===== NOTIFICATIONS =====
    console.log('\n🔔 Creating notifications...');

    await db.collection('users').doc('9195551234').collection('notifications').add({
      type: 'new_comment',
      message: "Amanda commented on 'Post-Race Beers'",
      relatedId: 'charleston_beers',
      relatedType: 'event',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      fromUserId: '9195552345'
    });

    await db.collection('users').doc('9195551234').collection('notifications').add({
      type: 'new_event',
      message: "Amanda created 'Pilot Mountain Day Trip' in NC Hikers",
      relatedId: 'pilot_mountain',
      relatedType: 'event',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      fromUserId: '9195552345'
    });

    console.log('   ✅ Added notifications');

    console.log('\n🎉 Seed complete!');
    console.log('\n📱 Test login credentials:');
    console.log('   Phone: 9195551234 | Name: Seth');
    console.log('   Phone: 9195552345 | Name: Amanda');
    console.log('   Phone: 9195553456 | Name: Mike');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedAll();
