/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class OoRumImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <OoSdkReactNative/OoSdkReactNative.h>
@interface OoRum: NSObject <NativeDdRumSpec>

#else

#import <React/RCTBridgeModule.h>
@interface OoRum : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) OoRumImplementation* ddRumImplementation;

@end
