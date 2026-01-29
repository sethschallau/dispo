# Task 06: Feed Screen

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-05 complete |
| **Estimated time** | 30 minutes |

## What Needs to Happen

Build the main feed screen showing events the user can see (public + their groups).

## Implementation

### 1. Create Events Service
Create `services/events.ts`:
```typescript
import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { Event, generateInviteCode } from '@/types';

export const eventsService = {
  /** Subscribe to events for a user's feed */
  subscribeFeed(
    userId: string,
    groupIds: string[],
    callback: (events: Event[]) => void
  ) {
    const eventsRef = collection(db, 'events');
    const allEvents: Map<string, Event> = new Map();
    const unsubscribes: (() => void)[] = [];

    // Query 1: Public events
    const publicQuery = query(
      eventsRef,
      where('visibility', '==', 'public'),
      orderBy('eventDate')
    );
    
    unsubscribes.push(
      onSnapshot(publicQuery, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
        });
        emitFiltered();
      })
    );

    // Query 2: User's private events
    const privateQuery = query(
      eventsRef,
      where('visibility', '==', 'private'),
      where('creatorId', '==', userId)
    );
    
    unsubscribes.push(
      onSnapshot(privateQuery, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
        });
        emitFiltered();
      })
    );

    // Query 3: Group events for each group
    groupIds.forEach((groupId) => {
      const groupQuery = query(
        eventsRef,
        where('visibility', '==', 'group'),
        where('groupId', '==', groupId)
      );
      
      unsubscribes.push(
        onSnapshot(groupQuery, (snapshot) => {
          snapshot.docs.forEach((doc) => {
            allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
          });
          emitFiltered();
        })
      );
    });

    function emitFiltered() {
      const events = Array.from(allEvents.values())
        .filter((event) => {
          // Filter out if user is excluded
          if (event.excludedUserIds?.includes(userId)) return false;
          return true;
        })
        .sort((a, b) => {
          const aDate = a.eventDate instanceof Timestamp ? a.eventDate.toMillis() : 0;
          const bDate = b.eventDate instanceof Timestamp ? b.eventDate.toMillis() : 0;
          return aDate - bDate;
        });
      
      callback(events);
    }

    // Return unsubscribe function
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  },

  /** Create a new event */
  async create(eventData: Omit<Event, 'id' | 'createdAt' | 'inviteCode'>): Promise<string> {
    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdAt: serverTimestamp(),
      inviteCode: generateInviteCode(),
      invitedUserIds: [],
    });
    return docRef.id;
  },

  /** Get single event */
  async get(eventId: string): Promise<Event | null> {
    const docRef = doc(db, 'events', eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return null;
  },

  /** Update event */
  async update(eventId: string, data: Partial<Event>): Promise<void> {
    const docRef = doc(db, 'events', eventId);
    await updateDoc(docRef, data);
  },

  /** Delete event */
  async delete(eventId: string): Promise<void> {
    const docRef = doc(db, 'events', eventId);
    await deleteDoc(docRef);
  },

  /** Find event by invite code */
  async findByCode(code: string): Promise<Event | null> {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('inviteCode', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Event;
  },
};
```

### 2. Create Event Card Component
Create `components/EventCard.tsx`:
```typescript
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, toDate } from '@/types';
import { useRouter } from 'expo-router';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const eventDate = toDate(event.eventDate);
  const isPast = eventDate < new Date();

  const visibilityIcon = {
    public: 'globe-outline',
    group: 'people-outline',
    private: 'lock-closed-outline',
    friends: 'person-outline',
  }[event.visibility] || 'eye-outline';

  return (
    <TouchableOpacity
      style={[styles.card, isPast && styles.cardPast]}
      onPress={() => router.push(`/event/${event.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateMonth}>
          {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={styles.dateDay}>{eventDate.getDate()}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        
        {event.location && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.meta} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.meta}>
            {eventDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </Text>
          
          <View style={styles.badge}>
            <Ionicons name={visibilityIcon as any} size={12} color="#666" />
            <Text style={styles.badgeText}>{event.visibility}</Text>
          </View>
        </View>
      </View>

      {event.imageUrl && (
        <Image source={{ uri: event.imageUrl }} style={styles.thumbnail} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPast: {
    opacity: 0.6,
  },
  dateBox: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
    textTransform: 'capitalize',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 8,
  },
});
```

### 3. Create useEvents Hook
Create `hooks/useEvents.ts`:
```typescript
import { useState, useEffect } from 'react';
import { eventsService } from '@/services/events';
import { useAuth } from './useAuth';
import { Event } from '@/types';

export function useEvents() {
  const { userId, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const groupIds = user?.groupIds || [];

    const unsubscribe = eventsService.subscribeFeed(
      userId,
      groupIds,
      (newEvents) => {
        setEvents(newEvents);
        setIsLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [userId, user?.groupIds?.join(',')]);

  const upcomingEvents = events.filter((e) => {
    const date = e.eventDate?.toDate?.() || new Date(0);
    return date >= new Date();
  });

  const pastEvents = events
    .filter((e) => {
      const date = e.eventDate?.toDate?.() || new Date(0);
      return date < new Date();
    })
    .reverse();

  return {
    events,
    upcomingEvents,
    pastEvents,
    isLoading,
    error,
  };
}
```

### 4. Update Feed Screen
Update `app/(tabs)/index.tsx`:
```typescript
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/EventCard';
import { useState } from 'react';

export default function FeedScreen() {
  const router = useRouter();
  const { upcomingEvents, pastEvents, isLoading } = useEvents();
  const [refreshing, setRefreshing] = useState(false);

  const sections = [
    { title: 'Upcoming', data: upcomingEvents },
    { title: 'Past', data: pastEvents },
  ].filter((s) => s.data.length > 0);

  const onRefresh = async () => {
    setRefreshing(true);
    // Events auto-refresh via subscription, just show indicator briefly
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading events...</Text>
      </View>
    );
  }

  if (upcomingEvents.length === 0 && pastEvents.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptyText}>
          Create an event or join a group to see events here
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/event/create')}
        >
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/event/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
```

## Files to Create
- [ ] `services/events.ts`
- [ ] `components/EventCard.tsx`
- [ ] `hooks/useEvents.ts`
- [ ] Update `app/(tabs)/index.tsx`

## Acceptance Criteria
- [ ] Feed loads events from Firestore
- [ ] Real-time updates when events change
- [ ] Events sorted by date (upcoming first)
- [ ] Tapping event navigates to detail
- [ ] FAB opens create event
- [ ] Empty state when no events
- [ ] Pull to refresh

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add feed screen with events"
```
