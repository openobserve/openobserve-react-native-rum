/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class O2TraceImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <O2SdkReactNative/O2SdkReactNative.h>
@interface O2Trace: NSObject <NativeDdTraceSpec>

#else

#import <React/RCTBridgeModule.h>
@interface O2Trace : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) O2TraceImplementation* ddTraceImplementation;

@end
