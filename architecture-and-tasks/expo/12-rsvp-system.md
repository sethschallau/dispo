# Task 12: RSVP System

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ✅ Yes |
| **Prerequisites** | Tasks 00-11 complete |
| **Estimated time** | 20 minutes |

## What Needs to Happen

Add RSVP buttons to event detail, track going/maybe/declined.

## Implementation

### 1. Add RSVP to Events Service
Add to `services/events.ts`:
```typescript
import { RSVP, RSVPStatus } from '@/types';

// Add these methods:
  async setRSVP(eventId: string, userId: string, userName: string, status: RSVPStatus) {
    const rsvpRef = doc(db, 'events', eventId, 'rsvps', userId);
    await setDoc(rsvpRef, {
      userId,
      userName,
      status,
      timestamp: serverTimestamp(),
    });
  },

  async removeRSVP(eventId: string, userId: string) {
    const rsvpRef = doc(db, 'events', eventId, 'rsvps', userId);
    await deleteDoc(rsvpRef);
  },

  subscribeRSVPs(eventId: string, callback: (rsvps: RSVP[]) => void) {
    const rsvpsRef = collection(db, 'events', eventId, 'rsvps');
    return onSnapshot(rsvpsRef, (snapshot) => {
      const rsvps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RSVP[];
      callback(rsvps);
    });
  },
```

### 2. Create RSVPButtons Component
Create `components/RSVPButtons.tsx`:
```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RSVP, RSVPStatus } from '@/types';

interface RSVPButtonsProps {
  rsvps: RSVP[];
  myRSVP?: RSVP;
  onRSVP: (status: RSVPStatus) => void;
}

const STATUS_CONFIG: Record<RSVPStatus, { icon: string; color: string; label: string }> = {
  going: { icon: 'checkmark-circle', color: '#4caf50', label: 'Going' },
  maybe: { icon: 'help-circle', color: '#ff9800', label: 'Maybe' },
  declined: { icon: 'close-circle', color: '#f44336', label: "Can't Go" },
};

export function RSVPButtons({ rsvps, myRSVP, onRSVP }: RSVPButtonsProps) {
  const goingCount = rsvps.filter((r) => r.status === 'going').length;
  const maybeCount = rsvps.filter((r) => r.status === 'maybe').length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Are you going?</Text>
      
      <View style={styles.buttons}>
        {(['going', 'maybe', 'declined'] as RSVPStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const isSelected = myRSVP?.status === status;
          
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.button,
                isSelected && { backgroundColor: config.color },
              ]}
              onPress={() => onRSVP(status)}
            >
              <Ionicons
                name={config.icon as any}
                size={24}
                color={isSelected ? '#fff' : config.color}
              />
              <Text style={[
                styles.buttonText,
                isSelected && { color: '#fff' },
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {(goingCount > 0 || maybeCount > 0) && (
        <View style={styles.counts}>
          {goingCount > 0 && (
            <Text style={styles.count}>
              <Ionicons name="checkmark-circle" size={14} color="#4caf50" />
              {' '}{goingCount} going
            </Text>
          )}
          {maybeCount > 0 && (
            <Text style={styles.count}>
              <Ionicons name="help-circle" size={14} color="#ff9800" />
              {' '}{maybeCount} maybe
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  buttons: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  buttonText: { marginTop: 4, fontSize: 13, fontWeight: '500' },
  counts: { flexDirection: 'row', gap: 16, marginTop: 12 },
  count: { fontSize: 14, color: '#666' },
});
```

### 3. Add to EventDetailScreen
Update `app/event/[id].tsx` to include RSVPButtons:
```typescript
// Add state
const [rsvps, setRSVPs] = useState<RSVP[]>([]);

// Subscribe in useEffect
const unsubRSVP = eventsService.subscribeRSVPs(id, setRSVPs);

// Add handler
const handleRSVP = async (status: RSVPStatus) => {
  if (!userId || !user) return;
  const myRSVP = rsvps.find(r => r.userId === userId);
  
  if (myRSVP?.status === status) {
    await eventsService.removeRSVP(id!, userId);
  } else {
    await eventsService.setRSVP(id!, userId, user.fullName, status);
  }
};

// Add in render (after meta, before comments):
<View style={styles.divider} />
<RSVPButtons
  rsvps={rsvps}
  myRSVP={rsvps.find(r => r.userId === userId)}
  onRSVP={handleRSVP}
/>
```

## Acceptance Criteria
- [ ] RSVP buttons display
- [ ] Can toggle going/maybe/declined
- [ ] Tapping same status removes RSVP
- [ ] Counts update in real-time

## Commit
```bash
git add .
git commit -m "🍐 PearGuy: Add RSVP system"
```
