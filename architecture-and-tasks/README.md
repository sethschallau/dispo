# Dispo - Architecture and Tasks

Dispo is a social availability and event coordination app for iOS (SwiftUI) with a Firebase backend.

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
├── mvp/              # MVP implementation tasks (ordered)
│   ├── 00-firebase-setup.md
│   ├── 01-fake-login.md
│   ├── 02-main-navigation.md
│   ├── 03-group-management.md
│   ├── 04-event-creation.md
│   ├── 05-feed-view.md
│   ├── 06-event-detail.md
│   ├── 07-calendar-view.md
│   ├── 08-profile-view.md
│   ├── 09-notifications-view.md
│   ├── 10-security-rules.md
│   └── 11-testing.md
└── full/             # Post-MVP features
    ├── 00-authentication.md
    ├── 01-calendar-integration.md
    ├── 02-push-notifications.md
    └── 03-enhanced-features.md
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

### MVP Phase
1. Start with `schemas/` to understand the data model
2. Execute `mvp/` tasks in numerical order (00 → 11)
3. Each task builds on the previous

### Full Application Phase
After MVP is complete, execute `full/` tasks in any order based on priority.

## Firebase Project

- Project: dispo
- Bundle ID: schallau.dispo
- Config: `GoogleService-Info.plist` (do NOT commit to public repos)

## Key Design Decisions

1. **No Auth in MVP**: Users enter a phone number as identifier (no verification)
2. **Client-side Visibility**: Privacy rules enforced client-side until auth is added
3. **Subcollections**: Comments and RSVPs stored as subcollections under events
4. **Firestore**: NoSQL document database, schema-flexible
5. **SwiftUI**: Modern declarative UI framework for iOS
