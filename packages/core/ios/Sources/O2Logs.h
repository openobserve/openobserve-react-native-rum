/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class O2LogsImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <O2SdkReactNative/O2SdkReactNative.h>
@interface O2Logs: NSObject <NativeDdLogsSpec>

#else

#import <React/RCTBridgeModule.h>
@interface O2Logs : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) O2LogsImplementation* ddLogsImplementation;

@end
