/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019-Present Datadog, Inc.
 */

import XCTest
@testable import OpenObserveSDKReactNative
@testable import React

class OoSdkSessionStartedListenerTests: XCTestCase {
    var consoleMessage = ""

    override func setUp() {
        super.setUp()
        OoSdkSessionStartedListener.invalidate()
        OoSdkSessionStartedListener.resetIsRnSdkInitializedForTests()
    }

    override func tearDown() {
        OoSdkSessionStartedListener.invalidate()
        OoSdkSessionStartedListener.resetIsRnSdkInitializedForTests()
        super.tearDown()
    }

    func testInstanceImplementsSingletonCorrectly() {
        // GIVEN
        let instance1 = OoSdkSessionStartedListener.instance

        // WHEN
        let instance2 = OoSdkSessionStartedListener.instance

        // THEN
        XCTAssertEqual(instance1, instance2)
    }

    func testInvalidateMakesListenerNil() {
        // GIVEN
        let instance = OoSdkSessionStartedListener.instance
        let listener: ((String) -> Void) = {_ in }
        instance.setListenerCallback(listener)

        // WHEN
        instance.invalidate()

        // THEN
        XCTAssertNil(instance.listener)
    }

    func testRumSessionListenerIsRegisteredOnInit() {
        // GIVEN
        let instance = OoSdkSessionStartedListener.instance

        // WHEN
        let rumSessionListener = instance.rumSessionListener

        // THEN
        XCTAssertNotNil(rumSessionListener)
    }

    func testIsRnSdkInitializedDefaultsToFalse() {
        // THEN
        XCTAssertFalse(OoSdkSessionStartedListener.isRnSdkInitializedForTests())
    }

    func testOnRnSdkInitializedFlipsFlag() {
        // GIVEN
        let instance = OoSdkSessionStartedListener.instance
        XCTAssertFalse(OoSdkSessionStartedListener.isRnSdkInitializedForTests())

        // WHEN
        instance.onRnSdkInitialized()

        // THEN
        XCTAssertTrue(OoSdkSessionStartedListener.isRnSdkInitializedForTests())
    }

    func testInvalidateDoesNotResetIsRnSdkInitialized() {
        // GIVEN
        let instance = OoSdkSessionStartedListener.instance
        instance.onRnSdkInitialized()
        XCTAssertTrue(OoSdkSessionStartedListener.isRnSdkInitializedForTests())

        // WHEN
        OoSdkSessionStartedListener.invalidate()

        // THEN
        XCTAssertTrue(OoSdkSessionStartedListener.isRnSdkInitializedForTests())
    }

    func testBridgelessListenerPathIsUnaffectedByIsRnSdkInitialized() {
        // GIVEN — bridgeless mode (rctBridge == nil), flag still false
        let instance = OoSdkSessionStartedListener.instance
        var deliveredSessionIds: [String] = []
        instance.setListenerCallback { sessionId in
            deliveredSessionIds.append(sessionId)
        }
        instance.setHasListeners(true)

        // WHEN — native session starts before any JS init
        instance.rumSessionListener?("TEST-SESSION-ID", false)

        // THEN — bridgeless path delivers regardless of the flag
        XCTAssertEqual(deliveredSessionIds, ["TEST-SESSION-ID"])
    }

    func testResetIsRnSdkInitializedForTestsResetsFlag() {
        // GIVEN
        OoSdkSessionStartedListener.instance.onRnSdkInitialized()
        XCTAssertTrue(OoSdkSessionStartedListener.isRnSdkInitializedForTests())

        // WHEN
        OoSdkSessionStartedListener.resetIsRnSdkInitializedForTests()

        // THEN
        XCTAssertFalse(OoSdkSessionStartedListener.isRnSdkInitializedForTests())
    }
}
