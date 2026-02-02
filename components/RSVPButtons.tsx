/**
 * RSVPButtons Component
 *
 * Displays RSVP options for an event.
 */

import { RSVPStatus, RSVPStatusConfig } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from './Themed';

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
                isSelected && { backgroundColor: config.color },
              ]}
              onPress={() => onSelect(status)}
              disabled={isLoading}
            >
              <FontAwesome
                name={config.icon as any}
                size={18}
                color={isSelected ? '#fff' : config.color}
              />
              <Text
                style={[
                  styles.buttonText,
                  isSelected && styles.buttonTextSelected,
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
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
    gap: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginTop: 2,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  countTextSelected: {
    color: '#fff',
  },
});
