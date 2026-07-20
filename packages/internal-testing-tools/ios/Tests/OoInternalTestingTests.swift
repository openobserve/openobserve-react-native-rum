/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019-2020 Datadog, Inc.
 */

import XCTest
@testable import OpenObserveInternalTesting
@testable import OpenObserveSDKReactNative
import OpenObserveCore
import OpenObserveInternal
import React

internal class OoInternalTestingTests: XCTestCase {
    private func mockResolve(args: Any?) {}
    private func mockReject(args: String?, arg: String?, err: Error?) {}
    
    override func setUp() {
        super.setUp()
        OpenObserveSDKWrapper.shared.setCoreInstance(core: nil)
        OpenObserveSDKWrapper.shared.onCoreInitializedListeners = []
    }
    
    func testItReturnsSavedEventsWhenEnabled() {
        // Enable internal testing tool
        let internalTesting = OoInternalTestingImplementation()
        internalTesting.enable(resolve: mockResolve, reject: mockReject)

        // Initialize SDK and send logger message
        OpenObserveSDKWrapper.shared.initialize(with: .init(clientToken: "token", env: "env"), trackingConsent: .granted)
        OpenObserveSDKWrapper.shared.enableLogs(with: .init())
        let logger = OpenObserveSDKWrapper.shared.createLogger()
        logger.debug("debug log message")

        let eventsResolver = EventsResolver()
        internalTesting.getAllEvents(feature: "logging", resolve: eventsResolver.mockResolve, reject: mockReject(args:arg:err:))
        XCTAssertNotNil(eventsResolver.capturedEvents)
        XCTAssertTrue(eventsResolver.capturedEvents?.first?.contains("debug log message") == true)
    }
}



internal class EventsResolver {
    var capturedEvents: [String]? = nil
    
    func mockResolve(args: Any?) {
        let eventsData = (args as! String).data(using: .utf8)!
        let events = try! JSONDecoder().decode([String].self, from: eventsData)
        capturedEvents = events.map { event in
            let eventData = event.data(using: .utf8)!
            return String(data: Data(base64Encoded: eventData)!, encoding: .utf8)!
        }
    }
}
