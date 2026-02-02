/**
 * Event Detail Screen
 *
 * Industrial ethereal aesthetic
 */

import CommentList from '@/components/CommentList';
import RSVPButtons from '@/components/RSVPButtons';
import Theme from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import { useEvent, useEventRSVPs } from '@/hooks/useEvents';
import { eventsService } from '@/services/events';
import { EventVisibilityConfig, formatEventDate } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event, isLoading: eventLoading } = useEvent(id);
  const { rsvps, userRSVP, counts, setRSVP, isLoading: rsvpLoading } = useEventRSVPs(id);
  const { comments, isLoading: commentsLoading, addComment, deleteComment, canDelete } = useComments(id);
  const { userId } = useAuth();

  const isCreator = event?.creatorId === userId;

  const handleShare = async () => {
    if (!event) return;

    const eventDate = event.eventDate?.toDate?.() || new Date();
    const dateStr = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = [
      `📅 You're invited to: ${event.title}`,
      `🗓 ${dateStr}`,
      event.location ? `📍 ${event.location}` : null,
      event.inviteCode ? `\nCode: ${event.inviteCode}` : null,
      `\nJoin me on Dispo!`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsService.deleteEvent(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  if (eventLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="calendar-times-o" size={48} color={Theme.colors.chromeDim} />
        <Text style={styles.notFoundText}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const visibilityConfig = EventVisibilityConfig[event.visibility];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: Theme.colors.textPrimary,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <FontAwesome name="share" size={18} color={Theme.colors.accent} />
              </TouchableOpacity>
              {isCreator && (
                <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                  <FontAwesome name="trash" size={18} color={Theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <LinearGradient
              colors={[Theme.colors.accent + '15', Theme.colors.backgroundCard]}
              style={styles.imagePlaceholderGradient}
            >
              <FontAwesome name="calendar" size={44} color={Theme.colors.chromeDim} />
            </LinearGradient>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Info Cards */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FontAwesome name="clock-o" size={14} color={Theme.colors.accent} />
              </View>
              <Text style={styles.infoText}>{formatEventDate(event.eventDate)}</Text>
            </View>

            {event.location && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome name="map-marker" size={14} color={Theme.colors.accent} />
                </View>
                <Text style={styles.infoText}>{event.location}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FontAwesome name={visibilityConfig.icon as any} size={14} color={Theme.colors.accent} />
              </View>
              <Text style={styles.infoText}>{visibilityConfig.displayName}</Text>
            </View>
          </View>

          {/* Invite Code */}
          {event.inviteCode && (
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeLabel}>INVITE CODE</Text>
              <Text style={styles.inviteCode}>{event.inviteCode}</Text>
            </View>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* RSVP */}
          <RSVPButtons
            currentStatus={userRSVP?.status || null}
            counts={counts}
            onSelect={setRSVP}
            isLoading={rsvpLoading}
          />

          {/* Comments */}
          <CommentList
            comments={comments}
            isLoading={commentsLoading}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            canDelete={canDelete}
          />
        </View>

        {/* Bottom padding */}
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
    color: Theme.colors.textMuted,
    marginTop: 16,
  },
  backLink: {
    fontSize: 16,
    color: Theme.colors.accent,
    marginTop: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  image: {
    width: '100%',
    height: 220,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
  },
  imagePlaceholderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: Theme.colors.backgroundCard,
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  inviteCodeBox: {
    backgroundColor: Theme.colors.backgroundCard,
    padding: 20,
    borderRadius: Theme.radius.lg,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  inviteCodeLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    color: Theme.colors.accent,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Theme.colors.textSecondary,
  },
});
