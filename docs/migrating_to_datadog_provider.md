## Overview

## Change the configuration class

Change your configuration from a `OoSdkReactNativeConfiguration` to a `OpenObserveProviderConfiguration` instance:

```git
- const config = new OoSdkReactNativeConfiguration(
+ const config = new OpenObserveProviderConfiguration(
```

## Add the OpenObserveProvider

Wrap the content of your `App` component by a `OpenObserveProvider` component, passing it your configuration:

```javascript
// App.js

const config = new OpenObserveProviderConfiguration();
//...

export default function App() {
    return (
        <OpenObserveProvider configuration={config}>
            <Navigation />
        </OpenObserveProvider>
    );
}
```

## Remove call to OoSdkReactNative.initialize

Remove the call to `OoSdkReactNative.initialize` in your code.

## Special cases

### Adding a callback after the initialization

If you have a callback running after the initialization, you can pass it as a `onInitialization` prop to your `OpenObserveProvider`:

```javascript
export default function App() {
    return (
        <OpenObserveProvider
            configuration={config}
            onInitialization={() => callback()}
        >
            <Navigation />
        </OpenObserveProvider>
    );
}
```

### Delaying the initialization

See the [documentation on asynchronous initialization][1].

[1]: https://github.com/openobserve/openobserve-react-native-rum/blob/develop/docs/advanced_configuration.md#delaying-the-initialization
