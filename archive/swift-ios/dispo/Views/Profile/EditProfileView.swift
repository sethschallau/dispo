//
//  EditProfileView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI
import Combine

struct EditProfileView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authService: AuthService
    
    @State private var fullName = ""
    @State private var bio = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Full Name", text: $fullName)
                    
                    TextField("Bio", text: $bio, axis: .vertical)
                        .lineLimit(2...4)
                } header: {
                    Text("Profile Info")
                }
                
                Section {
                    HStack {
                        Text("Username")
                        Spacer()
                        Text("@\(authService.currentUser?.username ?? "")")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Phone")
                        Spacer()
                        Text(authService.currentUser?.phone ?? "")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("Account")
                } footer: {
                    Text("Username and phone cannot be changed in MVP")
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .disabled(isLoading)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveProfile() }
                        .fontWeight(.semibold)
                        .disabled(!hasChanges || isLoading)
                }
            }
            .onAppear {
                fullName = authService.currentUser?.fullName ?? ""
                bio = authService.currentUser?.bio ?? ""
            }
            .interactiveDismissDisabled(isLoading)
        }
    }
    
    private var hasChanges: Bool {
        let nameChanged = fullName != (authService.currentUser?.fullName ?? "")
        let bioChanged = bio != (authService.currentUser?.bio ?? "")
        return (nameChanged || bioChanged) && !fullName.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    private func saveProfile() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                try await authService.updateProfile(
                    name: fullName.trimmingCharacters(in: .whitespaces),
                    bio: bio.trimmingCharacters(in: .whitespaces)
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    EditProfileView()
        .environmentObject(AuthService.shared)
}
