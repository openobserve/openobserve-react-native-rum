/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class O2InternalTestingImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <O2InternalTesting/O2InternalTesting.h>
@interface O2InternalTesting: NSObject <NativeDdInternalTestingSpec>

#else

#import <React/RCTBridgeModule.h>
@interface O2InternalTesting : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) O2InternalTestingImplementation* ddInternalTestingImplementation;

+ (void)enableFromNative;

@end
