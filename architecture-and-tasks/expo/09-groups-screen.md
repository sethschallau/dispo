# Task 09: Groups Screen & Service

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-08 complete |
| **Estimated time** | 25 minutes |

## What Needs to Happen

Build groups list, create group, and join group functionality.

## Implementation

### 1. Create Groups Service
Create `services/groups.ts`:
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
  getDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Group, generateJoinCode } from '@/types';

export const groupsService = {
  /** Subscribe to groups for a user */
  subscribeUserGroups(userId: string, callback: (groups: Group[]) => void) {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', userId));

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      callback(groups);
    });
  },

  /** Get a single group */
  async get(groupId: string): Promise<Group | null> {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Group;
    }
    return null;
  },

  /** Create a new group */
  async create(name: string, description: string | undefined, ownerId: string): Promise<string> {
    const groupsRef = collection(db, 'groups');
    const joinCode = generateJoinCode();
    
    const docRef = await addDoc(groupsRef, {
      name,
      description,
      members: [ownerId],
      ownerId,
      joinCode,
      createdAt: serverTimestamp(),
    });

    // Update user's groupIds
    await updateDoc(doc(db, 'users', ownerId), {
      groupIds: arrayUnion(docRef.id),
    });

    return docRef.id;
  },

  /** Join a group by code */
  async joinByCode(code: string, userId: string): Promise<Group> {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('joinCode', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No group found with that code');
    }

    const groupDoc = snapshot.docs[0];
    const group = { id: groupDoc.id, ...groupDoc.data() } as Group;

    if (group.members.includes(userId)) {
      throw new Error("You're already a member of this group");
    }

    // Add user to group
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      members: arrayUnion(userId),
    });

    // Update user's groupIds
    await updateDoc(doc(db, 'users', userId), {
      groupIds: arrayUnion(groupDoc.id),
    });

    return group;
  },

  /** Leave a group */
  async leave(groupId: string, userId: string): Promise<void> {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }

    const group = groupSnap.data() as Group;
    
    if (group.ownerId === userId) {
      throw new Error('Owner cannot leave. Transfer ownership first.');
    }

    await updateDoc(groupRef, {
      members: arrayRemove(userId),
    });

    await updateDoc(doc(db, 'users', userId), {
      groupIds: arrayRemove(groupId),
    });
  },

  /** Add member to group */
  async addMember(groupId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayUnion(userId),
    });
    await updateDoc(doc(db, 'users', userId), {
      groupIds: arrayUnion(groupId),
    });
  },

  /** Remove member from group */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayRemove(userId),
    });
    await updateDoc(doc(db, 'users', userId), {
      groupIds: arrayRemove(groupId),
    });
  },

  /** Transfer ownership */
  async transferOwnership(groupId: string, newOwnerId: string): Promise<void> {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, { ownerId: newOwnerId });
  },

  /** Delete group */
  async delete(groupId: string): Promise<void> {
    // Get all members first
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    if (groupSnap.exists()) {
      const group = groupSnap.data() as Group;
      
      // Remove groupId from all members
      for (const memberId of group.members) {
        await updateDoc(doc(db, 'users', memberId), {
          groupIds: arrayRemove(groupId),
        });
      }
    }

    await deleteDoc(doc(db, 'groups', groupId));
  },
};
```

### 2. Update Groups Screen
Update `app/(tabs)/groups.tsx`:
```typescript
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { groupsService } from '@/services/groups';
import { Group } from '@/types';

export default function GroupsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { groups, isLoading } = useGroups();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim() || !userId) return;
    
    setIsSubmitting(true);
    try {
      await groupsService.joinByCode(joinCode.trim(), userId);
      setShowJoinModal(false);
      setJoinCode('');
      Alert.alert('Success', 'Joined group!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!newGroupName.trim() || !userId) return;
    
    setIsSubmitting(true);
    try {
      await groupsService.create(
        newGroupName.trim(),
        newGroupDesc.trim() || undefined,
        userId
      );
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/group/${item.id}`)}
    >
      <View style={styles.groupIcon}>
        <Ionicons name="people" size={24} color="#007AFF" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMeta}>
          {item.members.length} member{item.members.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="enter-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Join Group</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      {groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyText}>
            Create a group or join one with a code
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id!}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Join Modal */}
      <Modal visible={showJoinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Group</Text>
            <TextInput
              style={styles.modalInput}
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              placeholder="Enter group code"
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowJoinModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, !joinCode.trim() && styles.disabled]}
                onPress={handleJoin}
                disabled={!joinCode.trim() || isSubmitting}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmitting ? 'Joining...' : 'Join'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TextInput
              style={styles.modalInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Group name"
              maxLength={50}
            />
            <TextInput
              style={[styles.modalInput, { minHeight: 80 }]}
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
              placeholder="Description (optional)"
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowCreateModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, !newGroupName.trim() && styles.disabled]}
                onPress={handleCreate}
                disabled={!newGroupName.trim() || isSubmitting}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  actions: { flexDirection: 'row', padding: 16, gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  actionText: { color: '#007AFF', fontWeight: '500' },
  list: { paddingHorizontal: 16 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 16, fontWeight: '600' },
  groupMeta: { fontSize: 13, color: '#666', marginTop: 2 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancel: { padding: 12 },
  modalSubmit: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  modalSubmitText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
```

## Files to Create
- [ ] `services/groups.ts`
- [ ] Update `app/(tabs)/groups.tsx`

## Acceptance Criteria
- [ ] Groups list shows user's groups
- [ ] Can create new group
- [ ] Can join group by code
- [ ] Tapping group navigates to detail

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add groups screen and service"
```
