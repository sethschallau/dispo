# Dispo - Swift/SwiftUI Implementation (Archived)

**Status:** Archived  
**Archived:** January 29, 2025  
**Successor:** Expo/React Native (see `/architecture-and-tasks/expo/`)

---

## Why We Moved On

During development of the Swift/SwiftUI implementation, extensive discussions about UI/UX direction revealed that the native iOS tooling wasn't giving us the creative flexibility we needed. After exploring what we actually wanted Dispo to *feel* like — the animations, the visual language, the cross-platform potential — we reached a mutual conclusion:

**React Native (Expo) would better enable our artistic vision.**

SwiftUI is excellent for conventional iOS apps, but Dispo isn't trying to be conventional. The switch to Expo gives us:
- More expressive animation capabilities (Reanimated, Skia)
- Cross-platform from day one
- Faster iteration on visual experiments
- A component ecosystem that matches our aesthetic ambitions

The Swift code here represents solid foundational work — proper service architecture, clean view separation, Firebase integration. It's preserved for reference and in case any patterns prove useful.

---

## What's Here

```
swift-ios/
├── dispo/                 # Main app source
│   ├── Services/          # Firebase service layer
│   ├── Views/             # SwiftUI views by feature
│   └── Models/            # Data models
├── dispoTests/            # Unit tests
├── dispoUITests/          # UI tests
└── dispo.xcodeproj/       # Xcode project
```

## Lessons Learned

1. SwiftUI's declarative model is pleasant but opinionated
2. Firebase + Swift requires careful async handling
3. The service/view separation pattern translates well to any architecture
4. Sometimes you need to build something to know it's not quite right

---

*This archive exists because we believe in keeping receipts. The code worked. It just wasn't the path forward.*
