/**
 * Dispo Type Definitions
 * 
 * TypeScript types matching the Firestore schema.
 * Ported from Swift models in archive/swift-ios/dispo/Models/
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// User
// ============================================
export interface User {
  id?: string;
  username: string;
  fullName: string;
  phone?: string;
  profilePicUrl?: string;
  groupIds?: string[];
  bio?: string;
  createdAt?: Timestamp;
  fcmToken?: string;
}

// ============================================
// Group
// ============================================
export interface Group {
  id?: string;
  name: string;
  description?: string;
  members: string[];
  ownerId: string;
  joinCode?: string;
  createdAt?: Timestamp;
}

// ============================================
// Event
// ============================================
export interface Event {
  id?: string;
  title: string;
  description?: string;
  eventDate: Timestamp;
  creatorId: string;
  createdAt?: Timestamp;
  groupId?: string;
  visibility: EventVisibility;
  location?: string;
  imageUrl?: string;
  excludedUserIds?: string[];
  friendIds?: string[];
  groupIds?: string[];
  inviteCode?: string;       // Short code for sharing (e.g., "EVT-XK7M")
  invitedUserIds?: string[]; // Users who joined via invite code
}

export type EventVisibility = 'public' | 'group' | 'private' | 'friends';

export const EventVisibilityConfig: Record<EventVisibility, { displayName: string; icon: string }> = {
  public: { displayName: 'Public', icon: 'globe' },
  group: { displayName: 'Group', icon: 'people' },
  private: { displayName: 'Private', icon: 'lock-closed' },
  friends: { displayName: 'Friends', icon: 'people-outline' },
};

// ============================================
// Comment
// ============================================
export interface Comment {
  id?: string;
  authorId: string;
  authorName?: string;
  text: string;
  timestamp?: Timestamp;
}

// ============================================
// RSVP
// ============================================
export interface RSVP {
  id?: string;
  userId: string;
  userName?: string;
  status: RSVPStatus;
  timestamp?: Timestamp;
}

export type RSVPStatus = 'going' | 'maybe' | 'declined';

export const RSVPStatusConfig: Record<RSVPStatus, { displayName: string; icon: string; color: string }> = {
  going: { displayName: 'Going', icon: 'checkmark-circle', color: '#22c55e' },
  maybe: { displayName: 'Maybe', icon: 'help-circle', color: '#f97316' },
  declined: { displayName: "Can't Go", icon: 'close-circle', color: '#ef4444' },
};

// ============================================
// Event Photo
// ============================================
export interface EventPhoto {
  id?: string;
  uploaderId: string;
  uploaderName?: string;
  imageUrl: string;
  caption?: string;
  timestamp?: Timestamp;
}

// ============================================
// Notification
// ============================================
export interface AppNotification {
  id?: string;
  type: NotificationType;
  message: string;
  relatedId?: string;
  relatedType?: 'event' | 'group' | 'comment';
  timestamp?: Timestamp;
  read: boolean;
  fromUserId?: string;
}

export type NotificationType = 
  | 'new_event'
  | 'new_comment'
  | 'comment_reply'
  | 'group_invite'
  | 'event_reminder'
  | 'rsvp_update';

export const NotificationTypeConfig: Record<NotificationType, { icon: string }> = {
  new_event: { icon: 'calendar' },
  new_comment: { icon: 'chatbubble' },
  comment_reply: { icon: 'chatbubbles' },
  group_invite: { icon: 'person-add' },
  event_reminder: { icon: 'notifications' },
  rsvp_update: { icon: 'checkmark-done' },
};

// ============================================
// Invitation
// ============================================
export interface Invitation {
  id?: string;
  eventId: string;
  eventTitle: string;
  eventDate: Timestamp;
  inviterId: string;
  inviterName?: string;
  inviteeId: string;
  status: InvitationStatus;
  createdAt?: Timestamp;
  respondedAt?: Timestamp;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

// ============================================
// Helpers
// ============================================

/** Convert Firestore Timestamp to JS Date */
export function toDate(timestamp?: Timestamp): Date {
  return timestamp?.toDate() ?? new Date();
}

/** Format date for display */
export function formatEventDate(timestamp?: Timestamp): string {
  const date = toDate(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format relative time (e.g., "2h ago", "in 3 days") */
export function formatRelativeTime(timestamp?: Timestamp): string {
  const date = toDate(timestamp);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 60) {
    return diffMins >= 0 ? `in ${diffMins}m` : `${Math.abs(diffMins)}m ago`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours >= 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  }
  return diffDays >= 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
}

/** Generate invite code for events */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous O/0/I/1
  const random = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `EVT-${random}`;
}

/** Generate group join code */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

/** Normalize phone number (remove formatting) */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
