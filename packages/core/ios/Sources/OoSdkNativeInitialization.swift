/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import OpenObserveCore
import OpenObserveCrashReporting
import OpenObserveInternal
import OpenObserveLogs
import OpenObserveRUM
import OpenObserveTrace
import Foundation
import React

#if os(iOS)
    import OpenObserveWebViewTracking
#endif

@objc
public class OoSdkNativeInitialization: NSObject {
    let jsonFileReader: ResourceFileReader

    @objc
    public convenience override init() {
        self.init(jsonFileReader: JSONFileReader())
    }

    init(
        jsonFileReader: ResourceFileReader
    ) {
        self.jsonFileReader = jsonFileReader
    }

    internal func initialize(sdkConfiguration: OoSdkConfiguration, isCalledFromJs: Bool = true) {
        if OpenObserve.isInitialized(instanceName: CoreRegistry.defaultInstanceName) {
            // Initializing the SDK twice results in Global.rum and Global.sharedTracer to be set to no-op instances
            consolePrint("OpenObserve SDK is already initialized, skipping initialization.", .debug)
            OoTelemetry.telemetryDebug(
                id: "datadog_react_native: RN  SDK was already initialized in native",
                message: "RN SDK was already initialized in native"
            )
        } else {
            self.setVerbosityLevel(configuration: sdkConfiguration)

            let coreConfiguration = self.buildSDKConfiguration(configuration: sdkConfiguration)
            OpenObserveSDKWrapper.shared.initialize(
                coreConfiguration: coreConfiguration,
                loggerConfiguration: OpenObserveLogs.Logger.Configuration(sdkConfiguration),
                trackingConsent: sdkConfiguration.trackingConsent
            )

            self.enableFeatures(sdkConfiguration: sdkConfiguration)
        }

        if isCalledFromJs {
            OoSdkSessionStartedListener.instance.onRnSdkInitialized()
            // Handles the case in which the SDK was already initialized via initFromNative.
            // Replay the current session ID so the listener can deliver it now that the
            // JS-side OpenObserveInternalReactBridge module is guaranteed to be registered.
            if OpenObserve.isInitialized(instanceName: CoreRegistry.defaultInstanceName) {
                RUMMonitor.shared().currentSessionID { sessionId in
                    guard let id = sessionId else { return }
                    OoSdkSessionStartedListener.instance.rumSessionListener?(id, false)
                }
            }
        }
    }

    internal func getConfigurationFromJSONFile() -> OoSdkConfiguration? {
        if let jsonResult = jsonFileReader.parseResourceFile(resourcePath: "openobserve-configuration")
            as? [String: AnyObject]
        {
            do {
                return try jsonResult.asDdSdkConfigurationFromJSON()
            } catch {
                consolePrint("Error parsing openobserve-configuration.json file: \(error)", .critical)
            }
        } else {
            consolePrint(
                "openobserve-configuration.json file cannot be parsed. Make sure it is valid.",
                .critical)
        }
        return nil
    }

    @objc
    public func initializeFromNative() {
        if let configuration = getConfigurationFromJSONFile() {
            self.initialize(sdkConfiguration: configuration, isCalledFromJs: false)
        }
    }

    func enableFeatures(sdkConfiguration: OoSdkConfiguration) {
        
        if (sdkConfiguration.rumConfiguration != nil) {
            let rumConfig = buildRumConfiguration(configuration: sdkConfiguration)
            RUM.enable(with: rumConfig)
            
            if sdkConfiguration.rumConfiguration?.nativeCrashReportEnabled ?? false {
                CrashReporting.enable()
            }
        }

        if (sdkConfiguration.logsConfiguration != nil) {
            let logsConfig = buildLogsConfiguration(configuration: sdkConfiguration)
            Logs.enable(with: logsConfig)
        }

        if (sdkConfiguration.traceConfiguration != nil) {
            let traceConfig = buildTraceConfiguration(configuration: sdkConfiguration)
            Trace.enable(with: traceConfig)
        }

        #if os(iOS)
            OpenObserveSDKWrapper.shared.enableWebviewTracking()
        #endif
    }

    func buildSDKConfiguration(
        configuration: OoSdkConfiguration,
        defaultAppVersion: String = getDefaultAppVersion()
    ) -> OpenObserve.Configuration {
        var config = OpenObserve.Configuration(
            clientToken: configuration.clientToken,
            env: configuration.env,
            site: configuration.site,
            service: configuration.service as? String,
            batchSize: configuration.batchSize,
            uploadFrequency: configuration.uploadFrequency,
            proxyConfiguration: configuration.proxyConfiguration,
            batchProcessingLevel: configuration.batchProcessingLevel
        )

        if var additionalConfiguration = configuration.additionalConfiguration as? [String: Any] {
            if let versionSuffix = additionalConfiguration[
                InternalConfigurationAttributes.versionSuffix] as? String
            {
                let datadogVersion = defaultAppVersion + versionSuffix
                additionalConfiguration[CrossPlatformAttributes.version] = datadogVersion
            }

            config._internal_mutation {
                $0.additionalConfiguration = additionalConfiguration
            }
        }

        return config
    }

