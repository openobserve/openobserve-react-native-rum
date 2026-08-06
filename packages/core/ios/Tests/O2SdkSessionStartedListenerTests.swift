/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019-Present Datadog, Inc.
 */

import XCTest
@testable import OpenObserveSDKReactNative
@testable import React

class O2SdkSessionStartedListenerTests: XCTestCase {
    var consoleMessage = ""

    override func setUp() {
        super.setUp()
        O2SdkSessionStartedListener.invalidate()
        O2SdkSessionStartedListener.resetIsRnSdkInitializedForTests()
    }

    override func tearDown() {
        O2SdkSessionStartedListener.invalidate()
        O2SdkSessionStartedListener.resetIsRnSdkInitializedForTests()
        super.tearDown()
    }

    func testInstanceImplementsSingletonCorrectly() {
        // GIVEN
        let instance1 = O2SdkSessionStartedListener.instance

        // WHEN
        let instance2 = O2SdkSessionStartedListener.instance

        // THEN
        XCTAssertEqual(instance1, instance2)
    }

    func testInvalidateMakesListenerNil() {
        // GIVEN
        let instance = O2SdkSessionStartedListener.instance
        let listener: ((String) -> Void) = {_ in }
        instance.setListenerCallback(listener)

        // WHEN
        instance.invalidate()

        // THEN
        XCTAssertNil(instance.listener)
    }

    func testRumSessionListenerIsRegisteredOnInit() {
        // GIVEN
        let instance = O2SdkSessionStartedListener.instance

        // WHEN
        let rumSessionListener = instance.rumSessionListener

        // THEN
        XCTAssertNotNil(rumSessionListener)
    }

    func testIsRnSdkInitializedDefaultsToFalse() {
        // THEN
        XCTAssertFalse(O2SdkSessionStartedListener.isRnSdkInitializedForTests())
    }

    func testOnRnSdkInitializedFlipsFlag() {
        // GIVEN
        let instance = O2SdkSessionStartedListener.instance
        XCTAssertFalse(O2SdkSessionStartedListener.isRnSdkInitializedForTests())

        // WHEN
        instance.onRnSdkInitialized()

        // THEN
        XCTAssertTrue(O2SdkSessionStartedListener.isRnSdkInitializedForTests())
    }

    func testInvalidateDoesNotResetIsRnSdkInitialized() {
        // GIVEN
        let instance = O2SdkSessionStartedListener.instance
        instance.onRnSdkInitialized()
        XCTAssertTrue(O2SdkSessionStartedListener.isRnSdkInitializedForTests())

        // WHEN
        O2SdkSessionStartedListener.invalidate()

        // THEN
        XCTAssertTrue(O2SdkSessionStartedListener.isRnSdkInitializedForTests())
    }

    func testBridgelessListenerPathIsUnaffectedByIsRnSdkInitialized() {
        // GIVEN — bridgeless mode (rctBridge == nil), flag still false
        let instance = O2SdkSessionStartedListener.instance
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
        O2SdkSessionStartedListener.instance.onRnSdkInitialized()
        XCTAssertTrue(O2SdkSessionStartedListener.isRnSdkInitializedForTests())

        // WHEN
        O2SdkSessionStartedListener.resetIsRnSdkInitializedForTests()

        // THEN
        XCTAssertFalse(O2SdkSessionStartedListener.isRnSdkInitializedForTests())
    }
}
