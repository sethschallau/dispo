/**
 * Groups Screen
 *
 * Industrial ethereal aesthetic
 */

import GroupCard from '@/components/GroupCard';
import Theme from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const { groups, isLoading, createGroup, joinByCode } = useGroups();
  const { userId } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setIsSubmitting(true);
    try {
      await createGroup(groupName.trim(), groupDescription.trim());
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setIsSubmitting(true);
    try {
      await joinByCode(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
      Alert.alert('Success', 'You have joined the group!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join group');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && groups.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Groups</Text>
          <View style={styles.titleAccent} />
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowJoinModal(true)}
          >
            <FontAwesome name="sign-in" size={16} color={Theme.colors.accent} />
            <Text style={styles.headerButtonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <LinearGradient
              colors={[Theme.colors.accent, Theme.colors.accentMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createButtonGradient}
            >
              <FontAwesome name="plus" size={14} color="#fff" />
              <Text style={styles.createButtonText}>Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        renderItem={({ item }) => (
          <GroupCard group={item} isOwner={item.ownerId === userId} />
        )}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <FontAwesome name="users" size={36} color={Theme.colors.chromeDim} />
            </View>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>
              Create a group or join one with a code
            </Text>
          </View>
        }
      />

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Group</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.field}>
              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                placeholderTextColor={Theme.colors.textMuted}
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What's this group about?"
                placeholderTextColor={Theme.colors.textMuted}
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                maxLength={200}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={[Theme.colors.accent, Theme.colors.accentMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Group</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Join Group</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.field}>
              <Text style={styles.label}>Join Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="XXXXXX"
                placeholderTextColor={Theme.colors.textMuted}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleJoin}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={[Theme.colors.accent, Theme.colors.accentMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Join Group</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleAccent: {
    width: 40,
    height: 3,
    backgroundColor: Theme.colors.accent,
    borderRadius: 2,
    marginTop: 8,
    opacity: 0.6,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundCard,
  },
  headerButtonText: {
    color: Theme.colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  createButton: {
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 6,
    fontWeight: '600',
  },
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
