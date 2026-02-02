/**
 * Groups Service
 *
 * Firestore operations for groups.
 */

import { Group, generateJoinCode } from '@/types';
import {
    Timestamp,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebase';

const GROUPS_COLLECTION = 'groups';

export const groupsService = {
  /**
   * Subscribe to user's groups
   */
  subscribeToUserGroups(
    userId: string,
    onData: (groups: Group[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(
      groupsRef,
      where('members', 'array-contains', userId),
      orderBy('name', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      onData(groups);
    }, onError);
  },

  /**
   * Get a single group by ID
   */
  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const docRef = doc(db, GROUPS_COLLECTION, groupId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Group;
      }
      return null;
    } catch (error) {
      console.error('Error getting group:', error);
      return null;
    }
  },

  /**
   * Subscribe to a single group
   */
  subscribeToGroup(
    groupId: string,
    onData: (group: Group | null) => void,
    onError: (error: Error) => void
  ): () => void {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData({ id: docSnap.id, ...docSnap.data() } as Group);
      } else {
        onData(null);
      }
    }, onError);
  },

  /**
   * Create a new group
   */
  async createGroup(
    name: string,
    description: string,
    ownerId: string
  ): Promise<string> {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const newDocRef = doc(groupsRef);

    const groupData: Omit<Group, 'id'> = {
      name,
      description,
      ownerId,
      members: [ownerId],
      joinCode: generateJoinCode(),
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(newDocRef, groupData);

    // Also add group to user's groupIds
    await this.addGroupToUser(ownerId, newDocRef.id);

    return newDocRef.id;
  },

  /**
   * Update a group
   */
  async updateGroup(groupId: string, data: Partial<Group>): Promise<void> {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, data);
  },

  /**
   * Delete a group
   */
  async deleteGroup(groupId: string): Promise<void> {
    // First get all members to update their groupIds
    const group = await this.getGroup(groupId);
    if (group) {
      for (const memberId of group.members) {
        await this.removeGroupFromUser(memberId, groupId);
      }
    }

    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await deleteDoc(docRef);
  },

  /**
   * Find group by join code
   */
  async findByJoinCode(code: string): Promise<Group | null> {
    try {
      const groupsRef = collection(db, GROUPS_COLLECTION);
      const q = query(groupsRef, where('joinCode', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Group;
    } catch (error) {
      console.error('Error finding group by code:', error);
      return null;
    }
  },

  /**
   * Join a group
   */
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      members: arrayUnion(userId)
    });

    await this.addGroupToUser(userId, groupId);
  },

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      members: arrayRemove(userId)
    });

    await this.removeGroupFromUser(userId, groupId);
  },

  /**
   * Remove a member from a group (admin action)
   */
  async removeMember(groupId: string, memberId: string): Promise<void> {
    await this.leaveGroup(groupId, memberId);
  },

  /**
   * Transfer ownership
   */
  async transferOwnership(groupId: string, newOwnerId: string): Promise<void> {
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, { ownerId: newOwnerId });
  },

  /**
   * Regenerate join code
   */
  async regenerateJoinCode(groupId: string): Promise<string> {
    const newCode = generateJoinCode();
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(docRef, { joinCode: newCode });
    return newCode;
  },

  // Helper: Add group to user's groupIds
  async addGroupToUser(userId: string, groupId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        groupIds: arrayUnion(groupId)
      });
    } catch (error) {
      console.error('Error adding group to user:', error);
    }
  },

  // Helper: Remove group from user's groupIds
  async removeGroupFromUser(userId: string, groupId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        groupIds: arrayRemove(groupId)
      });
    } catch (error) {
      console.error('Error removing group from user:', error);
    }
  },
};
