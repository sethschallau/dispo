/**
 * RSVPButtons Component
 *
 * Industrial ethereal RSVP buttons
 */

import Theme from '@/constants/Theme';
import { RSVPStatus, RSVPStatusConfig } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RSVPButtonsProps {
  currentStatus: RSVPStatus | null;
  counts: { going: number; maybe: number; declined: number };
  onSelect: (status: RSVPStatus) => void;
  isLoading?: boolean;
}

export default function RSVPButtons({
  currentStatus,
  counts,
  onSelect,
  isLoading,
}: RSVPButtonsProps) {
  const statuses: RSVPStatus[] = ['going', 'maybe', 'declined'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Response</Text>
      <View style={styles.buttonsRow}>
        {statuses.map((status) => {
          const config = RSVPStatusConfig[status];
          const isSelected = currentStatus === status;
          const count = counts[status];

          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.button,
                isSelected && {
                  backgroundColor: config.color,
                  borderColor: config.color,
                  ...Platform.select({
                    ios: {
                      shadowColor: config.color,
                      shadowOpacity: 0.4,
                    },
                  }),
                },
              ]}
              onPress={() => onSelect(status)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <FontAwesome
                name={config.icon as any}
                size={16}
                color={isSelected ? '#fff' : config.color}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isSelected ? '#fff' : Theme.colors.textSecondary },
                ]}
              >
                {config.displayName}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
                  <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
    color: Theme.colors.textPrimary,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundCard,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.chromeTint,
    marginTop: 2,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  countTextSelected: {
    color: '#fff',
  },
});
