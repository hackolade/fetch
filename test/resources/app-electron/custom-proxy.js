// Optional environment variables for custom proxy settings
const CUSTOM_PROXY_RULES = process.env.CUSTOM_PROXY_RULES;
const CUSTOM_PROXY_PAC_SCRIPT = process.env.CUSTOM_PROXY_PAC_SCRIPT;

function applyCustomProxySettings({ app, session }) {
  if (!CUSTOM_PROXY_RULES && !CUSTOM_PROXY_PAC_SCRIPT) {
    // No custom proxy settings have been defined, relying on integration with OS network settings
    return;
  }

  // See https://www.electronjs.org/docs/latest/api/structures/proxy-config
  const config = {
    proxyRules: CUSTOM_PROXY_RULES,
    pacScript: CUSTOM_PROXY_PAC_SCRIPT,
  };

  // Set proxy settings for main process and renderer processes
  session.defaultSession.setProxy(config);

  // Set proxy settings for utility process
  app.setProxy(config);
}

module.exports = {
  applyCustomProxySettings,
};
