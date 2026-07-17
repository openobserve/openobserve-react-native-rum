/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019-2020 Datadog, Inc.
 */

import XCTest
@testable import OpenObserveSDKReactNativeWebView
@testable import OpenObserveSDKReactNative
@testable import OpenObserveWebViewTracking
import OpenObserveInternal
import React
import OpenObserveLogs
import OpenObserveCore

internal class OpenObserveSDKReactNativeWebViewTests: XCTestCase {
    override func setUp() {
        super.setUp()
        let mockOpenObserveCore = MockOpenObserveCore()
        CoreRegistry.register(default: mockOpenObserveCore)
    }

    override func tearDown() {
        CoreRegistry.unregisterDefault()
    }
    
    func testOpenObserveWebViewManagerReturnsOpenObserveWebView() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        // When
        let view = viewManager.view()
        // Then
        XCTAssertTrue(view is RCTOpenObserveWebView, "ViewManager returned view is of type RCTOpenObserveWebView")
    }
    
    func testOpenObserveWebViewTrackingIsDisabledOnInit() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        // When
        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail()
            return
        }
        // Then
        XCTAssertFalse(view.isTrackingEnabled)
    }
    
    func testOpenObserveWebViewTrackingIsDisabledIfSdkIsNotInitialized() {
        // Given
        CoreRegistry.unregisterDefault()

        let viewManager = RCTOpenObserveWebViewManager()
        let allowedHosts = NSArray(objects: "example1.com", "example2.com")

        // When
        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail()
            return
        }
        // Given
        let selector = NSSelectorFromString("setupOpenObserveWebView:view:")
        XCTAssertTrue(viewManager.responds(to: selector))

        // When
        viewManager.perform(selector, with: allowedHosts, with: view)

        // Then
        XCTAssertEqual(allowedHosts.count, 2)
        XCTAssertTrue(allowedHosts.contains("example1.com"))
        XCTAssertTrue(allowedHosts.contains("example2.com"))


        // Then
        XCTAssertFalse(view.isTrackingEnabled)
    }
    
    func testOpenObserveWebViewTrackingIsEnabledLateWhenCoreIsNotReady() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        let allowedHosts = NSArray(objects: "example1.com", "example2.com")

        // When
        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail()
            return
        }

        view.addSubview(WKWebView())

        CoreRegistry.unregisterDefault()

        // Given
        let selector = NSSelectorFromString("setupOpenObserveWebView:view:")
        XCTAssertTrue(viewManager.responds(to: selector))
        viewManager.perform(selector, with: allowedHosts, with: view)

        XCTAssertFalse(view.isTrackingEnabled)

        // When
        OpenObserveSDKWrapper.shared.callInitialize()

        let expectation = self.expectation(description: "WebView tracking is enabled through the listener.")
        DispatchQueue.main.async {
            expectation.fulfill()
        }

        // Then
        wait(for: [expectation], timeout: 6)
        XCTAssertTrue(view.isTrackingEnabled)
    }
    
    func testOpenObserveWebViewTrackingIsEnabledWhenCoreIsReady() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        let allowedHosts = NSArray(objects: "example1.com", "example2.com")

        // When
        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail()
            return
        }

        view.addSubview(WKWebView())

        XCTAssertFalse(view.isTrackingEnabled)

        // Given
        let selector = NSSelectorFromString("setupOpenObserveWebView:view:")
        XCTAssertTrue(viewManager.responds(to: selector))
        viewManager.perform(selector, with: allowedHosts, with: view)

        let expectation = self.expectation(description: "WebView tracking is enabled in the main thread")
        DispatchQueue.main.async {
            expectation.fulfill()
        }

        // Then
        wait(for: [expectation], timeout: 6)
        // When
        XCTAssertTrue(view.isTrackingEnabled)
    }

    func testOpenObserveWebViewJavascriptEnabled() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        // When
        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail()
            return
        }
        // Then
        XCTAssertTrue(view.javaScriptEnabled)
    }
    
    func testOpenObserveWebViewAllowedHostsAreEmptyOnInit() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        // Then
        guard let allowedHosts = viewManager.value(forKey: "allowedHosts") as? NSMutableSet else {
            XCTFail("OpenObserveWebViewManager must have 'allowedHosts' property.")
            return
        }
        XCTAssertEqual(allowedHosts.count, 0)
    }
    
    func testOpenObserveWebViewDelegatesAreSetOnInit() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()
        // When
        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail()
            return
        }
        // Then
        XCTAssert(view.ddWebViewDelegate.isEqual(viewManager))
        XCTAssertNotNil(view.delegate)
        XCTAssert(view.delegate!.isEqual(viewManager))
    }
 
    func testOpenObserveWebViewAllowedHostsAreSet() {
        // Given
        let allowedHosts = NSArray(objects: "example1.com", "example2.com")
        let viewManager = RCTOpenObserveWebViewManager()

        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail("ViewManager view is not of type RCTOpenObserveWebView")
            return
        }

        let selector = NSSelectorFromString("setupOpenObserveWebView:view:")
        XCTAssertTrue(viewManager.responds(to: selector))

        // When
        viewManager.perform(selector, with: allowedHosts, with: view)

        // Then
        XCTAssertEqual(allowedHosts.count, 2)
        XCTAssertTrue(allowedHosts.contains("example1.com"))
        XCTAssertTrue(allowedHosts.contains("example2.com"))
    }
    
    func testOpenObserveWebViewDelegateIsCalledWhenViewMovedToWindow() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()

        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail("ViewManager view is not of type RCTOpenObserveWebView")
            return
        }

        let delegate = MockOpenObserveWebViewDelegate()
        view.ddWebViewDelegate = delegate

        XCTAssertFalse(delegate.wasCalled)

        // When
        view.didMoveToWindow()

        // Then
        XCTAssertTrue(delegate.wasCalled)
    }
    
    func testOpenObserveWebViewCanFindNestedWKWebView() {
        // Given
        let viewManager = RCTOpenObserveWebViewManager()

        guard let view = viewManager.view() as? RCTOpenObserveWebView else {
            XCTFail("ViewManager view is not of type RCTOpenObserveWebView")
            return
        }

        let container = UIView()
        container.addSubview(WKWebView())
        view.addSubview(container)

        // When
        let selector = NSSelectorFromString("findWKWebViewInView:")
        XCTAssertTrue(view.responds(to: selector))
        let wkWebView = view.perform(selector, with: view)

        // Then
        XCTAssertNotNil(wkWebView)
        XCTAssertTrue(wkWebView?.takeUnretainedValue() is WKWebView)
    }
}

