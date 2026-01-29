# Task: Location Integration (MapKit)

## Agent Summary
| Aspect | Details |
|--------|---------|
| **Can agent do alone?** | ⚠️ Partial - code yes, but needs Info.plist for location permission |
| **Human tasks** | Add location permission string to Info.plist if enabling current location |
| **Agent tasks** | Add location to Event model, create map views, location picker |
| **Estimated complexity** | Medium |
| **Dependencies** | MVP complete |

## What Needs to Happen

### Human Must Do (Seth) - Only if enabling "current location" feature
Add to Info.plist via Xcode:
- `NSLocationWhenInUseUsageDescription` = "Dispo uses your location to suggest event locations."

Note: Displaying maps and searching locations does NOT require permission. Only getting the user's current location does.

### Agent Can Do
1. Add location fields to Event model
2. Create location picker with search
3. Add map preview to EventDetailView
4. Update CreateEventView with location input
5. Integrate MapKit for display

## Implementation

### 1. Update Models/Event.swift
```swift
import CoreLocation

struct Event: Codable, Identifiable {
    // ... existing fields ...
    
    // Location fields
    var locationName: String?      // "Central Park"
    var locationAddress: String?   // "New York, NY"
    var latitude: Double?
    var longitude: Double?
    
    var hasLocation: Bool {
        latitude != nil && longitude != nil
    }
    
    var coordinate: CLLocationCoordinate2D? {
        guard let lat = latitude, let lon = longitude else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
}
```

### 2. Create Views/LocationPickerView.swift
```swift
import SwiftUI
import MapKit

struct LocationPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var searchResults: [MKMapItem] = []
    @State private var selectedLocation: MKMapItem?
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 35.7796, longitude: -78.6382), // Raleigh default
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    
    let onSelect: (String?, String?, Double, Double) -> Void  // name, address, lat, lon
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search bar
                TextField("Search location", text: $searchText)
                    .textFieldStyle(.roundedBorder)
                    .padding()
                    .onChange(of: searchText) { _, newValue in
                        searchLocations(query: newValue)
                    }
                
                if !searchResults.isEmpty {
                    // Search results list
                    List(searchResults, id: \.self) { item in
                        Button(action: { selectLocation(item) }) {
                            VStack(alignment: .leading) {
                                Text(item.name ?? "Unknown")
                                    .font(.headline)
                                if let address = item.placemark.formattedAddress {
                                    Text(address)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                } else {
                    // Map view
                    Map(coordinateRegion: $region, annotationItems: selectedLocation.map { [$0] } ?? []) { item in
                        MapMarker(coordinate: item.placemark.coordinate, tint: .red)
                    }
                }
            }
            .navigationTitle("Choose Location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { confirmSelection() }
                        .disabled(selectedLocation == nil)
                }
            }
        }
    }
    
    private func searchLocations(query: String) {
        guard query.count >= 2 else {
            searchResults = []
            return
        }
        
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        request.region = region
        
        let search = MKLocalSearch(request: request)
        search.start { response, error in
            if let results = response?.mapItems {
                searchResults = results
            }
        }
    }
    
    private func selectLocation(_ item: MKMapItem) {
        selectedLocation = item
        searchResults = []
        searchText = item.name ?? ""
        region.center = item.placemark.coordinate
    }
    
    private func confirmSelection() {
        guard let item = selectedLocation else { return }
        let placemark = item.placemark
        onSelect(
            item.name,
            placemark.formattedAddress,
            placemark.coordinate.latitude,
            placemark.coordinate.longitude
        )
        dismiss()
    }
}

extension CLPlacemark {
    var formattedAddress: String? {
        [locality, administrativeArea, country]
            .compactMap { $0 }
            .joined(separator: ", ")
    }
}
```

### 3. Create Views/EventMapView.swift
```swift
import SwiftUI
import MapKit

struct EventMapView: View {
    let event: Event
    
    var body: some View {
        if let coordinate = event.coordinate {
            VStack(alignment: .leading, spacing: 8) {
                // Location header
                if let name = event.locationName {
                    HStack {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(.red)
                        VStack(alignment: .leading) {
                            Text(name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            if let address = event.locationAddress {
                                Text(address)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        Spacer()
                        // Open in Maps button
                        Button(action: openInMaps) {
                            Image(systemName: "arrow.up.right.square")
                        }
                    }
                }
                
                // Map preview
                Map(coordinateRegion: .constant(MKCoordinateRegion(
                    center: coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
                )), annotationItems: [MapLocation(coordinate: coordinate)]) { location in
                    MapMarker(coordinate: location.coordinate, tint: .red)
                }
                .frame(height: 150)
                .cornerRadius(12)
                .disabled(true) // Static preview
                .onTapGesture { openInMaps() }
            }
        }
    }
    
    private func openInMaps() {
        guard let coordinate = event.coordinate else { return }
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = event.locationName
        mapItem.openInMaps()
    }
}

struct MapLocation: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
}
```

### 4. Update CreateEventView
```swift
// Add state
@State private var locationName: String?
@State private var locationAddress: String?
@State private var latitude: Double?
@State private var longitude: Double?
@State private var showLocationPicker = false

// Add location section
Section("Location (optional)") {
    if let name = locationName {
        HStack {
            VStack(alignment: .leading) {
                Text(name)
                if let address = locationAddress {
                    Text(address)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            Button(action: clearLocation) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.secondary)
            }
        }
    } else {
        Button(action: { showLocationPicker = true }) {
            Label("Add Location", systemImage: "mappin.and.ellipse")
        }
    }
}
.sheet(isPresented: $showLocationPicker) {
    LocationPickerView { name, address, lat, lon in
        locationName = name
        locationAddress = address
        latitude = lat
        longitude = lon
    }
}

// Update event creation to include location fields
```

### 5. Update EventDetailView
```swift
// Add map section if event has location
if event.hasLocation {
    EventMapView(event: event)
        .padding(.vertical)
}
```

## Files to Create/Modify
- [ ] `Models/Event.swift` - Add location fields
- [ ] `Views/LocationPickerView.swift` - Create new
- [ ] `Views/EventMapView.swift` - Create new
- [ ] `Views/CreateEventView.swift` - Add location picker
- [ ] `Views/EventDetailView.swift` - Add map display

## Acceptance Criteria
- [ ] Can search and select location when creating event
- [ ] Selected location shows name and address
- [ ] Event detail shows map preview if location set
- [ ] Tapping map opens in Apple Maps
- [ ] Location optional - events work without it
- [ ] Location data persisted in Firestore

## Test Cases
1. Create event with location → map appears in detail
2. Create event without location → no map shown
3. Search "Central Park" → results appear
4. Tap map → opens in Apple Maps
5. Clear location → removed from form
