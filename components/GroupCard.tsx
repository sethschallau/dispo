/**
 * GroupCard Component
 *
 * Industrial ethereal card for groups list
 */

import Theme from '@/constants/Theme';
import { Group } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GroupCardProps {
  group: Group;
  isOwner?: boolean;
}

export default function GroupCard({ group, isOwner }: GroupCardProps) {
  const handlePress = () => {
    router.push(`/group/${group.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* Avatar with gradient */}
          <View style={styles.avatarWrapper}>
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
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {group.name}
              </Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <FontAwesome name="star" size={10} color={Theme.colors.ember} />
                </View>
              )}
            </View>

            {group.description && (
              <Text style={styles.description} numberOfLines={1}>
                {group.description}
              </Text>
            )}

            <View style={styles.memberRow}>
              <FontAwesome name="users" size={11} color={Theme.colors.chromeDim} />
              <Text style={styles.memberCount}>
                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          {/* Arrow */}
          <FontAwesome name="chevron-right" size={12} color={Theme.colors.chromeDim} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.backgroundCard,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  avatarWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  ownerBadge: {
    padding: 2,
  },
  description: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 3,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  memberCount: {
    fontSize: 12,
    color: Theme.colors.chromeDim,
  },
});
