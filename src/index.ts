import { hckFetch } from './hckFetch.js';

export * from './hckFetch.js';

export * from './hckFetchAwsSdkHttpHandler.js';

/**
 * The default export aims at making this library a drop-in replacement for node-fetch.
 * @see https://github.com/googleapis/teeny-request/blob/4a5c834451a5649f68301385356677d8b3809054/src/index.ts#L30
 */
export default hckFetch;
