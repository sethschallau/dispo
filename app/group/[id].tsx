/**
 * Group Detail Screen
 *
 * Shows group info, members, and admin actions.
 * Industrial ethereal theme.
 */

import { Text, View } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { useGroup } from '@/hooks/useGroups';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
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
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="users" size={48} color={Theme.colors.chromeDim} />
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
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: Theme.colors.chrome,
          headerTitleStyle: { color: Theme.colors.textPrimary },
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <FontAwesome name="share" size={20} color={Theme.colors.accent} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[Theme.colors.accent, Theme.colors.accentMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
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
              <FontAwesome name="trash" size={18} color={Theme.colors.error} />
              <Text style={styles.dangerButtonText}>Delete Group</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dangerButton} onPress={handleLeave}>
              <FontAwesome name="sign-out" size={18} color={Theme.colors.error} />
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
    backgroundColor: Theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  notFoundText: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    marginTop: 16,
  },
  backLink: {
    fontSize: 16,
    color: Theme.colors.accent,
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
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Theme.shadows.cardGlow,
  },
  avatarText: {
    color: Theme.colors.chromeBright,
    fontSize: 36,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  description: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  codeBox: {
    margin: 20,
    padding: 20,
    backgroundColor: Theme.colors.backgroundCard,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  codeLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: Theme.colors.chrome,
  },
  codeHint: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: Theme.colors.chrome,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
    backgroundColor: 'transparent',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.chromeDim,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.chrome,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  memberId: {
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  ownerText: {
    fontSize: 12,
    color: Theme.colors.warning,
  },
  youLabel: {
    fontSize: 12,
    color: Theme.colors.accent,
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
    borderColor: Theme.colors.error,
    marginTop: 16,
    backgroundColor: 'rgba(232, 139, 139, 0.1)',
  },
  dangerButtonText: {
    color: Theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
