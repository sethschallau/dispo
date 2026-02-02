/**
 * Comments Service
 *
 * Firestore operations for event comments (subcollection).
 */

import { Comment } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export const commentsService = {
  /**
   * Subscribe to comments for an event
   */
  subscribeToComments(
    eventId: string,
    onData: (comments: Comment[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const commentsRef = collection(db, 'events', eventId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      onData(comments);
    }, onError);
  },

  /**
   * Get comments for an event (one-time fetch)
   */
  async getComments(eventId: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'events', eventId, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'asc'), limit(100));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  },

  /**
   * Add a comment to an event
   */
  async addComment(
    eventId: string,
    authorId: string,
    authorName: string,
    text: string
  ): Promise<string> {
    const commentsRef = collection(db, 'events', eventId, 'comments');

    const commentData: Omit<Comment, 'id'> = {
      authorId,
      authorName,
      text,
      timestamp: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(commentsRef, commentData);
    return docRef.id;
  },

  /**
   * Delete a comment
   */
  async deleteComment(eventId: string, commentId: string): Promise<void> {
    const docRef = doc(db, 'events', eventId, 'comments', commentId);
    await deleteDoc(docRef);
  },

  /**
   * Update a comment
   */
  async updateComment(
    eventId: string,
    commentId: string,
    text: string
  ): Promise<void> {
    const docRef = doc(db, 'events', eventId, 'comments', commentId);
    await updateDoc(docRef, { text });
  },

  /**
   * Get comment count for an event
   */
  async getCommentCount(eventId: string): Promise<number> {
    try {
      const commentsRef = collection(db, 'events', eventId, 'comments');
      const snapshot = await getDocs(commentsRef);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  },
};
