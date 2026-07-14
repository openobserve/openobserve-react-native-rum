/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import XCTest
@testable import DatadogSDKReactNative
@testable import React

class ModulesTest: XCTestCase {

    func testAllModulesUseSameQueue() {
        XCTAssertTrue(sharedQueue === OoSdk().methodQueue)
        XCTAssertTrue(sharedQueue === OoRum().methodQueue)
        XCTAssertTrue(sharedQueue === OoLogs().methodQueue)
        XCTAssertTrue(sharedQueue === OoTrace().methodQueue)
    }

    func testAllModulesExposeMethodQueueProperly() {
        // RN does the check by calling BOOL implementsMethodQueue = [_instance respondsToSelector:@selector(methodQueue)];
        // So if methodQueue is static, check above returns false
        // This test makes sure that 'methodQueue' is implemented as instance member
        // Given
        let methodQueueSelector = #selector(getter: RCTModuleData.methodQueue)

        // Then
        XCTAssertTrue(OoSdk().responds(to: methodQueueSelector))
        XCTAssertTrue(OoRum().responds(to: methodQueueSelector))
        XCTAssertTrue(OoLogs().responds(to: methodQueueSelector))
        XCTAssertTrue(OoTrace().responds(to: methodQueueSelector))
    }
}
