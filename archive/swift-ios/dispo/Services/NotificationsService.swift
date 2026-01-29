//
//  NotificationsService.swift
//  dispo
//
//  Created by Pear Guy on 1/29/26.
//

import Foundation
import Combine
import FirebaseFirestore
import UserNotifications

@MainActor
class NotificationsService: ObservableObject {
    @Published var notifications: [AppNotification] = []
    @Published var unreadCount: Int = 0
    @Published var isLoading = false
    
    private let db = Firestore.firestore()
    private var listener: ListenerRegistration?
    
    // MARK: - In-App Notifications
    
    /// Load notifications for a user
    func loadNotifications(for userId: String) {
        isLoading = true
        
        listener?.remove()
        listener = db.collection("users")
            .document(userId)
            .collection("notifications")
            .order(by: "timestamp", descending: true)
            .limit(to: 50)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self = self else { return }
                self.isLoading = false
                
                if let error = error {
                    print("Error loading notifications: \(error)")
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self.notifications = documents.compactMap { doc in
                    try? doc.data(as: AppNotification.self)
                }
                
                self.unreadCount = self.notifications.filter { !$0.read }.count
            }
    }
    
    /// Mark a notification as read
    func markAsRead(notificationId: String, userId: String) async throws {
        try await db.collection("users")
            .document(userId)
            .collection("notifications")
            .document(notificationId)
            .updateData(["read": true])
    }
    
    /// Mark all notifications as read
    func markAllAsRead(userId: String) async throws {
        let unreadNotifs = notifications.filter { !$0.read }
        
        for notif in unreadNotifs {
            guard let id = notif.id else { continue }
            try await db.collection("users")
                .document(userId)
                .collection("notifications")
                .document(id)
                .updateData(["read": true])
        }
    }
    
    func stopListening() {
        listener?.remove()
        listener = nil
    }
    
    deinit {
        listener?.remove()
    }
    
    // MARK: - Local Push Notifications (Reminders)
    
    /// Request permission for local notifications
    static func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            return granted
        } catch {
            print("Error requesting notification permission: \(error)")
            return false
        }
    }
    
    /// Schedule a local reminder for an event
    static func scheduleEventReminder(
        eventId: String,
        eventTitle: String,
        eventDate: Date,
        reminderOffset: TimeInterval // seconds before event
    ) {
        let center = UNUserNotificationCenter.current()
        
        // Calculate trigger time
        let triggerDate = eventDate.addingTimeInterval(-reminderOffset)
        
        // Don't schedule if trigger is in the past
        guard triggerDate > Date() else { return }
        
        // Create content
        let content = UNMutableNotificationContent()
        content.title = "Upcoming Event"
        content.body = formatReminderMessage(eventTitle: eventTitle, offset: reminderOffset)
        content.sound = .default
        content.userInfo = ["eventId": eventId]
        
        // Create trigger
        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: triggerDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        // Create request
        let identifier = "event-reminder-\(eventId)-\(Int(reminderOffset))"
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )
        
        // Schedule
        center.add(request) { error in
            if let error = error {
                print("Error scheduling reminder: \(error)")
            }
        }
    }
    
    /// Cancel all reminders for an event
    static func cancelEventReminders(eventId: String) {
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { requests in
            let identifiers = requests
                .filter { $0.identifier.contains("event-reminder-\(eventId)") }
                .map { $0.identifier }
            center.removePendingNotificationRequests(withIdentifiers: identifiers)
        }
    }
    
    /// Format reminder message based on offset
    private static func formatReminderMessage(eventTitle: String, offset: TimeInterval) -> String {
        let minutes = Int(offset / 60)
        
        if minutes < 60 {
            return "\(eventTitle) starts in \(minutes) minutes"
        } else {
            let hours = minutes / 60
            if hours == 1 {
                return "\(eventTitle) starts in 1 hour"
            } else {
                return "\(eventTitle) starts in \(hours) hours"
            }
        }
    }
    
    /// Common reminder offsets
    static let reminderOffsets: [(label: String, seconds: TimeInterval)] = [
        ("15 minutes before", 15 * 60),
        ("30 minutes before", 30 * 60),
        ("1 hour before", 60 * 60),
        ("2 hours before", 2 * 60 * 60),
        ("1 day before", 24 * 60 * 60)
    ]
}
