/**
 * useEvents Hook
 *
 * State management for events with real-time updates.
 */

import { eventsService } from '@/services/events';
import { Event, RSVP } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useEvents() {
  const { userId, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const userGroupIds = user?.groupIds || [];

    const unsubscribe = eventsService.subscribeToFeed(
      userId,
      userGroupIds,
      (feedEvents) => {
        setEvents(feedEvents);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Feed subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, user?.groupIds?.join(',')]);

  const refresh = useCallback(() => {
    // Real-time updates mean we don't need manual refresh
    // But we can trigger a re-subscribe
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return {
    events,
    isLoading,
    error,
    refresh,
  };
}

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = eventsService.subscribeToEvent(
      eventId,
      (eventData) => {
        setEvent(eventData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Event subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  return {
    event,
    isLoading,
    error,
  };
}

export function useEventRSVPs(eventId: string) {
  const { userId, user } = useAuth();
  const [rsvps, setRSVPs] = useState<RSVP[]>([]);
  const [userRSVP, setUserRSVP] = useState<RSVP | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setRSVPs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = eventsService.subscribeToRSVPs(
      eventId,
      (rsvpList) => {
        setRSVPs(rsvpList);
        // Find user's RSVP
        const myRSVP = rsvpList.find(r => r.userId === userId);
        setUserRSVP(myRSVP || null);
        setIsLoading(false);
      },
      (err) => {
        console.error('RSVPs subscription error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId, userId]);

  const setRSVP = useCallback(async (status: 'going' | 'maybe' | 'declined') => {
    if (!userId || !user) return;
    await eventsService.setRSVP(eventId, userId, user.fullName, status);
  }, [eventId, userId, user]);

  const removeRSVP = useCallback(async () => {
    if (!userId) return;
    await eventsService.removeRSVP(eventId, userId);
  }, [eventId, userId]);

  return {
    rsvps,
    userRSVP,
    isLoading,
    setRSVP,
    removeRSVP,
    counts: {
      going: rsvps.filter(r => r.status === 'going').length,
      maybe: rsvps.filter(r => r.status === 'maybe').length,
      declined: rsvps.filter(r => r.status === 'declined').length,
    },
  };
}

/**
 * Hook to get event IDs the user is "going" to
 */
export function useUserGoingEvents() {
  const { userId } = useAuth();
  const [goingEventIds, setGoingEventIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGoingEventIds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = eventsService.subscribeToUserGoingEvents(
      userId,
      (eventIds) => {
        setGoingEventIds(eventIds);
        setIsLoading(false);
      },
      (err) => {
        console.error('Going events subscription error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    goingEventIds,
    isLoading,
  };
}
