# Task: Production Deployment & Deep Links

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ❌ No - requires domain, Apple Developer, App Store Connect |
| **Human tasks** | Domain setup, Apple Developer config, App Store submission |
| **Agent tasks** | Code for Universal Links handling, AASA file generation, documentation |
| **Estimated complexity** | High |
| **Dependencies** | All features complete, Real Authentication (00) |

## What Needs to Happen

### Human Must Do (Seth)
1. **Domain Setup**
   - Register/use a domain (e.g., `dispo.app`, `getdispo.com`)
   - Host Apple App Site Association (AASA) file at `https://yourdomain.com/.well-known/apple-app-site-association`
   - SSL certificate required (HTTPS)

2. **Apple Developer Portal**
   - Enable Associated Domains capability for app
   - Add domain to App ID configuration

3. **Xcode Configuration**
   - Add Associated Domains entitlement: `applinks:yourdomain.com`
   - Configure URL Types for fallback custom scheme

4. **App Store Connect**
   - Create app listing
   - Screenshots, description, metadata
   - TestFlight setup for beta testing
   - Submit for review

5. **Firebase Production Setup**
   - Switch from test mode to production security rules
   - Set up Firebase App Check (optional but recommended)
   - Configure production environment

### Agent Can Do
1. Generate AASA file content
2. Implement Universal Link handling in app
3. Create link generation utilities
4. Document deployment steps
5. Prepare security rules for production

## Implementation

### 1. Apple App Site Association (AASA) File
Host at `https://yourdomain.com/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourname.dispo",
        "paths": [
          "/event/*",
          "/group/*",
          "/invite/*"
        ]
      }
    ]
  }
}
```
- Replace `TEAMID` with your Apple Developer Team ID
- Replace `com.yourname.dispo` with your bundle identifier
- File must be served with `Content-Type: application/json`
- No file extension, no redirects

### 2. Update dispoApp.swift for Universal Links
```swift
@main
struct DispoApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var deepLinkHandler = DeepLinkHandler()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(deepLinkHandler)
                .onOpenURL { url in
                    deepLinkHandler.handle(url: url)
                }
        }
    }
}
```

### 3. Create DeepLinkHandler.swift
```swift
import SwiftUI

class DeepLinkHandler: ObservableObject {
    @Published var pendingEventCode: String?
    @Published var pendingGroupCode: String?
    @Published var navigateToEvent: String?
    
    func handle(url: URL) {
        // Handle both universal links and custom scheme
        // Universal: https://dispo.app/event/EVT-XK7M
        // Custom: dispo://event/EVT-XK7M
        
        let pathComponents = url.pathComponents
        
        if pathComponents.count >= 2 {
            let type = pathComponents[1]
            let code = pathComponents.count >= 3 ? pathComponents[2] : nil
            
            switch type {
            case "event":
                if let code = code {
                    pendingEventCode = code
                }
            case "group":
                if let code = code {
                    pendingGroupCode = code
                }
            case "invite":
                // Handle invite links
                if let code = code {
                    pendingEventCode = code
                }
            default:
                break
            }
        }
    }
    
    func clearPending() {
        pendingEventCode = nil
        pendingGroupCode = nil
        navigateToEvent = nil
    }
}
```

### 4. Link Generation Utility
```swift
struct LinkGenerator {
    static let domain = "https://yourdomain.com"  // Configure this
    
    static func eventLink(code: String) -> URL? {
        URL(string: "\(domain)/event/\(code)")
    }
    
    static func groupLink(code: String) -> URL? {
        URL(string: "\(domain)/group/\(code)")
    }
    
    static func shareText(for event: Event) -> String {
        guard let code = event.inviteCode else {
            return "Check out \(event.title) on Dispo!"
        }
        return "Join my event on Dispo!\n\n\(event.title)\n\(domain)/event/\(code)"
    }
}
```

