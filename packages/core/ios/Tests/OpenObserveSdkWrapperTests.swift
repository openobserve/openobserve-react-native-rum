/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019-2020 Datadog, Inc.
 */

import XCTest
@testable import OpenObserveSDKReactNative
import OpenObserveTrace
import OpenObserveInternal
import OpenObserveRUM
import OpenObserveLogs

internal class OpenObserveSdkWrapperTests: XCTestCase {
    override func setUp() {
        super.setUp()
        OpenObserveSDKWrapper.shared.onSdkInitializedListeners = []
    }

    func testOverrideCoreRegistryDefault() {
        let coreMock = MockOpenObserveCore()
        CoreRegistry.register(default: coreMock)
        defer { CoreRegistry.unregisterDefault() }

        Trace.enable(with: .init())
        RUM.enable(with: .init(applicationID: "app-id"))
        Logs.enable(with: .init())

        XCTAssertNotNil(coreMock.features["tracing"])
        XCTAssertNotNil(coreMock.features["rum"])
        XCTAssertNotNil(coreMock.features["logging"])
    }
}