extension OpenObserveSDKWrapper {
    func callInitialize() {
        self.initialize(
            coreConfiguration: OpenObserve.Configuration(clientToken: "mock-client-token", env: "mock-env"),
            loggerConfiguration: OpenObserveLogs.Logger.Configuration(),
            trackingConsent: TrackingConsent.granted)
    }
}

private class MockOpenObserveWebViewDelegate: NSObject, RCTOpenObserveWebViewDelegate {
    var wasCalled = false
    func didCreateWebView(_ webView: RCTOpenObserveWebView!) {
        self.wasCalled = true
    }
}

private class MockOpenObserveCore: OpenObserveCoreProtocol {
    func mostRecentModifiedFileAt(before: Date) throws -> Date? {
        return nil
    }
    
    func scope<T>(for featureType: T.Type) -> any OpenObserveInternal.FeatureScope where T : OpenObserveInternal.OpenObserveFeature {
        return NOPFeatureScope()
    }
    
    func feature<T>(named name: String, type: T.Type) -> T? {
        return nil
    }

    func register<T>(feature: T) throws where T : OpenObserveInternal.OpenObserveFeature {}
    func send(message: OpenObserveInternal.FeatureMessage, else fallback: @escaping () -> Void) {}
    func set<Context>(context: @escaping () -> Context?) where Context : OpenObserveInternal.AdditionalContext {}
}
