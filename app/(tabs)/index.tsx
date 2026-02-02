/**
 * Feed Screen
 *
 * Shows events with industrial ethereal aesthetic
 */

import EventCard from '@/components/EventCard';
import Theme from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { events, isLoading, refresh } = useEvents();
  const { user } = useAuth();

  const handleCreateEvent = () => {
    router.push('/event/create');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrapper}>
        <FontAwesome name="calendar-o" size={40} color={Theme.colors.chromeDim} />
      </View>
      <Text style={styles.emptyTitle}>No events yet</Text>
      <Text style={styles.emptyText}>
        Create an event or join a group to see events here
      </Text>
    </View>
  );

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with subtle gradient */}
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              Hey, {user?.fullName?.split(' ')[0] || 'there'}
            </Text>
            <Text style={styles.subtitle}>What's happening?</Text>
          </View>
          <View style={styles.headerAccent} />
        </View>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={Theme.colors.accent}
            colors={[Theme.colors.accent]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB - Create Event */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateEvent} activeOpacity={0.85}>
        <LinearGradient
          colors={[Theme.colors.accent, Theme.colors.accentMuted]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <FontAwesome name="plus" size={22} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
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
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  headerAccent: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.accent,
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.6,
  },
  list: {
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