### 5. Production Security Rules
```javascript
// firestore.rules - PRODUCTION
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - read any, write own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
      allow delete: if false;  // Users can't delete accounts (handle via support)
      
      // User's invitations subcollection
      match /invitations/{invitationId} {
        allow read: if request.auth.uid == userId;
        allow write: if request.auth != null;  // Anyone can send invites
      }
    }
    
    // Groups
    match /groups/{groupId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // Events
    match /events/{eventId} {
      // Complex visibility rules
      allow read: if request.auth != null && (
        resource.data.visibility == 'public' ||
        resource.data.creatorId == request.auth.uid ||
        (resource.data.visibility == 'group' && 
         request.auth.uid in get(/databases/$(database)/documents/groups/$(resource.data.groupId)).data.members) ||
        request.auth.uid in resource.data.invitedUserIds
      ) && !(request.auth.uid in resource.data.excludedUserIds);
      
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.creatorId;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.creatorId;
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth.uid == resource.data.authorId;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
      
      // RSVPs subcollection
      match /rsvps/{odors} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == rsvpId;
      }
      
      // Photos subcollection
      match /photos/{photoId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.uploaderId;
      }
    }
  }
}
```

```javascript
// storage.rules - PRODUCTION
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /events/{eventId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024  // 10MB max
        && request.resource.contentType.matches('image/.*');
    }
    
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // 5MB max
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Hosting Options for AASA

### Option A: Firebase Hosting (easiest if already using Firebase)
```bash
# Initialize Firebase Hosting
firebase init hosting

# Create .well-known directory
mkdir -p public/.well-known

# Add AASA file
echo '{"applinks":{"apps":[],"details":[{"appID":"TEAMID.bundleid","paths":["/event/*","/group/*"]}]}}' > public/.well-known/apple-app-site-association

# Add firebase.json hosting config
{
  "hosting": {
    "public": "public",
    "headers": [{
      "source": "/.well-known/apple-app-site-association",
      "headers": [{"key": "Content-Type", "value": "application/json"}]
    }]
  }
}

# Deploy
firebase deploy --only hosting
```

### Option B: Simple Landing Page
Create a simple web page at the domain that:
- Shows app info and download link
- Hosts AASA file
- Can be a single HTML file + AASA

### Option C: Vercel/Netlify
- Free hosting for static sites
- Easy custom domain setup
- Just need AASA file and optional landing page

## App Store Checklist

### Before Submission
- [ ] Real authentication working (no fake login)
- [ ] Production security rules deployed
- [ ] All test data removed
- [ ] App icons for all sizes
- [ ] Launch screen configured
- [ ] Privacy policy URL (required)
- [ ] Support URL

### App Store Connect
- [ ] Create app record
- [ ] App name, subtitle, description
- [ ] Keywords for search
- [ ] Screenshots (6.7", 6.5", 5.5" iPhones + iPad if supporting)
- [ ] App preview video (optional but helps)
- [ ] Age rating questionnaire
- [ ] Price (free or paid)
- [ ] In-app purchases (if any)

### TestFlight
- [ ] Upload build from Xcode
- [ ] Internal testing (up to 100 testers, instant)
- [ ] External testing (up to 10,000, requires review)
- [ ] Collect feedback before App Store submission

## Acceptance Criteria
- [ ] AASA file hosted and accessible
- [ ] Universal Links open app correctly
- [ ] Fallback to App Store if not installed
- [ ] Production security rules deployed
- [ ] App submitted to App Store
- [ ] TestFlight beta available

## Timeline Estimate
1. Domain + AASA setup: 1-2 hours
2. Universal Links code: 2-3 hours
3. Production rules testing: 2-3 hours
4. App Store assets prep: 4-6 hours
5. Submission + review: 1-3 days (Apple review time varies)

## Notes
- Apple reviews AASA file when app is installed - changes may take time to propagate
- Test Universal Links with Notes app (paste link, long press, "Open in Dispo")
- Custom URL scheme (`dispo://`) is fallback, doesn't require domain
- Consider App Clip for lightweight "try before install" (future enhancement)
