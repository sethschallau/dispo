# Task 10: Group Detail Screen

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-09 complete |
| **Estimated time** | 20 minutes |

## Implementation

### Update `app/group/[id].tsx`
```typescript
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupsService } from '@/services/groups';
import { useAuth } from '@/hooks/useAuth';
import { Group, User } from '@/types';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = group?.ownerId === userId;

  useEffect(() => {
    if (!id) return;
    loadGroup();
  }, [id]);

  const loadGroup = async () => {
    const g = await groupsService.get(id!);
    setGroup(g);
    setIsLoading(false);
  };

  const handleShare = async () => {
    if (!group?.joinCode) return;
    await Share.share({
      message: `Join my group "${group.name}" on Dispo!\n\nCode: ${group.joinCode}`,
    });
  };

  const handleLeave = () => {
    if (!group || !userId) return;
    
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.leave(group.id!, userId);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!group) return;
    
    Alert.alert(
      'Delete Group',
      'This will permanently delete the group and remove all members. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.delete(group.id!);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !group) {
    return (
      <View style={styles.center}>
        <Text>{isLoading ? 'Loading...' : 'Group not found'}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: group.name }} />

      <ScrollView style={styles.container}>
        {/* Description */}
        {group.description && (
          <View style={styles.section}>
            <Text style={styles.description}>{group.description}</Text>
          </View>
        )}

        {/* Join Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{group.joinCode}</Text>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Share this code to invite others
          </Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Members ({group.members.length})
          </Text>
          {group.members.map((memberId) => (
            <View key={memberId} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
              <Text style={styles.memberName}>{memberId}</Text>
              {memberId === group.ownerId && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Owner</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          {!isOwner && (
            <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
              <Text style={styles.dangerButtonText}>Leave Group</Text>
            </TouchableOpacity>
          )}
          
          {isOwner && (
            <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
              <Text style={styles.dangerButtonText}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
  },
  badge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#f44336',
    fontWeight: '600',
  },
});
```

## Files to Modify
- [ ] `app/group/[id].tsx`

## Acceptance Criteria
- [ ] Shows group info
- [ ] Shows join code with share button
- [ ] Lists members
- [ ] Owner badge shows
- [ ] Leave/delete buttons work

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add group detail screen"
```
