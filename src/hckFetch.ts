type FetchParameters = Parameters<typeof globalThis.fetch>;

type FetchReturnType = ReturnType<typeof globalThis.fetch>;

/**
 * @see https://www.electronjs.org/docs/latest/api/process#processtype-readonly
 */
function isElectronMain(): boolean {
  return globalThis.process?.type === 'browser';
}

/**
 * @see https://www.electronjs.org/docs/latest/api/process#processtype-readonly
 */
function isElectronUtilityProcess(): boolean {
  return globalThis.process?.type === 'utility';
}

/**
 * @see https://www.electronjs.org/docs/latest/api/net
 */
function useElectronNet(): boolean {
  return isElectronMain() || isElectronUtilityProcess();
}

/**
 * @see https://www.electronjs.org/docs/latest/api/net
 */
async function fetchUsingElectronNet(params: FetchParameters): FetchReturnType {
  const { net } = await import('electron');
  return net.fetch(...(params as Parameters<typeof Electron.net.fetch>));
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */
async function fetchUsingGlobalContext(params: FetchParameters): FetchReturnType {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('fetch() is not available in the global context!');
  }
  return globalThis.fetch(...params);
}

export function hckFetch(...params: FetchParameters): FetchReturnType {
  return useElectronNet() ? fetchUsingElectronNet(params) : fetchUsingGlobalContext(params);
}
