# Dispo - Architecture and Tasks

Dispo is a social availability and event coordination app built with **Expo/React Native** and Firebase.

> **Platform Note:** We originally prototyped in Swift/SwiftUI but pivoted to Expo after extensive UI/UX exploration. The native tooling wasn't giving us the creative flexibility we needed — React Native (with Reanimated, Skia, etc.) better enables our artistic vision. See `/archive/swift-ios/` for the original implementation.

## Overview

This folder contains granular task files designed to be picked up by autonomous agents (or human developers). Each file describes a single unit of work with clear acceptance criteria.

## Structure

```
architecture-and-tasks/
├── schemas/          # Firestore collection schemas (one file per collection)
│   ├── users.md
│   ├── groups.md
│   ├── events.md
│   ├── comments.md
│   └── notifications.md
├── expo/             # Active implementation tasks (Expo/React Native)
│   ├── 00-project-setup.md
│   ├── 01-firebase-config.md
│   ├── ...
│   └── 15-production.md
├── mvp/              # [ARCHIVED] Original Swift MVP tasks
└── full/             # [ARCHIVED] Original Swift post-MVP tasks
```

## Task File Format

Each task file follows this structure:

```markdown
# Task Title

## Description
What this task accomplishes.

## Prerequisites
Tasks or conditions that must be complete first.

## Implementation
Step-by-step instructions.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Test Schema (if applicable)
Instructions for adding test data to verify the implementation.
```

## Execution Order

### Expo Implementation (Active)
1. Start with `schemas/` to understand the data model
2. Execute `expo/` tasks in numerical order (00 → 15)
3. Each task builds on the previous

### Archived Swift Tasks
The `mvp/` and `full/` directories contain the original Swift implementation tasks. Preserved for reference but no longer active.

## Firebase Project

- Project: dispo
- Bundle ID: schallau.dispo
- Config: `GoogleService-Info.plist` (do NOT commit to public repos)

## Key Design Decisions

1. **No Auth in MVP**: Users enter a phone number as identifier (no verification)
2. **Client-side Visibility**: Privacy rules enforced client-side until auth is added
3. **Subcollections**: Comments and RSVPs stored as subcollections under events
4. **Firestore**: NoSQL document database, schema-flexible
5. **Expo/React Native**: Cross-platform with rich animation capabilities (Reanimated, Skia)
6. **TypeScript**: Type safety across the codebase
