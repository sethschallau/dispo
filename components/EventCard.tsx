/**
 * EventCard Component
 *
 * Displays an event in the feed list.
 */

import { Event, EventVisibilityConfig, formatEventDate, formatRelativeTime } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    View as RNView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Text, View } from './Themed';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const handlePress = () => {
    router.push(`/event/${event.id}`);
  };

  const visibilityConfig = EventVisibilityConfig[event.visibility];
  const relativeTime = formatRelativeTime(event.eventDate);
  const isUpcoming = (event.eventDate?.toMillis() ?? 0) > Date.now();

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Image */}
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
        ) : (
          <RNView style={styles.imagePlaceholder}>
            <FontAwesome name="calendar" size={32} color="#ccc" />
          </RNView>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
                {relativeTime}
              </Text>
            </View>
          </View>

          {/* Date */}
          <Text style={styles.date}>
            {formatEventDate(event.eventDate)}
          </Text>

          {/* Location */}
          {event.location && (
            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={12} color="#666" />
              <Text style={styles.location} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.visibilityBadge}>
              <FontAwesome
                name={visibilityConfig.icon as any}
                size={10}
                color="#666"
              />
              <Text style={styles.visibilityText}>
                {visibilityConfig.displayName}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  upcomingBadge: {
    color: '#007AFF',
  },
  pastBadge: {
    color: '#666',
  },
  date: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visibilityText: {
    fontSize: 11,
    color: '#666',
  },
});
