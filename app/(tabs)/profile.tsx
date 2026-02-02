/**
 * Profile Screen
 *
 * Shows user profile with their groups and events.
 */

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, useUserGoingEvents } from '@/hooks/useEvents';
import { useGroups } from '@/hooks/useGroups';
import { formatEventDate } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
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
          <FontAwesome name="pencil" size={14} color="#007AFF" />
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
                <FontAwesome name="users" size={16} color="#007AFF" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{group.name}</Text>
                <Text style={styles.listItemSubtitle}>
                  {group.members?.length || 0} members
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#ccc" />
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
                <FontAwesome name="calendar" size={16} color="#10b981" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{event.title}</Text>
                <Text style={styles.listItemSubtitle}>
                  {formatEventDate(event.eventDate)}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#ccc" />
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
                <FontAwesome name="check-circle" size={16} color="#007AFF" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{event.title}</Text>
                <Text style={styles.listItemSubtitle}>
                  {formatEventDate(event.eventDate)}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />

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
                placeholderTextColor="#999"
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
                placeholderTextColor="#999"
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
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
