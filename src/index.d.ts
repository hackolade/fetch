import { FetchHttpHandler, FetchHttpHandlerOptions } from '@smithy/fetch-http-handler';

export type FetchParameters = Parameters<typeof globalThis.fetch>;

export type FetchReturnType = ReturnType<typeof globalThis.fetch>;

export function hckFetch(...params: FetchParameters): FetchReturnType;

export function hckFetchAwsSdkHttpHandler(options?: FetchHttpHandlerOptions): FetchHttpHandler;

export default hckFetch;
