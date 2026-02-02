/**
 * Create Event Screen
 *
 * Form for creating a new event with image upload.
 * Industrial ethereal theme.
 */

import { Text, View } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { eventsService } from '@/services/events';
import { Event, EventVisibility, EventVisibilityConfig } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const pad = (value: number): string => value.toString().padStart(2, '0');

const formatDateForInput = (date: Date): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatTimeForInput = (date: Date): string => {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mergeDateParts = (current: Date, incoming: Date, part: 'date' | 'time'): Date => {
  const next = new Date(current);
  if (part === 'date') {
    next.setFullYear(incoming.getFullYear(), incoming.getMonth(), incoming.getDate());
  } else {
    next.setHours(incoming.getHours(), incoming.getMinutes(), 0, 0);
  }
  return next;
};

const createDefaultEventDate = () => new Date(Date.now() + DAY_IN_MS);

export default function CreateEventScreen() {
  const { userId } = useAuth();
  const { groups } = useGroups();

  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState(createDefaultEventDate);
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [webDateInput, setWebDateInput] = useState(() => formatDateForInput(createDefaultEventDate()));
  const [webTimeInput, setWebTimeInput] = useState(() => formatTimeForInput(createDefaultEventDate()));

  useEffect(() => {
    setWebDateInput(formatDateForInput(eventDate));
    setWebTimeInput(formatTimeForInput(eventDate));
  }, [eventDate]);

  useEffect(() => {
    if (visibility !== 'group' && selectedGroupId) {
      setSelectedGroupId(null);
    }
  }, [visibility, selectedGroupId]);

  const selectedGroup = selectedGroupId
    ? groups.find(group => group.id === selectedGroupId)
    : undefined;

  const handleNativeDateChange = (_event: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      setEventDate(current => mergeDateParts(current, selectedDate, 'date'));
    }
    if (!isIOS) {
      setShowDatePicker(false);
    }
  };

  const handleNativeTimeChange = (_event: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      setEventDate(current => mergeDateParts(current, selectedDate, 'time'));
    }
    if (!isIOS) {
      setShowTimePicker(false);
    }
  };

  const handleWebDateInputChange = (value: string) => {
    setWebDateInput(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      setEventDate(current => {
        const next = new Date(current);
        next.setFullYear(year);
        next.setMonth(month - 1);
        next.setDate(day);
        return next;
      });
    }
  };

  const handleWebTimeInputChange = (value: string) => {
    setWebTimeInput(value);
    if (/^\d{2}:\d{2}$/.test(value)) {
      const [hours, minutes] = value.split(':').map(Number);
      setEventDate(current => {
        const next = new Date(current);
        next.setHours(hours);
        next.setMinutes(minutes);
        next.setSeconds(0);
        next.setMilliseconds(0);
        return next;
      });
    }
  };

  const handleGroupSelect = (groupId?: string) => {
    if (!groupId) return;
    setSelectedGroupId(groupId);
    setGroupPickerVisible(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (visibility === 'group' && (!selectedGroupId || groups.length === 0)) {
      Alert.alert('Select Group', 'Please choose which group should host this event.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Event, 'id' | 'createdAt' | 'inviteCode'> = {
        title: trimmedTitle,
        eventDate: Timestamp.fromDate(eventDate),
        creatorId: userId,
        visibility,
      };

      const trimmedDescription = description.trim();
      if (trimmedDescription) {
        payload.description = trimmedDescription;
      }

      const trimmedLocation = location.trim();
      if (trimmedLocation) {
        payload.location = trimmedLocation;
      }

      if (visibility === 'group' && selectedGroupId) {
        payload.groupId = selectedGroupId;
      }

      const eventId = await eventsService.createEvent(payload);

      // Upload image if selected
      if (imageUri) {
        await eventsService.uploadEventImage(eventId, imageUri);
      }

      router.replace(`/event/${eventId}`);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilities: EventVisibility[] = ['public', 'group', 'private'];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Event',
          headerBackTitle: 'Cancel',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: Theme.colors.chrome,
          headerTitleStyle: { color: Theme.colors.textPrimary },
        }}
      />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Image Picker */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <FontAwesome name="camera" size={32} color={Theme.colors.chromeDim} />
              <Text style={styles.imagePlaceholderText}>Add Cover Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Event title"
              placeholderTextColor={Theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's this event about?"
              placeholderTextColor={Theme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.field}>
            <Text style={styles.label}>Date & Time</Text>
            {isWeb ? (
              <View style={styles.dateTimeRow}>
                <View style={styles.webFieldContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={webDateInput}
                    onChangeText={handleWebDateInputChange}
                    inputMode="numeric"
                  />
                  <Text style={styles.helperText}>Format YYYY-MM-DD</Text>
                </View>
                <View style={styles.webFieldContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    placeholderTextColor={Theme.colors.textMuted}
                    value={webTimeInput}
                    onChangeText={handleWebTimeInputChange}
                    inputMode="numeric"
                  />
                  <Text style={styles.helperText}>24h HH:MM</Text>
                </View>
              </View>
            ) : (
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome name="calendar" size={16} color={Theme.colors.chromeDim} />
                  <Text style={styles.dateButtonText}>
                    {eventDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <FontAwesome name="clock-o" size={16} color={Theme.colors.chromeDim} />
                  <Text style={styles.dateButtonText}>
                    {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!isWeb && !isIOS && showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display="default"
              onChange={handleNativeDateChange}
            />
          )}

          {!isWeb && !isIOS && showTimePicker && (
            <DateTimePicker
              value={eventDate}
              mode="time"
              display="default"
              onChange={handleNativeTimeChange}
            />
          )}

          {/* Location */}
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Where is it?"
              placeholderTextColor={Theme.colors.textMuted}
              value={location}
              onChangeText={setLocation}
              maxLength={200}
            />
          </View>

          {/* Visibility */}
          <View style={styles.field}>
            <Text style={styles.label}>Visibility</Text>
            <View style={styles.visibilityRow}>
              {visibilities.map((v) => {
                const config = EventVisibilityConfig[v];
                const isSelected = visibility === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.visibilityButton,
                      isSelected && styles.visibilityButtonSelected,
                    ]}
                    onPress={() => setVisibility(v)}
                  >
                    <FontAwesome
                      name={config.icon as any}
                      size={18}
                      color={isSelected ? Theme.colors.accent : Theme.colors.chromeDim}
                    />
                    <Text
                      style={[
                        styles.visibilityText,
                        isSelected && styles.visibilityTextSelected,
                      ]}
                    >
                      {config.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Group Picker (if group visibility) */}
          {visibility === 'group' && (
            <View style={styles.field}>
              <Text style={styles.label}>Select Group</Text>
              {groups.length === 0 ? (
                <Text style={styles.emptyText}>
                  You need to join or create a group before posting.
                </Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.groupSelectButton}
                    onPress={() => setGroupPickerVisible(true)}
                  >
                    <Text style={styles.groupSelectText}>
                      {selectedGroup?.name ?? 'Choose a group'}
                    </Text>
                    <FontAwesome name="chevron-down" size={14} color={Theme.colors.chromeDim} />
                  </TouchableOpacity>
                  <Text style={styles.helperText}>
                    {selectedGroup
                      ? `${selectedGroup.members.length} members will see this`
                      : 'Pick which group should host this event.'}
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[Theme.colors.accent, Theme.colors.accentMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Theme.colors.chromeBright} />
              ) : (
                <Text style={styles.submitButtonText}>Create Event</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* iOS Date Picker Modal */}
      {isIOS && showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="spinner"
                onChange={handleNativeDateChange}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {isIOS && showTimePicker && (
        <Modal
          visible={showTimePicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={eventDate}
                mode="time"
                display="spinner"
                onChange={handleNativeTimeChange}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={groupPickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setGroupPickerVisible(false)}
      >
        <View style={styles.groupModalOverlay}>
          <View style={styles.groupModalContainer}>
            <View style={styles.groupModalHeader}>
              <Text style={styles.groupModalTitle}>Choose a group</Text>
              <TouchableOpacity onPress={() => setGroupPickerVisible(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id || group.name}
                  style={[
                    styles.groupOption,
                    selectedGroupId === group.id && styles.groupOptionSelected,
                  ]}
                  onPress={() => handleGroupSelect(group.id)}
                >
                  <Text style={styles.groupOptionTitle}>{group.name}</Text>
                  <Text style={styles.groupOptionSubtitle}>
                    {group.members.length} members
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  imagePicker: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Theme.shadows.card,
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Theme.colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  field: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Theme.colors.chrome,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: Theme.colors.backgroundCard,
    color: Theme.colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
  webFieldContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Theme.colors.backgroundCard,
  },
  dateButtonText: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: Theme.colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  pickerDoneText: {
    color: Theme.colors.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundCard,
    gap: 6,
  },
  visibilityButtonSelected: {
    borderColor: Theme.colors.accent,
    backgroundColor: Theme.colors.accentGlow,
  },
  visibilityText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  visibilityTextSelected: {
    color: Theme.colors.accent,
    fontWeight: '600',
  },
  groupSelectButton: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Theme.colors.backgroundCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupSelectText: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  groupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  groupModalContainer: {
    backgroundColor: Theme.colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  groupModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  groupModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.chrome,
  },
  closeText: {
    color: Theme.colors.accent,
    fontWeight: '600',
  },
  groupOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  groupOptionSelected: {
    backgroundColor: Theme.colors.accentGlow,
  },
  groupOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
  },
  groupOptionSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    ...Theme.shadows.button,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Theme.colors.chromeBright,
    fontSize: 18,
    fontWeight: '600',
  },
});
