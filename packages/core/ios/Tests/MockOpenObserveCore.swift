/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019-2020 Datadog, Inc.
 */

@testable import OpenObserveCore
@testable import OpenObserveInternal

internal class MockOpenObserveCore: OpenObserveCoreProtocol {
    func send(message: FeatureMessage, else fallback: @escaping () -> Void) {
        if  // Configuration Telemetry Message
            case .telemetry(let telemetry) = message,
            case .configuration(let configuration) = telemetry {
            self.configuration = configuration
        }
        
        if case .webview(let webViewMessage) = message {
            self.baggages["browser-rum-event"] = webViewMessage
        }
    }
   
    @ReadWriteLock
    private(set) var configuration: ConfigurationTelemetry?
    @ReadWriteLock
    private(set) var features: [String: OpenObserveFeature] = [:]
    @ReadWriteLock
    private(set) var baggages: [String: Any] = [:]

    func register<T>(feature: T) throws where T : OpenObserveInternal.OpenObserveFeature {
        features[T.name] = feature
    }
    
    func feature<T>(named name: String, type: T.Type) -> T? {
        return nil
    }
    
    func scope<T>(for featureType: T.Type) -> any OpenObserveInternal.FeatureScope where T : OpenObserveInternal.OpenObserveFeature {
        return NOPFeatureScope()
    }
    
    func set<Context>(context: @escaping () -> Context?) where Context: AdditionalContext {}
    
    func mostRecentModifiedFileAt(before: Date) throws -> Date? {
        return nil
    }
}

