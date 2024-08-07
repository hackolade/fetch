type FetchParameters =
  | Parameters<typeof Electron.net.fetch>
  | Parameters<typeof globalThis.fetch>;

type FetchReturnType<P> = P extends Parameters<typeof Electron.net.fetch>
  ? ReturnType<typeof Electron.net.fetch>
  : ReturnType<typeof globalThis.fetch>;

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
function useElectronNet(
  params: FetchParameters
): params is Parameters<typeof Electron.net.fetch> {
  return isElectronMain() || isElectronUtilityProcess();
}

/**
 * @see https://www.electronjs.org/docs/latest/api/net
 */
async function fetchUsingElectronNet(
  params: Parameters<typeof Electron.net.fetch>
): ReturnType<typeof Electron.net.fetch> {
  const { net } = await import('electron');
  return net.fetch(...params);
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */
async function fetchUsingGlobalContext(
  params: Parameters<typeof globalThis.fetch>
): ReturnType<typeof globalThis.fetch> {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('fetch() is not available on the global context!');
  }
  return globalThis.fetch(...params);
}

export function hckFetch<P extends FetchParameters>(
  ...params: P
): FetchReturnType<P> {
  return useElectronNet(params)
    ? fetchUsingElectronNet(params)
    : fetchUsingGlobalContext(params);
}

globalThis.hckFetch = hckFetch;
