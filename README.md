# Dispo

A social availability and event coordination app. Know when your people are free, plan things that actually happen.

## Stack

- **Frontend:** Expo / React Native (TypeScript)
- **Backend:** Firebase (Firestore, Auth, Storage)
- **Platform:** iOS & Android

## Project Structure

```
dispo/
├── architecture-and-tasks/    # Implementation specs and task files
│   ├── schemas/               # Firestore data models
│   └── expo/                  # Active implementation tasks
├── archive/                   # Previous implementations
│   └── swift-ios/             # Original SwiftUI prototype
├── scripts/                   # Build and utility scripts
└── [expo app - coming soon]   # React Native source
```

## Getting Started

*Expo project initialization pending — see `architecture-and-tasks/expo/00-project-setup.md`*

## Firebase

- **Project:** dispo-2faf1
- **Storage:** gs://dispo-2faf1.firebasestorage.app

## Development Notes

We pivoted from Swift/SwiftUI to Expo after extensive prototyping. The native iOS tooling wasn't giving us the creative flexibility needed for our vision — React Native's animation ecosystem (Reanimated, Skia) and cross-platform reach made more sense. The Swift prototype is archived at `/archive/swift-ios/` for reference.

---

*Built with 🍐 by Seth & Pear Guy*
