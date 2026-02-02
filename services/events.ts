/**
 * Events Service
 *
 * Firestore operations for events with real-time subscriptions.
 * Handles the complex visibility logic for the feed.
 */

import { Event, RSVP, RSVPStatus, generateInviteCode } from '@/types';
import {
    Timestamp,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';

const EVENTS_COLLECTION = 'events';

export const eventsService = {
  /**
   * Subscribe to events for the feed
   * Shows: public events + user's group events + user's private events
   */
  subscribeToFeed(
    userId: string,
    userGroupIds: string[],
    onData: (events: Event[]) => void,
    onError: (error: Error) => void
  ): () => void {
    // We need to do multiple queries and merge results
    // 1. Public events
    // 2. Events where user is creator
    // 3. Events in user's groups
    // 4. Events where user is invited

    const eventsRef = collection(db, EVENTS_COLLECTION);
    const allEvents = new Map<string, Event>();
    let unsubscribes: (() => void)[] = [];

    const updateEvents = () => {
      // Convert map to array, filter excluded, sort by date
      const events = Array.from(allEvents.values())
        .filter(e => !e.excludedUserIds?.includes(userId))
        .sort((a, b) => {
          const dateA = a.eventDate?.toMillis() ?? 0;
          const dateB = b.eventDate?.toMillis() ?? 0;
          return dateA - dateB; // Ascending (upcoming first)
        });
      onData(events);
    };

    // Query 1: Public events
    const publicQuery = query(
      eventsRef,
      where('visibility', '==', 'public'),
      orderBy('eventDate', 'asc'),
      limit(50)
    );

    unsubscribes.push(
      onSnapshot(publicQuery, (snapshot) => {
        snapshot.docs.forEach(doc => {
          allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
        });
        updateEvents();
      }, onError)
    );

    // Query 2: Events created by user
    const myEventsQuery = query(
      eventsRef,
      where('creatorId', '==', userId),
      orderBy('eventDate', 'asc'),
      limit(50)
    );

    unsubscribes.push(
      onSnapshot(myEventsQuery, (snapshot) => {
        snapshot.docs.forEach(doc => {
          allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
        });
        updateEvents();
      }, onError)
    );

    // Query 3: Events where user is invited
    const invitedQuery = query(
      eventsRef,
      where('invitedUserIds', 'array-contains', userId),
      orderBy('eventDate', 'asc'),
      limit(50)
    );

    unsubscribes.push(
      onSnapshot(invitedQuery, (snapshot) => {
        snapshot.docs.forEach(doc => {
          allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
        });
        updateEvents();
      }, onError)
    );

    // Query 4: Group events (one query per group, max 10 groups)
    const groupsToQuery = userGroupIds.slice(0, 10);
    groupsToQuery.forEach(groupId => {
      const groupQuery = query(
        eventsRef,
        where('groupId', '==', groupId),
        orderBy('eventDate', 'asc'),
        limit(20)
      );

      unsubscribes.push(
        onSnapshot(groupQuery, (snapshot) => {
          snapshot.docs.forEach(doc => {
            allEvents.set(doc.id, { id: doc.id, ...doc.data() } as Event);
          });
          updateEvents();
        }, onError)
      );
    });

    // Return cleanup function
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  },

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Event;
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  },

  /**
   * Subscribe to a single event
   */
  subscribeToEvent(
    eventId: string,
    onData: (event: Event | null) => void,
    onError: (error: Error) => void
  ): () => void {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData({ id: docSnap.id, ...docSnap.data() } as Event);
      } else {
        onData(null);
      }
    }, onError);
  },

  /**
   * Create a new event
   */
  async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'inviteCode'>): Promise<string> {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const newDocRef = doc(eventsRef);

    const eventData: Omit<Event, 'id'> = {
      ...data,
      inviteCode: generateInviteCode(),
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(newDocRef, eventData);
    return newDocRef.id;
  },

  /**
   * Update an event
   */
  async updateEvent(eventId: string, data: Partial<Event>): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, data);
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(docRef);
  },

  /**
   * Upload event image
   */
  async uploadEventImage(eventId: string, imageUri: string): Promise<string> {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const imageRef = ref(storage, `events/${eventId}/image.jpg`);
    await uploadBytes(imageRef, blob);

    const downloadUrl = await getDownloadURL(imageRef);

    // Update event with image URL
    await this.updateEvent(eventId, { imageUrl: downloadUrl });

    return downloadUrl;
  },

  /**
   * Find event by invite code
   */
  async findByInviteCode(code: string): Promise<Event | null> {
    try {
      const eventsRef = collection(db, EVENTS_COLLECTION);
      const q = query(eventsRef, where('inviteCode', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Event;
    } catch (error) {
      console.error('Error finding event by code:', error);
      return null;
    }
  },

  /**
   * Join event via invite code
   */
  async joinByInviteCode(eventId: string, userId: string): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Event not found');

    const event = docSnap.data() as Event;
    const invitedUserIds = event.invitedUserIds || [];

    if (!invitedUserIds.includes(userId)) {
      await updateDoc(docRef, {
        invitedUserIds: [...invitedUserIds, userId]
      });
    }
  },

  // ============================================
  // RSVP Operations
  // ============================================

  /**
   * Subscribe to RSVPs for an event
   */
  subscribeToRSVPs(
    eventId: string,
    onData: (rsvps: RSVP[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const rsvpsRef = collection(db, EVENTS_COLLECTION, eventId, 'rsvps');
    const q = query(rsvpsRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const rsvps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RSVP[];
      onData(rsvps);
    }, onError);
  },

  /**
   * Get user's RSVP for an event
   */
  async getUserRSVP(eventId: string, userId: string): Promise<RSVP | null> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, eventId, 'rsvps', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as RSVP;
      }
      return null;
    } catch (error) {
      console.error('Error getting RSVP:', error);
      return null;
    }
  },

  /**
   * Set or update RSVP
   */
  async setRSVP(
    eventId: string,
    userId: string,
    userName: string,
    status: RSVPStatus
  ): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId, 'rsvps', userId);

    const rsvpData: Omit<RSVP, 'id'> = {
      userId,
      userName,
      status,
      timestamp: serverTimestamp() as Timestamp,
    };

    await setDoc(docRef, rsvpData);
  },

  /**
   * Remove RSVP
   */
  async removeRSVP(eventId: string, userId: string): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId, 'rsvps', userId);
    await deleteDoc(docRef);
  },

  /**
   * Get RSVP counts for an event
   */
  async getRSVPCounts(eventId: string): Promise<Record<RSVPStatus, number>> {
    const rsvpsRef = collection(db, EVENTS_COLLECTION, eventId, 'rsvps');
    const snapshot = await getDocs(rsvpsRef);

    const counts: Record<RSVPStatus, number> = {
      going: 0,
      maybe: 0,
      declined: 0,
    };

    snapshot.docs.forEach(doc => {
      const status = doc.data().status as RSVPStatus;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  },

  /**
   * Get all events where user has RSVP'd "going"
   * Uses collection group query on rsvps subcollection
   */
  subscribeToUserGoingEvents(
    userId: string,
    onData: (eventIds: string[]) => void,
    onError: (error: Error) => void
  ): () => void {
    // Collection group query on all rsvps subcollections
    const rsvpsGroup = collectionGroup(db, 'rsvps');
    const q = query(
      rsvpsGroup,
      where('userId', '==', userId),
      where('status', '==', 'going')
    );

    return onSnapshot(q, (snapshot) => {
      // Extract event IDs from the RSVP document paths
      // Path is: events/{eventId}/rsvps/{rsvpId}
      const eventIds = snapshot.docs.map(doc => {
        const pathParts = doc.ref.path.split('/');
        // pathParts = ['events', eventId, 'rsvps', rsvpId]
        return pathParts[1];
      });
      onData(eventIds);
    }, onError);
  },
};
