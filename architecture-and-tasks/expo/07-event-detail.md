# Task 07: Event Detail Screen

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-06 complete |
| **Estimated time** | 30 minutes |

## What Needs to Happen

Build the event detail screen showing full event info, comments, and actions.

## Implementation

### 1. Create Comments Service
Create `services/comments.ts`:
```typescript
import { db } from './firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { Comment } from '@/types';

export const commentsService = {
  /** Subscribe to comments for an event */
  subscribe(eventId: string, callback: (comments: Comment[]) => void) {
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      callback(comments);
    });
  },

  /** Add a comment */
  async add(
    eventId: string,
    authorId: string,
    authorName: string,
    text: string
  ): Promise<void> {
    const commentsRef = collection(db, 'events', eventId, 'comments');
    await addDoc(commentsRef, {
      authorId,
      authorName,
      text,
      timestamp: serverTimestamp(),
    });
  },

  /** Delete a comment */
  async delete(eventId: string, commentId: string): Promise<void> {
    const commentRef = doc(db, 'events', eventId, 'comments', commentId);
    await deleteDoc(commentRef);
  },
};
```

### 2. Create CommentList Component
Create `components/CommentList.tsx`:
```typescript
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Comment, toDate } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <Text style={styles.empty}>No comments yet. Be the first!</Text>
    );
  }

  return (
    <View>
      {comments.map((comment) => (
        <View key={comment.id} style={styles.comment}>
          <View style={styles.header}>
            <Text style={styles.author}>{comment.authorName || 'Unknown'}</Text>
            <Text style={styles.time}>
              {comment.timestamp 
                ? formatDistanceToNow(toDate(comment.timestamp), { addSuffix: true })
                : ''}
            </Text>
          </View>
          <Text style={styles.text}>{comment.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: '#666',
    fontStyle: 'italic',
    padding: 16,
  },
  comment: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  author: {
    fontWeight: '600',
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
```

### 3. Create Event Detail Screen
Update `app/event/[id].tsx`:
```typescript
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsService } from '@/services/events';
import { commentsService } from '@/services/comments';
import { useAuth } from '@/hooks/useAuth';
import { Event, Comment, toDate, formatEventDate } from '@/types';
import { CommentList } from '@/components/CommentList';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId, user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const isCreator = event?.creatorId === userId;

  useEffect(() => {
    if (!id) return;

    // Load event
    eventsService.get(id).then((e) => {
      setEvent(e);
      setIsLoading(false);
    });

    // Subscribe to comments
    const unsubscribe = commentsService.subscribe(id, setComments);
    return () => unsubscribe();
  }, [id]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !id || !userId || !user) return;

    setIsSending(true);
    try {
      await commentsService.add(id, userId, user.fullName, newComment.trim());
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsService.delete(id!);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Event not found</Text>
      </View>
    );
  }

  const eventDate = toDate(event.eventDate);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () =>
            isCreator ? (
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView style={styles.scroll}>
          {/* Header Image */}
          {event.imageUrl && (
            <Image source={{ uri: event.imageUrl }} style={styles.headerImage} />
          )}

          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Meta */}
            <View style={styles.meta}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar" size={18} color="#666" />
                <Text style={styles.metaText}>{formatEventDate(event.eventDate)}</Text>
              </View>

              {event.location && (
                <View style={styles.metaRow}>
                  <Ionicons name="location" size={18} color="#666" />
                  <Text style={styles.metaText}>{event.location}</Text>
                </View>
              )}

              <View style={styles.metaRow}>
                <Ionicons name="eye" size={18} color="#666" />
                <Text style={styles.metaText}>
                  {event.visibility.charAt(0).toUpperCase() + event.visibility.slice(1)}
                </Text>
              </View>
            </View>

            {/* Description */}
            {event.description && (
              <>
                <View style={styles.divider} />
                <Text style={styles.description}>{event.description}</Text>
              </>
            )}

            {/* Comments */}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>
            <CommentList comments={comments} />
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            multiline
          />
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={!newComment.trim() || isSending}
            style={[
              styles.sendButton,
              (!newComment.trim() || isSending) && styles.sendButtonDisabled,
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  meta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 15,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
```

### 4. Add date-fns
```bash
npm install date-fns
```

## Files to Create
- [ ] `services/comments.ts`
- [ ] `components/CommentList.tsx`
- [ ] Update `app/event/[id].tsx`

## Acceptance Criteria
- [ ] Event details display correctly
- [ ] Comments load in real-time
- [ ] Can post new comments
- [ ] Creator can delete event
- [ ] Keyboard avoidance works

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add event detail screen with comments"
```
