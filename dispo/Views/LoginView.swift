//
//  LoginView.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    
    @State private var phoneNumber = ""
    @State private var displayName = ""
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // App Title
            VStack(spacing: 8) {
                Text("Dispo")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                Text("Share your availability")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Input Fields
            VStack(spacing: 16) {
                TextField("Phone Number", text: $phoneNumber)
                    .keyboardType(.phonePad)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.telephoneNumber)
                
                TextField("Display Name", text: $displayName)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.name)
                    .autocorrectionDisabled()
            }
            .padding(.horizontal, 32)
            
            // Error Message
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
                    .padding(.horizontal)
            }
            
            // Continue Button
            Button(action: login) {
                Group {
                    if authService.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Continue")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
            }
            .background(isValid ? Color.blue : Color.gray.opacity(0.5))
            .foregroundColor(.white)
            .cornerRadius(12)
            .padding(.horizontal, 32)
            .disabled(!isValid || authService.isLoading)
            
            Spacer()
            
            // MVP Notice
            Text("MVP: No SMS verification")
                .font(.caption2)
                .foregroundColor(.secondary)
                .padding(.bottom, 16)
        }
    }
    
    private var isValid: Bool {
        let digitsOnly = phoneNumber.filter { $0.isNumber }
        return digitsOnly.count >= 10 && !displayName.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    private func login() {
        errorMessage = nil
        
        Task {
            do {
                try await authService.login(phone: phoneNumber, name: displayName)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthService.shared)
}
