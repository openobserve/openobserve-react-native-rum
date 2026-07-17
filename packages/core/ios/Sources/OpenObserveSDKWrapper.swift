/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import OpenObserveCore
import OpenObserveLogs
import OpenObserveRUM
import OpenObserveTrace
import OpenObserveCrashReporting
import OpenObserveInternal
import Foundation


#if os(iOS)
import OpenObserveWebViewTracking
#endif

public typealias OnSdkInitializedListener = (OpenObserveCoreProtocol) -> Void

/// Wrapper around the OpenObserve SDK. Use OpenObserveSDKWrapper.shared to access the instance.
public class OpenObserveSDKWrapper {
    // Singleton
    public static var shared = OpenObserveSDKWrapper()

    // Initialization callbacks
    internal var onSdkInitializedListeners: [OnSdkInitializedListener] = []

    internal private(set) var loggerConfiguration = OpenObserveLogs.Logger.Configuration()

    private init() { }

    public func addOnSdkInitializedListener(listener: @escaping OnSdkInitializedListener) {
        onSdkInitializedListeners.append(listener)
    }

    // SDK Wrapper
    internal func initialize(
        coreConfiguration: OpenObserve.Configuration,
        loggerConfiguration: OpenObserveLogs.Logger.Configuration,
        trackingConsent: TrackingConsent
    ) -> Void {
        let core = OpenObserve.initialize(with: coreConfiguration, trackingConsent: trackingConsent)

        for listener in onSdkInitializedListeners {
            listener(core)
        }

        self.loggerConfiguration = loggerConfiguration
    }

#if os(iOS)
    // Webview
    private var webviewMessageEmitter: InternalExtension<WebViewTracking>.AbstractMessageEmitter?

    internal func enableWebviewTracking() {
        webviewMessageEmitter = WebViewTracking._internal.messageEmitter(in: CoreRegistry.default)
    }

    internal func sendWebviewMessage(body: NSString) throws {
        try self.webviewMessageEmitter?.send(body: body)
    }
#endif
}
