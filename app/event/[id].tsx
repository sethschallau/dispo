/**
 * Event Detail Screen
 *
 * Shows full event details, RSVPs, and comments.
 */

import CommentList from '@/components/CommentList';
import RSVPButtons from '@/components/RSVPButtons';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import { useEvent, useEventRSVPs } from '@/hooks/useEvents';
import { eventsService } from '@/services/events';
import { EventVisibilityConfig, formatEventDate } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <FontAwesome name="calendar-times-o" size={48} color="#ccc" />
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
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <FontAwesome name="share" size={20} color="#007AFF" />
              </TouchableOpacity>
              {isCreator && (
                <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                  <FontAwesome name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Image */}
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <FontAwesome name="calendar" size={48} color="#ccc" />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <FontAwesome name="clock-o" size={16} color="#666" />
            <Text style={styles.infoText}>{formatEventDate(event.eventDate)}</Text>
          </View>

          {/* Location */}
          {event.location && (
            <View style={styles.infoRow}>
              <FontAwesome name="map-marker" size={16} color="#666" />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>
          )}

          {/* Visibility */}
          <View style={styles.infoRow}>
            <FontAwesome name={visibilityConfig.icon as any} size={16} color="#666" />
            <Text style={styles.infoText}>{visibilityConfig.displayName}</Text>
          </View>

          {/* Invite Code */}
          {event.inviteCode && (
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#444',
  },
  inviteCodeBox: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
});
