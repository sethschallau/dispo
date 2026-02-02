/**
 * Group Detail Screen
 *
 * Shows group info, members, and admin actions.
 */

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroups';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { group, isLoading, isOwner, isMember, leaveGroup, deleteGroup } = useGroup(id);
  const { userId } = useAuth();

  const handleShare = async () => {
    if (!group?.joinCode) return;

    try {
      await Share.share({
        message: `Join my group "${group.name}" on Dispo!\nUse code: ${group.joinCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeave = () => {
    if (isOwner) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Cannot Leave: You are the owner of this group. Transfer ownership or delete the group instead.');
      }
      return;
    }

    const shouldLeave = typeof window !== 'undefined' && window.confirm
      ? window.confirm('Are you sure you want to leave this group?')
      : true;

    if (!shouldLeave) return;

    leaveGroup()
      .then(() => router.back())
      .catch(() => {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Failed to leave group');
        }
      });
  };

  const handleDelete = () => {
    const shouldDelete = typeof window !== 'undefined' && window.confirm
      ? window.confirm('Are you sure you want to delete this group? This cannot be undone.')
      : true;

    if (!shouldDelete) return;

    deleteGroup()
      .then(() => router.back())
      .catch(() => {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Failed to delete group');
        }
      });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="users" size={48} color="#ccc" />
        <Text style={styles.notFoundText}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: group.name,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <FontAwesome name="share" size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{group.name}</Text>
          {group.description && (
            <Text style={styles.description}>{group.description}</Text>
          )}
        </View>

        {/* Join Code */}
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Join Code</Text>
          <Text style={styles.code}>{group.joinCode}</Text>
          <Text style={styles.codeHint}>Share this code to invite friends</Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Members ({group.members.length})
          </Text>
          {group.members.map((memberId, index) => (
            <View key={memberId} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {memberId.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberId}>{memberId}</Text>
                {memberId === group.ownerId && (
                  <View style={styles.ownerBadge}>
                    <FontAwesome name="star" size={10} color="#f59e0b" />
                    <Text style={styles.ownerText}>Owner</Text>
                  </View>
                )}
              </View>
              {memberId === userId && (
                <Text style={styles.youLabel}>You</Text>
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          {isOwner ? (
            <TouchableOpacity style={styles.dangerButton} onPress={handleDelete}>
              <FontAwesome name="trash" size={18} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Delete Group</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
              <FontAwesome name="sign-out" size={18} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Leave Group</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  backLink: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 12,
  },
  headerButton: {
    padding: 4,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  codeBox: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberId: {
    fontSize: 15,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ownerText: {
    fontSize: 12,
    color: '#f59e0b',
  },
  youLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginTop: 16,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
