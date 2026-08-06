/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import XCTest
@testable import OpenObserveSDKReactNative
@testable import React

class ModulesTest: XCTestCase {

    func testAllModulesUseSameQueue() {
        XCTAssertTrue(sharedQueue === O2Sdk().methodQueue)
        XCTAssertTrue(sharedQueue === O2Rum().methodQueue)
        XCTAssertTrue(sharedQueue === O2Logs().methodQueue)
        XCTAssertTrue(sharedQueue === O2Trace().methodQueue)
    }

    func testAllModulesExposeMethodQueueProperly() {
        // RN does the check by calling BOOL implementsMethodQueue = [_instance respondsToSelector:@selector(methodQueue)];
        // So if methodQueue is static, check above returns false
        // This test makes sure that 'methodQueue' is implemented as instance member
        // Given
        let methodQueueSelector = #selector(getter: RCTModuleData.methodQueue)

        // Then
        XCTAssertTrue(O2Sdk().responds(to: methodQueueSelector))
        XCTAssertTrue(O2Rum().responds(to: methodQueueSelector))
        XCTAssertTrue(O2Logs().responds(to: methodQueueSelector))
        XCTAssertTrue(O2Trace().responds(to: methodQueueSelector))
    }
}
