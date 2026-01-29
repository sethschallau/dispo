# Task 13: Event Invites via Codes

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-12 complete |
| **Estimated time** | 20 minutes |

## What Needs to Happen

Add event invite codes, share functionality, and join-by-code screen.

## Implementation

### 1. Add Share Section to Event Detail
Update `app/event/[id].tsx`:
```typescript
// Add imports
import { Share, Clipboard } from 'react-native';

// Add state
const [showCopied, setShowCopied] = useState(false);

// Add share handler
const handleShare = async () => {
  if (!event?.inviteCode) return;
  
  const message = `Join my event on Dispo!\n\n` +
    `📅 ${event.title}\n` +
    `🕐 ${formatEventDate(event.eventDate)}\n` +
    (event.location ? `📍 ${event.location}\n` : '') +
    `\nEvent code: ${event.inviteCode}`;
    
  await Share.share({ message });
};

const copyCode = () => {
  if (!event?.inviteCode) return;
  Clipboard.setString(event.inviteCode);
  setShowCopied(true);
  setTimeout(() => setShowCopied(false), 2000);
};

// Add in render (for creator only):
{isCreator && event.inviteCode && (
  <>
    <View style={styles.divider} />
    <View>
      <Text style={styles.sectionTitle}>Invite Friends</Text>
      <View style={styles.codeBox}>
        <View>
          <Text style={styles.codeLabel}>Event Code</Text>
          <Text style={styles.code}>{event.inviteCode}</Text>
        </View>
        <TouchableOpacity onPress={copyCode}>
          <Ionicons 
            name={showCopied ? "checkmark" : "copy-outline"} 
            size={24} 
            color={showCopied ? "#4caf50" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Share Event</Text>
      </TouchableOpacity>
    </View>
  </>
)}

// Add styles
codeBox: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
  padding: 16,
  borderRadius: 10,
},
codeLabel: { fontSize: 12, color: '#666' },
code: { fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
shareButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: '#007AFF',
  padding: 14,
  borderRadius: 10,
  marginTop: 12,
},
shareButtonText: { color: '#fff', fontWeight: '600' },
```

### 2. Create Join Event Screen
Create `app/event/join.tsx`:
```typescript
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { eventsService } from '@/services/events';
import { useAuth } from '@/hooks/useAuth';
import { Event, formatEventDate } from '@/types';

export default function JoinEventScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [code, setCode] = useState('');
  const [foundEvent, setFoundEvent] = useState<Event | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const searchEvent = async () => {
    if (code.length < 4) return;
    
    setIsSearching(true);
    setFoundEvent(null);
    
    try {
      const event = await eventsService.findByCode(code);
      if (event) {
        setFoundEvent(event);
      } else {
        Alert.alert('Not Found', 'No event found with that code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search for event');
    } finally {
      setIsSearching(false);
    }
  };

  const joinEvent = async () => {
    if (!foundEvent?.id || !userId) return;
    
    setIsJoining(true);
    try {
      await eventsService.update(foundEvent.id, {
        invitedUserIds: [...(foundEvent.invitedUserIds || []), userId],
      });
      Alert.alert('Success', 'Joined event!');
      router.replace(`/event/${foundEvent.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Join Event' }} />
      
      <View style={styles.container}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="Enter event code (e.g., EVT-XXXX)"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchEvent}
            disabled={code.length < 4 || isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Find</Text>
            )}
          </TouchableOpacity>
        </View>

        {foundEvent && (
          <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{foundEvent.title}</Text>
            <Text style={styles.eventDate}>
              {formatEventDate(foundEvent.eventDate)}
            </Text>
            {foundEvent.location && (
              <Text style={styles.eventLocation}>{foundEvent.location}</Text>
            )}
            
            <TouchableOpacity
              style={styles.joinButton}
              onPress={joinEvent}
              disabled={isJoining}
            >
              <Text style={styles.joinButtonText}>
                {isJoining ? 'Joining...' : 'Join Event'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  inputRow: { flexDirection: 'row', gap: 12 },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '600' },
  eventCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  eventTitle: { fontSize: 20, fontWeight: 'bold' },
  eventDate: { fontSize: 15, color: '#666', marginTop: 8 },
  eventLocation: { fontSize: 15, color: '#666', marginTop: 4 },
  joinButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
```

### 3. Add Join Button to Feed
Update FAB menu in `app/(tabs)/index.tsx` to include "Join by Code" option.

## Acceptance Criteria
- [ ] Creator sees invite code and share button
- [ ] Share opens system share sheet
- [ ] Copy code shows feedback
- [ ] Join screen finds events by code
- [ ] Joining adds user to invitedUserIds

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add event invite codes and sharing"
```
