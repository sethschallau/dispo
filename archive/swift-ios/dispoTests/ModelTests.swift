//
//  ModelTests.swift
//  dispoTests
//
//  Created by Pear Guy on 1/29/26.
//

import XCTest
@testable import dispo

final class ModelTests: XCTestCase {
    
    // MARK: - Event Tests
    
    func testEventInitialization() throws {
        let event = Event(
            id: "test123",
            title: "Test Event",
            description: "A test description",
            eventDate: Date(),
            creatorId: "user123",
            visibility: "public",
            location: "Test Location"
        )
        
        XCTAssertEqual(event.id, "test123")
        XCTAssertEqual(event.title, "Test Event")
        XCTAssertEqual(event.description, "A test description")
        XCTAssertEqual(event.creatorId, "user123")
        XCTAssertEqual(event.visibility, "public")
        XCTAssertEqual(event.location, "Test Location")
        XCTAssertNil(event.groupId)
        XCTAssertNil(event.imageUrl)
    }
    
    func testEventWithGroupVisibility() throws {
        let event = Event(
            id: "group-event",
            title: "Group Event",
            eventDate: Date(),
            creatorId: "user123",
            groupId: "group456",
            visibility: "group"
        )
        
        XCTAssertEqual(event.visibility, "group")
        XCTAssertEqual(event.groupId, "group456")
    }
    
    func testEventWithExcludedUsers() throws {
        let event = Event(
            id: "excluded-event",
            title: "Private Party",
            eventDate: Date(),
            creatorId: "user123",
            visibility: "group",
            excludedUserIds: ["user456", "user789"]
        )
        
        XCTAssertEqual(event.excludedUserIds?.count, 2)
        XCTAssertTrue(event.excludedUserIds?.contains("user456") ?? false)
        XCTAssertTrue(event.excludedUserIds?.contains("user789") ?? false)
    }
    
    // MARK: - EventVisibility Tests
    
    func testEventVisibilityDisplayName() throws {
        XCTAssertEqual(EventVisibility.public.displayName, "Public")
        XCTAssertEqual(EventVisibility.group.displayName, "Group")
        XCTAssertEqual(EventVisibility.private.displayName, "Private")
        XCTAssertEqual(EventVisibility.friends.displayName, "Friends")
    }
    
    func testEventVisibilityIcon() throws {
        XCTAssertEqual(EventVisibility.public.icon, "globe")
        XCTAssertEqual(EventVisibility.group.icon, "person.3")
        XCTAssertEqual(EventVisibility.private.icon, "lock")
        XCTAssertEqual(EventVisibility.friends.icon, "person.2")
    }
    
    // MARK: - User Tests
    
    func testUserInitialization() throws {
        let user = User(
            id: "user123",
            username: "testuser",
            fullName: "Test User",
            phone: "1234567890",
            groupIds: ["group1", "group2"],
            bio: "Test bio"
        )
        
        XCTAssertEqual(user.id, "user123")
        XCTAssertEqual(user.username, "testuser")
        XCTAssertEqual(user.fullName, "Test User")
        XCTAssertEqual(user.phone, "1234567890")
        XCTAssertEqual(user.groupIds?.count, 2)
        XCTAssertEqual(user.bio, "Test bio")
        XCTAssertNil(user.profilePicUrl)
    }
    
    func testUserWithoutOptionalFields() throws {
        let user = User(
            username: "minimal",
            fullName: "Minimal User"
        )
        
        XCTAssertNil(user.id)
        XCTAssertEqual(user.username, "minimal")
        XCTAssertEqual(user.fullName, "Minimal User")
        XCTAssertNil(user.phone)
        XCTAssertNil(user.groupIds)
        XCTAssertNil(user.bio)
    }
    
    // MARK: - Comment Tests
    
    func testCommentInitialization() throws {
        let comment = Comment(
            id: "comment123",
            authorId: "user456",
            text: "This is a test comment",
            authorName: "Test Author"
        )
        
        XCTAssertEqual(comment.id, "comment123")
        XCTAssertEqual(comment.authorId, "user456")
        XCTAssertEqual(comment.text, "This is a test comment")
        XCTAssertEqual(comment.authorName, "Test Author")
    }
    
    func testCommentWithoutAuthorName() throws {
        let comment = Comment(
            authorId: "user789",
            text: "Anonymous comment"
        )
        
        XCTAssertNil(comment.id)
        XCTAssertEqual(comment.authorId, "user789")
        XCTAssertEqual(comment.text, "Anonymous comment")
        XCTAssertNil(comment.authorName)
    }
}
