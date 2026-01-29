//
//  JoinEventView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct JoinEventView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var authService: AuthService
    
    @State private var code = ""
    @State private var isSearching = false
    @State private var foundEvent: Event?
    @State private var errorMessage: String?
    @State private var isJoining = false
    @State private var joinSuccess = false
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Event Code (e.g., EVT-XK7M)", text: $code)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .font(.system(.body, design: .monospaced))
                    
                    Button(action: searchEvent) {
                        HStack {
                            Spacer()
                            if isSearching {
                                ProgressView()
                            } else {
                                Text("Find Event")
                            }
                            Spacer()
                        }
                    }
                    .disabled(code.count < 4 || isSearching)
                } header: {
                    Text("Enter Event Code")
                } footer: {
                    Text("Get the code from the event host")
                }
                
                if let error = errorMessage {
                    Section {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text(error)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                if let event = foundEvent {
                    Section("Found Event") {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(event.title)
                                .font(.headline)
                            
                            Label {
                                Text(event.eventDate, format: .dateTime.weekday(.wide).month(.abbreviated).day().hour().minute())
                            } icon: {
                                Image(systemName: "calendar")
                            }
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            
                            if let location = event.location, !location.isEmpty {
                                Label(location, systemImage: "mappin")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            if let description = event.description, !description.isEmpty {
                                Text(description)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    
                    Section {
                        Button(action: joinEvent) {
                            HStack {
                                Spacer()
                                if isJoining {
                                    ProgressView()
                                } else if joinSuccess {
                                    Label("Joined!", systemImage: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                } else {
                                    Label("Join Event", systemImage: "plus.circle.fill")
                                }
                                Spacer()
                            }
                        }
                        .disabled(isJoining || joinSuccess)
                    }
                }
            }
            .navigationTitle("Join Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
    
    private func searchEvent() {
        isSearching = true
        errorMessage = nil
        foundEvent = nil
        joinSuccess = false
        
        Task {
            do {
                let service = EventsService()
                if let event = try await service.findEvent(byCode: code.uppercased()) {
                    await MainActor.run {
                        foundEvent = event
                    }
                } else {
                    await MainActor.run {
                        errorMessage = "No event found with that code"
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                }
            }
            await MainActor.run {
                isSearching = false
            }
        }
    }
    
    private func joinEvent() {
        guard let event = foundEvent,
              let eventId = event.id,
              let userId = authService.currentUserId else { return }
        
        isJoining = true
        
        Task {
            do {
                let service = EventsService()
                try await service.joinEventByCode(eventId, userId: userId)
                await MainActor.run {
                    isJoining = false
                    joinSuccess = true
                }
                
                // Dismiss after a short delay
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isJoining = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}

#Preview {
    JoinEventView()
        .environmentObject(AuthService.shared)
}
