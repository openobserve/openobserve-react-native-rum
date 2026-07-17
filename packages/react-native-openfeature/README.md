# OpenObserve OpenFeature Provider for React Native

Use [OpenFeature][1] with [OpenObserve Feature Flags][2] to evaluate feature flags and send evaluation data to OpenObserve for analysis and experimentation.

OpenFeature is a vendor-neutral, community-driven specification and SDK for feature flagging. It provides a unified API for feature flag evaluation that works across different providers. This enables you to switch vendors or integrate multiple feature flag systems.

This package provides an OpenFeature-compatible provider that wraps OpenObserve's Feature Flags SDK.

## Setup

**Note**: This package is an integration for the [OpenFeature React SDK][1]. Install and set up the core [`@openobserve/mobile-react-native`][3] SDK to start using OpenObserve Feature Flags.

To install with NPM, run:

```sh
npm install @openobserve/mobile-react-native @openobserve/mobile-react-native-openfeature @openfeature/react-sdk
```

To install with Yarn, run:

```sh
yarn add @openobserve/mobile-react-native @openobserve/mobile-react-native-openfeature @openfeature/react-sdk
```

## Usage

### Initialize the OpenObserve SDK and OpenFeature

Use the following example code snippet to initialize the OpenObserve SDK, enable the Feature Flags feature, and set up the OpenFeature provider.

```tsx
import { CoreConfiguration, OpenObserveProvider, OoFlags } from '@openobserve/mobile-react-native';
import { OpenObserveOpenFeatureProvider } from '@openobserve/mobile-react-native-openfeature';
import { OpenFeature } from '@openfeature/react-sdk';

(async () => {
    // Follow the core OpenObserve SDK initialization guide.
    const config = new CoreConfiguration(
        // ...
    );
    await OoSdkReactNative.initialize(config);

    // Enable OpenObserve Flags feature after the core SDK has been initialized.
    await OoFlags.enable();

    // Set the OpenObserve provider with OpenFeature.
    const provider = new OpenObserveOpenFeatureProvider();
    OpenFeature.setProvider(provider);
})();

// Alternatively, if using `<OpenObserveProvider />` for core SDK initialization.

<OpenObserveProvider
    configuration={coreConfiguration}
    onInitialized={async () => {
        await OoFlags.enable();

        const provider = new OpenObserveOpenFeatureProvider();
        OpenFeature.setProvider(provider);
    }}
>
    {/* ... */}
</OpenObserveProvider>
```

After completing this setup, your app is ready for flag evaluation with OpenFeature.

> **Note**: Sending flag evaluation data to OpenObserve is automatically enabled when using the Feature Flags SDK. Provide `rumIntegrationEnabled` and `trackExposures` parameters to the `OoFlags.enable()` call to configure.

### Using the OpenFeature React SDK

For complete details on using the OpenFeature React SDK, including flag evaluation, evaluation context management, and advanced setup options, see the OpenFeature React SDK [documentation][1].

Short-form OpenFeature SDK usage example:

```tsx
import { OpenFeature, OpenFeatureProvider, useFlag } from '@openfeature/react-sdk';

function AppWithProviders() {
    // For advanced feature flag targeting based on current user or device.
    useEffect(() => {
        const user = { ... }; // Obtained from your authentication logic.

        OpenFeature.setContext({
            // User or anonymous ID for consistent feature flag evaluations.
            targetingKey: user.id,
            // Properties for more granular targeting.
            region: user.country
        });
    }, [])

    // Wrap your app with OpenFeatureProvider to allow flag evaluations throughout the app.
    return (
        <OpenFeatureProvider>
            <App />
        </OpenFeatureProvider>
    );
}

function App() {
    const { value: isNewFeatureEnabled } = useFlag('new-feature-enabled', false);

    return (
        <View>
            {isNewFeatureEnabled && <NewFeatureComponent />}

            {/* ... */}
        </View>
    )
}

export default AppWithProviders;
```

[1]: https://openfeature.dev/docs/reference/sdks/client/web/react/
[2]: https://docs.datadoghq.com/getting_started/feature_flags/
[3]: https://github.com/openobserve/openobserve-react-native-rum/tree/develop/packages/core
