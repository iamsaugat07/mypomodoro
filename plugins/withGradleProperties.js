const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo config plugin to add android.enableProguardInReleaseBuilds property.
 *
 * This is needed because:
 * - expo-build-properties writes: android.enableMinifyInReleaseBuilds
 * - React Native 0.79.x template expects: android.enableProguardInReleaseBuilds
 *
 * This plugin ensures both properties are set for compatibility.
 */
module.exports = function withCustomGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    // Add the property that RN template expects
    config.modResults.push({
      type: 'property',
      key: 'android.enableProguardInReleaseBuilds',
      value: 'true',
    });

    return config;
  });
};
