# Task 14: Remaining Features

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-13 complete |
| **Estimated time** | 45 minutes |

These features follow the same patterns. Implement in order:

---

## 14a: Photo Sharing

**Service (`services/events.ts`):**
```typescript
async uploadPhoto(eventId: string, uri: string, userId: string, userName: string) {
  const filename = `${Date.now()}.jpg`;
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `events/${eventId}/photos/${filename}`);
  await uploadBytes(storageRef, blob);
  const imageUrl = await getDownloadURL(storageRef);
  
  await addDoc(collection(db, 'events', eventId, 'photos'), {
    uploaderId: userId,
    uploaderName: userName,
    imageUrl,
    timestamp: serverTimestamp(),
  });
}

subscribePhotos(eventId: string, callback: (photos: EventPhoto[]) => void) {
  return onSnapshot(
    query(collection(db, 'events', eventId, 'photos'), orderBy('timestamp')),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as EventPhoto[])
  );
}
```

**Component:** Create `components/EventPhotos.tsx` with image grid and picker.

**Rule:** Only allow uploads if `event.eventDate < Date.now()` (past events).

---

## 14b: User Search

**Service (`services/users.ts`):**
```typescript
async search(query: string, limit = 10): Promise<User[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', query.toLowerCase()),
    where('username', '<=', query.toLowerCase() + '\uf8ff'),
    limit(limit)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
}
```

**Screen:** Create `app/users/search.tsx` with search input and results list.

**Use case:** Add members to groups, find friends.

---

## 14c: Local Notifications (Reminders)

**Install:**
```bash
npx expo install expo-notifications
```

**Service (`services/notifications.ts`):**
```typescript
import * as Notifications from 'expo-notifications';

export async function scheduleReminder(eventId: string, title: string, date: Date) {
  await Notifications.scheduleNotificationAsync({
    identifier: `event-${eventId}`,
    content: {
      title: 'Upcoming Event',
      body: title,
      data: { eventId },
    },
    trigger: {
      date: new Date(date.getTime() - 60 * 60 * 1000), // 1 hour before
    },
  });
}

export async function cancelReminder(eventId: string) {
  await Notifications.cancelScheduledNotificationAsync(`event-${eventId}`);
}
```

**UI:** Add bell icon to event detail that toggles reminder.

---

## 14d: In-App Notifications

**Service:** Already have notification schema. Create `services/notifications.ts`:
```typescript
subscribeNotifications(userId: string, callback: (notifs: AppNotification[]) => void) {
  return onSnapshot(
    query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(50)
    ),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as AppNotification[])
  );
}
```

**Screen:** Create `app/notifications.tsx` listing notifications with badge count.

---

## 14e: Group Admin Features

Add to `app/group/[id].tsx`:
- Remove member (owner only)
- Transfer ownership
- Delete group

Use methods already in `services/groups.ts`.

---

## Acceptance Criteria
- [ ] Photo sharing works on past events
- [ ] User search returns results
- [ ] Local reminders schedule/fire
- [ ] In-app notifications list shows
- [ ] Group admin controls work

## Commit after each sub-task
```bash
git add .
git commit -m "🍐 PearGuy: Add [feature name]"
```
