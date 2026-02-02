/**
 * GroupCard Component
 *
 * Displays a group in the groups list.
 */

import { Group } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';

interface GroupCardProps {
  group: Group;
  isOwner?: boolean;
}

export default function GroupCard({ group, isOwner }: GroupCardProps) {
  const handlePress = () => {
    router.push(`/group/${group.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {group.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {group.name}
            </Text>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <FontAwesome name="star" size={10} color="#f59e0b" />
              </View>
            )}
          </View>

          {group.description && (
            <Text style={styles.description} numberOfLines={1}>
              {group.description}
            </Text>
          )}

          <View style={styles.memberRow}>
            <FontAwesome name="users" size={12} color="#666" />
            <Text style={styles.memberCount}>
              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <FontAwesome name="chevron-right" size={14} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  ownerBadge: {
    padding: 2,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
});
