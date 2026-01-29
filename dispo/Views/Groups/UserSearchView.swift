//
//  UserSearchView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct UserSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""
    @State private var results: [User] = []
    @State private var isSearching = false
    @State private var hasSearched = false
    
    let onSelect: (User) -> Void
    var excludeUserIds: [String] = []
    var title: String = "Find Users"
    
    var filteredResults: [User] {
        results.filter { user in
            guard let userId = user.id else { return true }
            return !excludeUserIds.contains(userId)
        }
    }
    
    var body: some View {
        NavigationView {
            List {
                if isSearching {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                } else if filteredResults.isEmpty && hasSearched {
                    VStack(spacing: 8) {
                        Image(systemName: "person.slash")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                        Text("No users found")
                            .foregroundColor(.secondary)
                        if !searchText.isEmpty {
                            Text("Try a different username")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                    .listRowBackground(Color.clear)
                } else if !hasSearched {
                    VStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                        Text("Search by username")
                            .foregroundColor(.secondary)
                        Text("Enter at least 2 characters")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                    .listRowBackground(Color.clear)
                } else {
                    ForEach(filteredResults) { user in
                        Button(action: { selectUser(user) }) {
                            UserRow(user: user)
                        }
                        .foregroundColor(.primary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .searchable(text: $searchText, prompt: "Search by username")
            .onChange(of: searchText) { _, newValue in
                performSearch(query: newValue)
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
    
    private func performSearch(query: String) {
        guard query.count >= 2 else {
            results = []
            hasSearched = false
            return
        }
        
        isSearching = true
        hasSearched = true
        
        Task {
            do {
                let users = try await UserService.shared.searchUsers(query: query)
                await MainActor.run {
                    results = users
                    isSearching = false
                }
            } catch {
                await MainActor.run {
                    results = []
                    isSearching = false
                }
            }
        }
    }
    
    private func selectUser(_ user: User) {
        onSelect(user)
        dismiss()
    }
}

// MARK: - User Row

struct UserRow: View {
    let user: User
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(user.fullName.prefix(1).uppercased())
                        .font(.headline)
                        .foregroundColor(.secondary)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(user.fullName)
                    .font(.headline)
                
                Text("@\(user.username)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .contentShape(Rectangle())
    }
}

// MARK: - Preview

#Preview {
    UserSearchView(onSelect: { user in
        print("Selected: \(user.fullName)")
    })
}
