/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
@class OoLogsImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <OoSdkReactNative/OoSdkReactNative.h>
@interface OoLogs: NSObject <NativeDdLogsSpec>

#else

#import <React/RCTBridgeModule.h>
@interface OoLogs : NSObject <RCTBridgeModule>

#endif

@property (nonatomic, strong) OoLogsImplementation* ddLogsImplementation;

@end
