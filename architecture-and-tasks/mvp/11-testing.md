# Task: MVP Testing

## Description
Comprehensive testing checklist to verify all MVP features work correctly before moving to production.

## Prerequisites
- All MVP tasks (00-10) complete

## Test Plan

### 1. Authentication Flow

| Test | Steps | Expected Result |
|------|-------|-----------------|
| First launch | Open app fresh | Login screen appears |
| Login | Enter phone + name, tap Continue | Navigates to main app |
| User created | Check Firestore Console | User document exists with correct fields |
| Persistence | Force quit and reopen app | Main app shows (no login) |
| Logout | Tap Profile → Logout | Returns to login screen |
| Re-login | Enter same phone | Loads existing user (not duplicate) |

### 2. Groups

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Create group | Groups tab → + → Enter name → Create | Group appears in list |
| Group in Firestore | Check Console | Group doc with members array including creator |
| Share code | Group detail → Copy code | Code copied to clipboard |
| Join group | Paste code → Join | User added to group members |
| Multi-user | User B joins User A's group | Both see each other in members |

### 3. Events

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Create public event | + → Fill form → Public → Create | Event appears in feed |
| Create group event | + → Fill form → Group → Select group → Create | Event appears in feed |
| Create private event | + → Fill form → Private → Create | Event visible only to creator |
| Image upload | Select image during creation | Image appears on event |
| Date picker | Select future date | Date saved correctly |

### 4. Feed

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Public events | Create public event | Visible to all users |
| Group events | Create group event | Only visible to group members |
| Private events | Create private event | Only visible to creator |
| Exclusions | Add user to excludedUserIds | User doesn't see event |
| Event detail | Tap event in feed | Detail view opens with all info |
| Pull refresh | Pull down on feed | Events refresh |

### 5. Calendar

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Calendar loads | Open Calendar tab | Current month displays |
| Events marked | Create events on different dates | Dots appear on those dates |
| Navigate months | Tap < / > | Previous/next month shows |
| Select date | Tap a date | Events for that date listed |
| Event detail | Tap event in list | Detail view opens |

### 6. Comments

| Test | Steps | Expected Result |
|------|-------|-----------------|
| View comments | Open event detail | Comments section visible |
| Post comment | Type text → Send | Comment appears in list |
| Real-time | User B posts comment | User A sees it immediately |
| Author name | Check comment | Shows author name + timestamp |

### 7. Notifications

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Event notification | User A creates group event | User B sees notification |
| Comment notification | User B comments on User A's event | User A sees notification |
| Badge | Unread notifications exist | Badge shows count on tab |
| Mark read | Tap notification | Blue dot disappears |
| Mark all read | Tap "Mark All Read" | All notifications marked read |

### 8. Profile

| Test | Steps | Expected Result |
|------|-------|-----------------|
| View profile | Open Profile tab | Shows name, username, stats |
| Edit profile | Tap Edit → Change name → Save | Name updates |
| Stats | Check events/groups count | Counts are accurate |
| Groups preview | Check groups section | Shows user's groups |

### 9. Edge Cases

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Empty states | New user with no data | Appropriate empty messages shown |
| Network error | Turn off network, try action | Error message (not crash) |
| Long text | Enter very long title/description | Handled gracefully |
| Special chars | Use emoji in text | Works correctly |
| Rapid actions | Tap button multiple times quickly | No duplicates created |

### 10. Multi-Device

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Sync | Create event on device A | Appears on device B |
| Real-time comments | User A and B on same event | Comments sync live |
| Notifications | Action on device A | Notification on device B |

## Bug Report Template

```markdown
## Bug: [Short description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** 

**Actual:** 

**Device/Simulator:** 
**iOS Version:** 
**Screenshots/Logs:** 
```

## Performance Checklist

- [ ] Feed loads in < 2 seconds
- [ ] App doesn't hang during Firestore operations
- [ ] Memory usage stable (no leaks)
- [ ] Images load progressively
- [ ] Real-time listeners don't cause excessive updates

## Security Checklist

- [ ] User can only see events they should
- [ ] User can only edit their own profile
- [ ] Excluded users can't see excluded events
- [ ] Private events only visible to creator

## Final Sign-off

- [ ] All test cases pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Ready for next phase

## Test Data Cleanup

After testing, clean up test data:
```javascript
// Firebase Console → Firestore
// Delete test documents:
// - users/test_user_*
// - groups/test_group_*
// - events/test_event_*
```

## Notes
- Test on both Simulator and physical device if possible
- Test with iOS 16+ (minimum supported version)
- Document any issues found for fixing
