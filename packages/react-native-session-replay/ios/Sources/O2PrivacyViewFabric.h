/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

// O2PrivacyViewFabric.h

#if RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <react/renderer/components/O2SDKReactNativeSessionReplay/ComponentDescriptors.h>
#import <react/renderer/components/O2SDKReactNativeSessionReplay/EventEmitters.h>
#import <react/renderer/components/O2SDKReactNativeSessionReplay/Props.h>
#import <react/renderer/components/O2SDKReactNativeSessionReplay/RCTComponentViewHelpers.h>
#import <React/RCTFabricComponentsPlugins.h>


#if __has_include("OpenObserveSDKReactNativeSessionReplay-Swift.h")
#import <OpenObserveSDKReactNativeSessionReplay-Swift.h>
#else
#import <OpenObserveSDKReactNativeSessionReplay/OpenObserveSDKReactNativeSessionReplay-Swift.h>
#endif

@interface O2PrivacyViewFabric : RCTViewComponentView
@property (nonatomic, copy) NSString *nativeID;
@property (nonatomic, copy) NSDictionary<NSString *, NSString *> *attributes;
@end
#endif
