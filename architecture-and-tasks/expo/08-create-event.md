# Task 08: Create Event Screen

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-07 complete |
| **Estimated time** | 25 minutes |

## What Needs to Happen

Build the event creation form with all fields and image upload.

## Implementation

### Update `app/event/create.tsx`
```typescript
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { eventsService } from '@/services/events';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { storage } from '@/services/firebase';
import { EventVisibility } from '@/types';

export default function CreateEventScreen() {
  const router = useRouter();
  const { userId, user } = useAuth();
  const { groups } = useGroups();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date(Date.now() + 3600000)); // 1 hour from now
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValid = title.trim().length > 0 && 
    (visibility !== 'group' || selectedGroupId !== null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (eventId: string): Promise<string | undefined> => {
    if (!imageUri) return undefined;

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageRef = ref(storage, `events/${eventId}/image.jpg`);
      await uploadBytes(imageRef, blob);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Image upload failed:', error);
      return undefined;
    }
  };

  const handleCreate = async () => {
    if (!isValid || !userId) return;

    setIsLoading(true);
    try {
      const eventId = await eventsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        eventDate: Timestamp.fromDate(eventDate),
        creatorId: userId,
        visibility,
        groupId: visibility === 'group' ? selectedGroupId! : undefined,
        excludedUserIds: [],
        invitedUserIds: [],
      });

      // Upload image if selected
      const imageUrl = await uploadImage(eventId);
      if (imageUrl) {
        await eventsService.update(eventId, { imageUrl });
      }

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Event',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: '#007AFF', fontSize: 17 }}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleCreate} disabled={!isValid || isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={{ 
                  color: isValid ? '#007AFF' : '#ccc', 
                  fontSize: 17, 
                  fontWeight: '600' 
                }}>
                  Create
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this event about?"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.dateButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateText}>
                {eventDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.dateButton]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.dateText}>
                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setEventDate(date);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={eventDate}
              mode="time"
              onChange={(_, date) => {
                setShowTimePicker(false);
                if (date) setEventDate(date);
              }}
            />
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Where's it happening?"
          />
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <Text style={styles.label}>Who can see this?</Text>
          <View style={styles.visibilityRow}>
            {(['public', 'group', 'private'] as EventVisibility[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.visibilityOption,
                  visibility === v && styles.visibilitySelected,
                ]}
                onPress={() => setVisibility(v)}
              >
                <Ionicons
                  name={
                    v === 'public' ? 'globe-outline' :
                    v === 'group' ? 'people-outline' : 'lock-closed-outline'
                  }
                  size={20}
                  color={visibility === v ? '#007AFF' : '#666'}
                />
                <Text style={[
                  styles.visibilityText,
                  visibility === v && styles.visibilityTextSelected,
                ]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {visibility === 'group' && (
            <View style={styles.groupPicker}>
              {groups.length === 0 ? (
                <Text style={styles.noGroups}>
                  Join a group first to create group events
                </Text>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupOption,
                      selectedGroupId === group.id && styles.groupSelected,
                    ]}
                    onPress={() => setSelectedGroupId(group.id!)}
                  >
                    <Text style={styles.groupText}>{group.name}</Text>
                    {selectedGroupId === group.id && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Image */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color="#666" />
                <Text style={styles.imagePickerText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity onPress={() => setImageUri(null)}>
              <Text style={styles.removeImage}>Remove photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  visibilitySelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  visibilityText: {
    fontSize: 14,
    color: '#666',
  },
  visibilityTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  groupPicker: {
    marginTop: 12,
    gap: 8,
  },
  groupOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  groupSelected: {
    backgroundColor: '#e3f2fd',
  },
  groupText: {
    fontSize: 16,
  },
  noGroups: {
    color: '#999',
    fontStyle: 'italic',
  },
  imagePicker: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#666',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImage: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
});
```

### Create useGroups Hook
Create `hooks/useGroups.ts` (needed for group picker):
```typescript
import { useState, useEffect } from 'react';
import { groupsService } from '@/services/groups';
import { useAuth } from './useAuth';
import { Group } from '@/types';

export function useGroups() {
  const { userId } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = groupsService.subscribeUserGroups(userId, (newGroups) => {
      setGroups(newGroups);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { groups, isLoading };
}
```

## Files to Create/Modify
- [ ] Update `app/event/create.tsx`
- [ ] Create `hooks/useGroups.ts`

## Acceptance Criteria
- [ ] All form fields work
- [ ] Date/time pickers function
- [ ] Visibility selection works
- [ ] Group picker appears when "Group" selected
- [ ] Image picker works
- [ ] Event created in Firestore
- [ ] Image uploaded to Storage

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add create event screen"
```