    func buildRumConfiguration(configuration: OoSdkConfiguration) -> RUM.Configuration {
        guard let rumConfig = configuration.rumConfiguration else {
            preconditionFailure("buildRumConfiguration called without rumConfiguration")
        }

        var longTaskThreshold: TimeInterval? = nil
        if let threshold = configuration.rumConfiguration?.nativeLongTaskThresholdMs, threshold != 0 {
            longTaskThreshold = threshold / 1_000
        }

        var uiKitViewsPredicate: UIKitRUMViewsPredicate? = nil
        if rumConfig.nativeViewTracking ?? false {
            uiKitViewsPredicate = DefaultUIKitRUMViewsPredicate()
        }

        var uiKitActionsPredicate: UIKitRUMActionsPredicate? = nil
        if rumConfig.nativeInteractionTracking ?? false {
            uiKitActionsPredicate = DefaultUIKitRUMActionsPredicate()
        }

        var urlSessionTracking: RUM.Configuration.URLSessionTracking? = nil
        if let firstPartyHosts = rumConfig.firstPartyHosts {
            urlSessionTracking = RUM.Configuration.URLSessionTracking(
                firstPartyHostsTracing: .traceWithHeaders(
                    hostsWithHeaders: firstPartyHosts,
                    sampleRate: Float(
                        configuration.rumConfiguration?.resourceTraceSampleRate
                            ?? DefaultConfiguration.resourceTraceSampleRate)
                ),
                resourceAttributesProvider: { request, _, _, _ in
                    let trackedBy = request.value(forHTTPHeaderField: InternalConfigurationAttributes.trackedByHeaderKey)
                    if trackedBy == InternalConfigurationAttributes.trackedByHeaderValue {
                        return [InternalConfigurationAttributes.dropResource: true]
                    }
                    return nil
                }
            )
        }

        var customRUMEndpointURL: URL? = nil
        if let customEndpoint = rumConfig.customEndpoint, !customEndpoint.isEmpty {
            // OpenObserve intake path: {base}/rum -> POST {org endpoint}/rum/v1/{org}/rum.
            // (Upstream OpenObserve used "/api/v2/rum"; OpenObserve's RUM intake is "/rum".)
            customRUMEndpointURL = URL(string: "\(customEndpoint)/rum")
        }

        var networkSettledResourcePredicate: TimeBasedTNSResourcePredicate? = nil
        if let initialThreshold = rumConfig.initialResourceThreshold {
            networkSettledResourcePredicate = TimeBasedTNSResourcePredicate(
                threshold: initialThreshold)
        }

        return RUM.Configuration(
            applicationID: rumConfig.applicationId,
            sessionSampleRate: Float(
                rumConfig.sessionSampleRate ?? DefaultConfiguration.sessionSamplingRate),
            uiKitViewsPredicate: uiKitViewsPredicate,
            uiKitActionsPredicate: uiKitActionsPredicate,
            urlSessionTracking: urlSessionTracking,
            trackFrustrations: rumConfig.trackFrustrations
                ?? DefaultConfiguration.trackFrustrations,
            trackBackgroundEvents: rumConfig.trackBackgroundEvents
                ?? DefaultConfiguration.trackBackgroundEvents,
            longTaskThreshold: longTaskThreshold,
            appHangThreshold: rumConfig.appHangThreshold,
            trackWatchdogTerminations: rumConfig.trackWatchdogTerminations,
            vitalsUpdateFrequency: rumConfig.vitalsUpdateFrequency,
            networkSettledResourcePredicate: networkSettledResourcePredicate
                ?? TimeBasedTNSResourcePredicate(),
            resourceEventMapper: { resourceEvent in
                if resourceEvent.context?.contextInfo[InternalConfigurationAttributes.dropResource]
                    != nil
                {
                    return nil
                }
                return resourceEvent
            },
            actionEventMapper: { actionEvent in
                if actionEvent.context?.contextInfo[InternalConfigurationAttributes.dropResource]
                    != nil
                {
                    return nil
                }
                return actionEvent
            },
            onSessionStart: OoSdkSessionStartedListener.instance.rumSessionListener,
            customEndpoint: customRUMEndpointURL,
            trackMemoryWarnings: rumConfig.trackMemoryWarnings
                ?? DefaultConfiguration.trackMemoryWarnings,
            telemetrySampleRate: Float(
                rumConfig.telemetrySampleRate ?? DefaultConfiguration.telemetrySampleRate)
        )
    }

    func buildLogsConfiguration(configuration: OoSdkConfiguration) -> Logs.Configuration {
        guard let logsConfig = configuration.logsConfiguration else {
            preconditionFailure("buildLogsConfiguration called without logsConfiguration")
        }
        
        var customLogsEndpointURL: URL? = nil
        if let customLogsEndpoint = logsConfig.customEndpoint as? NSString {
            if customLogsEndpoint != "" {
                // OpenObserve intake path: {base}/logs (upstream OpenObserve used "/api/v2/logs").
                customLogsEndpointURL = URL(string: "\(customLogsEndpoint)/logs" as String)
            }
        }

        return Logs.Configuration(customEndpoint: customLogsEndpointURL)
    }

    func buildTraceConfiguration(configuration: OoSdkConfiguration) -> Trace.Configuration {
        guard let traceConfig = configuration.traceConfiguration else {
            preconditionFailure("buildTraceConfiguration called without traceConfiguration")
        }
        
        var customTraceEndpointURL: URL? = nil
        if let customTraceEndpoint = traceConfig.customEndpoint as? NSString {
            if customTraceEndpoint != "" {
                customTraceEndpointURL = URL(
                    string: "\(customTraceEndpoint)/api/v2/spans" as String)
            }
        }

        return Trace.Configuration(customEndpoint: customTraceEndpointURL)
    }

    func setVerbosityLevel(configuration: OoSdkConfiguration) {
        switch configuration.verbosity?.lowercased {
        case "debug":
            OpenObserve.verbosityLevel = .debug
        case "info":
            // .info is mapped to .debug
            OpenObserve.verbosityLevel = .debug
        case "warn":
            OpenObserve.verbosityLevel = .warn
        case "error":
            OpenObserve.verbosityLevel = .error
        default:
            OpenObserve.verbosityLevel = nil
        }
    }
}
