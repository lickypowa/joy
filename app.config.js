module.exports = ({ config }) => {
  const plugins = ['expo-router'];
  try {
    require.resolve('llama.rn');
    plugins.push(['llama.rn', {
      forceCxx20: true,
      enableEntitlements: true,
      entitlementsProfile: 'production',
      enableOpenCLAndHexagon: false,
    }]);
  } catch {
    // Allows Metro and config inspection in source-only environments. Native builds
    // use the plugin once npm has installed the declared llama.rn dependency.
  }
  return { ...config, plugins };
};
