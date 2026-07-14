/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

@class OoSdkImplementation;

#ifdef RCT_NEW_ARCH_ENABLED

#import <OoSdkReactNative/OoSdkReactNative.h>
@interface OoSdk : RCTEventEmitter <NativeDdSdkSpec, RCTBridgeModule, RCTReloadListener>

#else

#import <React/RCTBridgeModule.h>
@interface OoSdk : RCTEventEmitter <RCTBridgeModule, RCTReloadListener>

#endif

@property(nonatomic, strong) OoSdkImplementation * _Nonnull ddSdkImplementation;

+ (void)initFromNative;

@end
