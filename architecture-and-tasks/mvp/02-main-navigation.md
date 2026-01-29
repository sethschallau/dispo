# Task: Main Tab Navigation

## Description
Create the main navigation structure using TabView with Feed, Groups, and Profile tabs.

## Prerequisites
- Task `01-fake-login` complete
- User can log in and reach MainTabView

## Implementation

### Step 1: Update MainTabView
Replace the placeholder `Views/MainTabView.swift`:

```swift
import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            FeedView()
                .tabItem {
                    Label("Feed", systemImage: "house.fill")
                }
                .tag(0)
            
            GroupsView()
                .tabItem {
                    Label("Groups", systemImage: "person.3.fill")
                }
                .tag(1)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle.fill")
                }
                .tag(2)
        }
        .environmentObject(authService)
    }
}
```

### Step 2: Create Feed View Placeholder
Create `Views/Feed/FeedView.swift`:

```swift
import SwiftUI

struct FeedView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showCreateEvent = false
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Feed View")
                    .font(.title2)
                    .foregroundColor(.secondary)
                Text("Events will appear here")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Feed")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateEvent = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateEvent) {
                CreateEventView()
            }
        }
    }
}
```

### Step 3: Create Groups View Placeholder
Create `Views/Groups/GroupsView.swift`:

```swift
import SwiftUI

struct GroupsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showCreateGroup = false
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Groups View")
                    .font(.title2)
                    .foregroundColor(.secondary)
                Text("Your groups will appear here")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .navigationTitle("Groups")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateGroup = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
    }
}
```

### Step 4: Create Profile View Placeholder
Create `Views/Profile/ProfileView.swift`:

```swift
import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthService
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Profile Picture Placeholder
                Circle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 100, height: 100)
                    .overlay(
                        Image(systemName: "person.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.gray)
                    )
                
                // User Info
                VStack(spacing: 8) {
                    Text(authService.currentUser?.fullName ?? "Unknown")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("@\(authService.currentUser?.username ?? "user")")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    if let phone = authService.currentUser?.phone {
                        Text(phone)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Logout Button
                Button(action: { authService.logout() }) {
                    Text("Logout")
                        .foregroundColor(.red)
                }
                .padding(.bottom, 32)
            }
            .padding()
            .navigationTitle("Profile")
        }
    }
}
```

### Step 5: Create CreateEventView Placeholder
Create `Views/Events/CreateEventView.swift`:

```swift
import SwiftUI

struct CreateEventView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Create Event Form")
                    .font(.title2)
                    .foregroundColor(.secondary)
                Text("Coming in task 04")
                    .font(.caption)
            }
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
```

### Step 6: Create Project Structure
Organize files into folders:
```
dispo/
├── Models/
│   └── User.swift
├── Services/
│   └── AuthService.swift
├── Views/
│   ├── LoginView.swift
│   ├── MainTabView.swift
│   ├── Feed/
│   │   └── FeedView.swift
│   ├── Events/
│   │   └── CreateEventView.swift
│   ├── Groups/
│   │   └── GroupsView.swift
│   └── Profile/
│       └── ProfileView.swift
└── DispoApp.swift
```

## Acceptance Criteria
- [ ] Tab bar appears with 3 tabs: Feed, Groups, Profile
- [ ] Each tab shows its respective view
- [ ] Tab icons use SF Symbols
- [ ] Navigation title displays on each screen
- [ ] Feed view has "+" button in toolbar
- [ ] Profile view shows current user's name
- [ ] Logout button works and returns to login

## Test Verification
1. Log in as test user
2. Verify all 3 tabs are visible
3. Tap each tab to confirm navigation works
4. Verify "+" button appears on Feed
5. Tap Profile → Logout and confirm return to login

## Notes
- Views are placeholders; will be implemented in subsequent tasks
- NavigationView wrapped around each tab for proper nav stack
- Using @EnvironmentObject to pass AuthService down the view hierarchy
