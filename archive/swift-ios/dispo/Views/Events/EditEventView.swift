//
//  EditEventView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct EditEventView: View {
    @Environment(\.dismiss) private var dismiss
    
    @State var event: Event
    @State private var title: String
    @State private var description: String
    @State private var eventDate: Date
    @State private var location: String
    
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    init(event: Event) {
        self._event = State(initialValue: event)
        self._title = State(initialValue: event.title)
        self._description = State(initialValue: event.description ?? "")
        self._eventDate = State(initialValue: event.eventDate)
        self._location = State(initialValue: event.location ?? "")
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Event Details") {
                    TextField("Title", text: $title)
                    
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                    
                    TextField("Location", text: $location)
                }
                
                Section("Date & Time") {
                    DatePicker("When", selection: $eventDate, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                }
                
                Section("Visibility") {
                    HStack {
                        Image(systemName: visibilityIcon)
                            .foregroundColor(.secondary)
                        Text(event.visibility.capitalized)
                            .foregroundColor(.secondary)
                    }
                    
                    if event.visibility == "group", let groupId = event.groupId {
                        Text("Group ID: \(groupId)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Text("Visibility cannot be changed after creation")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Edit Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveChanges() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .overlay {
                if isLoading {
                    Color.black.opacity(0.2)
                        .ignoresSafeArea()
                    ProgressView()
                }
            }
        }
    }
    
    private var visibilityIcon: String {
        switch event.visibility {
        case "public": return "globe"
        case "group": return "person.3"
        case "private": return "lock"
        default: return "eye"
        }
    }
    
    private func saveChanges() {
        isLoading = true
        
        // Update event with new values
        var updatedEvent = event
        updatedEvent.title = title.trimmingCharacters(in: .whitespaces)
        updatedEvent.description = description.trimmingCharacters(in: .whitespaces).isEmpty ? nil : description.trimmingCharacters(in: .whitespaces)
        updatedEvent.eventDate = eventDate
        updatedEvent.location = location.trimmingCharacters(in: .whitespaces).isEmpty ? nil : location.trimmingCharacters(in: .whitespaces)
        
        Task {
            do {
                let service = EventsService()
                try await service.updateEvent(updatedEvent)
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    isLoading = false
                }
            }
        }
    }
}

#Preview {
    EditEventView(event: Event(
        id: "preview",
        title: "Test Event",
        description: "A test description",
        eventDate: Date().addingTimeInterval(86400),
        creatorId: "user1",
        visibility: "public",
        location: "Raleigh, NC"
    ))
}
