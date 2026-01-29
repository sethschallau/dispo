//
//  ServiceTests.swift
//  dispoTests
//
//  Created by Pear Guy on 1/29/26.
//

import XCTest
@testable import dispo

final class ServiceTests: XCTestCase {
    
    // MARK: - Group Model Tests
    
    func testGroupInitialization() throws {
        let group = Group(
            id: "group123",
            name: "Test Group",
            description: "A test group",
            members: ["user1", "user2", "user3"],
            ownerId: "user1",
            joinCode: "ABC123"
        )
        
        XCTAssertEqual(group.id, "group123")
        XCTAssertEqual(group.name, "Test Group")
        XCTAssertEqual(group.description, "A test group")
        XCTAssertEqual(group.members.count, 3)
        XCTAssertEqual(group.ownerId, "user1")
        XCTAssertEqual(group.joinCode, "ABC123")
    }
    
    func testGroupMembership() throws {
        let group = Group(
            name: "Test Group",
            members: ["user1", "user2"],
            ownerId: "user1"
        )
        
        XCTAssertTrue(group.members.contains("user1"))
        XCTAssertTrue(group.members.contains("user2"))
        XCTAssertFalse(group.members.contains("user3"))
    }
    
    // MARK: - Event Visibility Tests
    
    func testPublicEventVisibility() throws {
        let event = Event(
            id: "event1",
            title: "Public Event",
            eventDate: Date(),
            creatorId: "user1",
            visibility: "public"
        )
        
        // Public events should be visible to anyone (unless excluded)
        XCTAssertEqual(event.visibility, "public")
        XCTAssertNil(event.groupId)
        XCTAssertNil(event.excludedUserIds)
    }
    
    func testGroupEventVisibility() throws {
        let event = Event(
            id: "event2",
            title: "Group Event",
            eventDate: Date(),
            creatorId: "user1",
            groupId: "group123",
            visibility: "group"
        )
        
        // Group events should have a groupId
        XCTAssertEqual(event.visibility, "group")
        XCTAssertEqual(event.groupId, "group123")
    }
    
    func testPrivateEventVisibility() throws {
        let event = Event(
            id: "event3",
            title: "Private Event",
            eventDate: Date(),
            creatorId: "user1",
            visibility: "private"
        )
        
        // Private events should only be visible to creator
        XCTAssertEqual(event.visibility, "private")
        XCTAssertEqual(event.creatorId, "user1")
    }
    
    func testExcludedUserFiltering() throws {
        let event = Event(
            id: "event4",
            title: "Surprise Party",
            eventDate: Date(),
            creatorId: "user1",
            visibility: "group",
            excludedUserIds: ["user2", "user3"]
        )
        
        // Test that excluded users list works
        XCTAssertTrue(event.excludedUserIds?.contains("user2") ?? false)
        XCTAssertTrue(event.excludedUserIds?.contains("user3") ?? false)
        XCTAssertFalse(event.excludedUserIds?.contains("user1") ?? true)
        XCTAssertFalse(event.excludedUserIds?.contains("user4") ?? true)
    }
    
    // MARK: - Event Sorting Tests
    
    func testEventDateSorting() throws {
        let now = Date()
        
        let event1 = Event(
            id: "1",
            title: "First",
            eventDate: now.addingTimeInterval(86400), // +1 day
            creatorId: "user1",
            visibility: "public"
        )
        
        let event2 = Event(
            id: "2", 
            title: "Second",
            eventDate: now.addingTimeInterval(86400 * 3), // +3 days
            creatorId: "user1",
            visibility: "public"
        )
        
        let event3 = Event(
            id: "3",
            title: "Third",
            eventDate: now.addingTimeInterval(86400 * 2), // +2 days
            creatorId: "user1",
            visibility: "public"
        )
        
        let events = [event1, event2, event3]
        let sorted = events.sorted { $0.eventDate < $1.eventDate }
        
        XCTAssertEqual(sorted[0].title, "First")
        XCTAssertEqual(sorted[1].title, "Third")
        XCTAssertEqual(sorted[2].title, "Second")
    }
    
    // MARK: - Past/Upcoming Event Tests
    
    func testPastVsUpcomingEvents() throws {
        let now = Date()
        
        let pastEvent = Event(
            id: "past",
            title: "Past Event",
            eventDate: now.addingTimeInterval(-86400), // -1 day
            creatorId: "user1",
            visibility: "public"
        )
        
        let upcomingEvent = Event(
            id: "upcoming",
            title: "Upcoming Event",
            eventDate: now.addingTimeInterval(86400), // +1 day
            creatorId: "user1",
            visibility: "public"
        )
        
        XCTAssertTrue(pastEvent.eventDate < now)
        XCTAssertTrue(upcomingEvent.eventDate >= now)
    }
}
