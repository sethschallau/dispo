/**
 * Notifications Service
 *
 * Firestore operations for user notifications.
 * Notifications are stored as subcollection: users/{userId}/notifications
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export interface Notification {
  id?: string;
  type: 'new_event' | 'new_comment' | 'rsvp_update' | 'group_invite';
  message: string;
  relatedId?: string;
  relatedType?: 'event' | 'group' | 'comment';
  timestamp?: any;
  read: boolean;
  fromUserId?: string;
}

export const notificationsService = {
  /**
   * Subscribe to user's notifications
   */
  subscribeToNotifications(
    userId: string,
    onData: (notifications: Notification[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        onData(notifications);
      },
      onError
    );
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    notificationIds.forEach((id) => {
      const docRef = doc(db, 'users', userId, 'notifications', id);
      batch.update(docRef, { read: true });
    });
    await batch.commit();
  },

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(docRef);
  },

  /**
   * Create a notification for a user
   * Used when creating events, comments, etc.
   */
  async createNotification(
    targetUserId: string,
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ): Promise<void> {
    const notificationsRef = collection(db, 'users', targetUserId, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      read: false,
      timestamp: serverTimestamp(),
    });
  },

  /**
   * Notify all group members about a new event
   */
  async notifyGroupOfNewEvent(
    groupMemberIds: string[],
    excludeUserId: string,
    eventId: string,
    eventTitle: string,
    creatorName: string
  ): Promise<void> {
    const recipients = groupMemberIds.filter((id) => id !== excludeUserId);

    await Promise.all(
      recipients.map((userId) =>
        this.createNotification(userId, {
          type: 'new_event',
          message: `${creatorName} created "${eventTitle}"`,
          relatedId: eventId,
          relatedType: 'event',
          fromUserId: excludeUserId,
        })
      )
    );
  },

  /**
   * Notify event creator about a new comment
   */
  async notifyOfNewComment(
    eventCreatorId: string,
    commenterId: string,
    commenterName: string,
    eventId: string,
    commentPreview: string
  ): Promise<void> {
    // Don't notify yourself
    if (eventCreatorId === commenterId) return;

    await this.createNotification(eventCreatorId, {
      type: 'new_comment',
      message: `${commenterName}: "${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '...' : ''}"`,
      relatedId: eventId,
      relatedType: 'event',
      fromUserId: commenterId,
    });
  },

  /**
   * Notify event creator about an RSVP
   */
  async notifyOfRSVP(
    eventCreatorId: string,
    rsvpUserId: string,
    rsvpUserName: string,
    eventId: string,
    status: string
  ): Promise<void> {
    // Don't notify yourself
    if (eventCreatorId === rsvpUserId) return;

    await this.createNotification(eventCreatorId, {
      type: 'rsvp_update',
      message: `${rsvpUserName} is ${status} to your event`,
      relatedId: eventId,
      relatedType: 'event',
      fromUserId: rsvpUserId,
    });
  },
};

// ============================================
// Sharing Service (iMessage, SMS, etc.)
// ============================================
import * as Sharing from 'expo-sharing';
import * as SMS from 'expo-sms';

export const sharingService = {
  /**
   * Share event via native share sheet (works on iOS/Android)
   */
  async shareEvent(event: {
    title: string;
    date: Date;
    location?: string;
    description?: string;
    eventId: string;
  }): Promise<boolean> {
    const dateStr = event.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = [
      `📅 ${event.title}`,
      `🗓 ${dateStr}`,
      event.location ? `📍 ${event.location}` : null,
      event.description ? `\n${event.description}` : null,
      `\nJoin me on Dispo!`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Sharing is not available on this device');
        return false;
      }
      // Note: expo-sharing works with files; for text we use SMS or clipboard
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  },

  /**
   * Share event via iMessage/SMS
   */
  async shareViaMessage(
    event: {
      title: string;
      date: Date;
      location?: string;
      description?: string;
    },
    recipients?: string[]
  ): Promise<{ result: 'sent' | 'cancelled' | 'unknown' }> {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      console.warn('SMS is not available on this device');
      return { result: 'unknown' };
    }

    const dateStr = event.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = [
      `📅 You're invited to: ${event.title}`,
      `🗓 ${dateStr}`,
      event.location ? `📍 ${event.location}` : null,
      event.description ? `\n${event.description}` : null,
      `\nSent via Dispo`,
    ]
      .filter(Boolean)
      .join('\n');

    const { result } = await SMS.sendSMSAsync(recipients || [], message);
    return { result };
  },

  /**
   * Check if SMS/iMessage is available
   */
  async isSMSAvailable(): Promise<boolean> {
    return SMS.isAvailableAsync();
  },
};
