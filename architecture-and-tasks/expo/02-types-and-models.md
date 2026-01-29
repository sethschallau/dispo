# Task 02: Types and Models

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Task 00 complete |
| **Estimated time** | 10 minutes |

## What Needs to Happen

Define TypeScript types matching the Firestore schema. These mirror the Swift models from the iOS app.

## Implementation

### Create `types/index.ts`
```typescript
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
  inviteCode?: string;
  invitedUserIds?: string[];
}

export type EventVisibility = 'public' | 'group' | 'private' | 'friends';

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
    minute: '2-digit'
  });
}

/** Generate invite code */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
```

## Files to Create
- [ ] `types/index.ts`

## Acceptance Criteria
- [ ] All types compile without errors
- [ ] Types match Firestore schema (see `schemas/*.md`)
- [ ] Helper functions work correctly

## Verification
```typescript
// In any file, should have autocomplete:
import { User, Event, Group, RSVPStatus } from '@/types';

const user: User = {
  username: 'test',
  fullName: 'Test User',
};

const event: Event = {
  title: 'Test Event',
  eventDate: Timestamp.now(),
  creatorId: 'user123',
  visibility: 'public',
};
```

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add TypeScript types"
```
