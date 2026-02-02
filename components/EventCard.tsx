/**
 * EventCard Component
 *
 * Floating elevated card with industrial chrome/ethereal styling
 */

import Theme from '@/constants/Theme';
import { Event, EventVisibilityConfig, formatEventDate, formatRelativeTime } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.cardWrapper}>
        {/* Glow effect behind card */}
        <View style={styles.glowEffect} />

        <View style={styles.card}>
          {/* Chrome border gradient overlay */}
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.borderGradient}
          />

          <View style={styles.cardInner}>
            {/* Left: Image */}
            {event.imageUrl ? (
              <Image source={{ uri: event.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <LinearGradient
                  colors={[Theme.colors.accent + '20', Theme.colors.backgroundCard]}
                  style={styles.placeholderGradient}
                >
                  <FontAwesome name="calendar" size={28} color={Theme.colors.chromeDim} />
                </LinearGradient>
              </View>
            )}

            {/* Right: Content */}
            <View style={styles.content}>
              {/* Title Row */}
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {event.title}
                </Text>
              </View>

              {/* Time Badge */}
              <View style={[styles.timeBadge, isUpcoming ? styles.upcomingBadge : styles.pastBadge]}>
                <FontAwesome
                  name="clock-o"
                  size={10}
                  color={isUpcoming ? Theme.colors.accent : Theme.colors.textMuted}
                />
                <Text style={[styles.timeText, isUpcoming && styles.upcomingText]}>
                  {relativeTime}
                </Text>
              </View>

              {/* Date */}
              <Text style={styles.date}>
                {formatEventDate(event.eventDate)}
              </Text>

              {/* Location */}
              {event.location && (
                <View style={styles.locationRow}>
                  <FontAwesome name="map-marker" size={11} color={Theme.colors.chromeDim} />
                  <Text style={styles.location} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}

              {/* Footer: Visibility */}
              <View style={styles.footer}>
                <View style={styles.visibilityBadge}>
                  <FontAwesome
                    name={visibilityConfig.icon as any}
                    size={9}
                    color={Theme.colors.chromeDim}
                  />
                  <Text style={styles.visibilityText}>
                    {visibilityConfig.displayName}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: -4,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.lg,
    opacity: 0.06,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
    }),
  },
  card: {
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.backgroundCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  borderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Theme.radius.lg,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: Theme.radius.md,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
  },
  placeholderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    flex: 1,
    letterSpacing: -0.2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    marginTop: 6,
    gap: 4,
  },
  upcomingBadge: {
    backgroundColor: Theme.colors.accent + '18',
  },
  pastBadge: {
    backgroundColor: Theme.colors.chromeTint,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  upcomingText: {
    color: Theme.colors.accent,
  },
  date: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },
  location: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visibilityText: {
    fontSize: 10,
    color: Theme.colors.chromeDim,
    fontWeight: '500',
  },
});
