/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class OoInternalTestingImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <OoInternalTesting/OoInternalTesting.h>
@interface OoInternalTesting: NSObject <NativeDdInternalTestingSpec>

#else

#import <React/RCTBridgeModule.h>
@interface OoInternalTesting : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) OoInternalTestingImplementation* ddInternalTestingImplementation;

+ (void)enableFromNative;

@end
