/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class O2FlagsImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <O2SdkReactNative/O2SdkReactNative.h>
@interface O2Flags: NSObject <NativeDdFlagsSpec>

#else

#import <React/RCTBridgeModule.h>
@interface O2Flags : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) O2FlagsImplementation* ddFlagsImplementation;

@end
