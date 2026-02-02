/**
 * Profile Screen
 *
 * Industrial ethereal aesthetic
 */

import Theme from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useUserGoingEvents } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { formatEventDate } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, userId, logout, updateProfile, isLoading: authLoading } = useAuth();
  const { groups } = useGroups();
  const { events } = useEvents();
  const { goingEventIds } = useUserGoingEvents();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Events created by user
  const myCreatedEvents = events.filter((e) => e.creatorId === userId);
  // Events user is going to (from feed events that match goingEventIds)
  const goingEvents = events.filter(
    (e) => e.id && goingEventIds.includes(e.id) && e.creatorId !== userId
  );
  const initial = user?.fullName?.charAt(0).toUpperCase() || '?';

  const handleLogout = async () => {
    const shouldLogout =
      typeof window !== 'undefined' && window.confirm
        ? window.confirm('Are you sure you want to log out?')
        : true;

    if (!shouldLogout) return;

    try {
      await logout();
    } catch {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Logout failed. Please try again.');
      }
    }
  };

  const showAlert = (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}: ${message}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showAlert('Error', 'Name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        fullName: editName.trim(),
        bio: editBio.trim() || undefined,
      });
      setShowEditModal(false);
    } catch {
      showAlert('Error', 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={[Theme.colors.accent, Theme.colors.accentMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditName(user?.fullName || '');
            setEditBio(user?.bio || '');
            setShowEditModal(true);
          }}
        >
          <FontAwesome name="pencil" size={13} color={Theme.colors.accent} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* My Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Groups ({groups.length})</Text>
        {groups.length === 0 ? (
          <Text style={styles.emptyText}>No groups yet. Join or create one!</Text>
        ) : (
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.listItem}
              onPress={() => router.push(`/group/${group.id}`)}
            >
              <View style={styles.groupIcon}>
                <FontAwesome name="users" size={14} color={Theme.colors.accent} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{group.name}</Text>
                <Text style={styles.listItemSubtitle}>
                  {group.members?.length || 0} members
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Theme.colors.chromeDim} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Events I Created */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Events I Created ({myCreatedEvents.length})
        </Text>
        {myCreatedEvents.length === 0 ? (
          <Text style={styles.emptyText}>No events created yet.</Text>
        ) : (
          myCreatedEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.listItem}
              onPress={() => router.push(`/event/${event.id}`)}
            >
              <View style={styles.eventIcon}>
                <FontAwesome name="calendar" size={14} color={Theme.colors.success} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{event.title}</Text>
                <Text style={styles.listItemSubtitle}>
                  {formatEventDate(event.eventDate)}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Theme.colors.chromeDim} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Events I'm Going To */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Events I'm Attending ({goingEvents.length})
        </Text>
        {goingEvents.length === 0 ? (
          <Text style={styles.emptyText}>No events RSVP'd yet.</Text>
        ) : (
          goingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.listItem}
              onPress={() => router.push(`/event/${event.id}`)}
            >
              <View style={styles.goingIcon}>
                <FontAwesome name="check-circle" size={14} color={Theme.colors.accent} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{event.title}</Text>
                <Text style={styles.listItemSubtitle}>
                  {formatEventDate(event.eventDate)}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={Theme.colors.chromeDim} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={16} color={Theme.colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 120 }} />

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Theme.colors.textMuted}
                value={editName}
                onChangeText={setEditName}
                maxLength={50}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself"
                placeholderTextColor={Theme.colors.textMuted}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                maxLength={160}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={[Theme.colors.accent, Theme.colors.accentMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  avatarWrapper: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
    }),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 15,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundCard,
  },
  editButtonText: {
    color: Theme.colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
    color: Theme.colors.textPrimary,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + '40',
    backgroundColor: Theme.colors.error + '10',
  },
  logoutText: {
    color: Theme.colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  cancelText: {
    fontSize: 16,
    color: Theme.colors.accent,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  modalContent: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Theme.colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: Theme.colors.backgroundCard,
    color: Theme.colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
