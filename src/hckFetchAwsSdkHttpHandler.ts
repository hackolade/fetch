import { FetchHttpHandler, FetchHttpHandlerOptions, keepAliveSupport } from '@smithy/fetch-http-handler';
import { HttpRequest, HttpResponse } from '@smithy/protocol-http';
import { buildQueryString } from '@smithy/querystring-builder';
import { HeaderBag, HttpHandlerOptions } from '@smithy/types';

import { hckFetch } from './hckFetch';

/**
 * The aws-sdk v3+ has a modular architecture that makes it possible to configure a request handler, aka the object
 * that's ultimately responsible for sending the HTTP requests. This module exports a factory function that creates a
 * request handler that uses the Electron-aware hckFetch() instead of fetch().
 */
export function hckFetchAwsSdkHttpHandler(options?: FetchHttpHandlerOptions): FetchHttpHandler {
  return new HckFetchAwsSdkHttpHandler(options);
}

/**
 * This is a variation of the standard FetchHttpHandler. It uses hckFetch() instead of fetch().
 * @see https://github.com/smithy-lang/smithy-typescript/blob/main/packages/fetch-http-handler/src/fetch-http-handler.ts
 */
class HckFetchAwsSdkHttpHandler extends FetchHttpHandler {
  private readonly options: FetchHttpHandlerOptions;

  constructor(options: FetchHttpHandlerOptions = {}) {
    super(options);
    this.options = options;
  }

  async handle(request: HttpRequest, { abortSignal }: HttpHandlerOptions = {}): Promise<{ response: HttpResponse }> {
    const requestTimeoutInMs = this.options.requestTimeout;
    const keepAlive = this.options.keepAlive === true;
    const credentials = this.options.credentials as RequestInit['credentials'];

    // if the request was already aborted, prevent doing extra work
    if (abortSignal?.aborted) {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    }

    let path = request.path;
    const queryString = buildQueryString(request.query || {});
    if (queryString) {
      path += `?${queryString}`;
    }
    if (request.fragment) {
      path += `#${request.fragment}`;
    }

    let auth = '';
    if (request.username != null || request.password != null) {
      const username = request.username ?? '';
      const password = request.password ?? '';
      auth = `${username}:${password}@`;
    }

    const { port, method } = request;
    const url = `${request.protocol}//${auth}${request.hostname}${port ? `:${port}` : ''}${path}`;

    // Request constructor doesn't allow GET/HEAD request with body
    // @see https://github.com/whatwg/fetch/issues/551
    const body = method === 'GET' || method === 'HEAD' ? undefined : request.body;
    const requestOptions: RequestInit & { duplex?: 'half' } = {
      body,
      headers: new Headers(request.headers),
      method: method,
      credentials,
    };

    // cache property is not supported in worker runtime
    if (this.options?.cache) {
      requestOptions.cache = this.options.cache;
    }

    if (body) {
      requestOptions.duplex = 'half';
    }

    // some browsers support abort signal
    if (typeof AbortController !== 'undefined') {
      requestOptions.signal = abortSignal as AbortSignal;
    }

    // some browsers support keepalive
    if (keepAliveSupport.supported) {
      requestOptions.keepalive = keepAlive;
    }

    if (typeof this.options.requestInit === 'function') {
      Object.assign(requestOptions, this.options.requestInit(request));
    }

    let removeSignalEventListener = () => {};

    const fetchRequest = new Request(url, requestOptions);
    const raceOfPromises = [
      hckFetch(fetchRequest).then(response => {
        const fetchHeaders: any = response.headers;
        const transformedHeaders: HeaderBag = {};

        for (const pair of <Array<string[]>>fetchHeaders.entries()) {
          transformedHeaders[pair[0]] = pair[1];
        }

        // Check for undefined as well as null.
        const hasReadableStream = response.body != undefined;

        // Return the response with buffered body
        if (!hasReadableStream) {
          return response.blob().then(body => ({
            response: new HttpResponse({
              headers: transformedHeaders,
              reason: response.statusText,
              statusCode: response.status,
              body,
            }),
          }));
        }
        // Return the response with streaming body
        return {
          response: new HttpResponse({
            headers: transformedHeaders,
            reason: response.statusText,
            statusCode: response.status,
            body: response.body,
          }),
        };
      }),
      requestTimeout(requestTimeoutInMs),
    ];
    if (abortSignal) {
      raceOfPromises.push(
        new Promise<never>((_resolve, reject) => {
          const onAbort = () => {
            const abortError = new Error('Request aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          };
          if (typeof (abortSignal as AbortSignal).addEventListener === 'function') {
            // preferred.
            const signal = abortSignal as AbortSignal;
            signal.addEventListener('abort', onAbort, { once: true });
            removeSignalEventListener = () => signal.removeEventListener('abort', onAbort);
          } else {
            // backwards compatibility
            abortSignal.onabort = onAbort;
          }
        }),
      );
    }
    return Promise.race(raceOfPromises).finally(removeSignalEventListener);
  }
}

function requestTimeout(timeoutInMs = 0): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (timeoutInMs) {
      setTimeout(() => {
        const timeoutError = new Error(`Request did not complete within ${timeoutInMs} ms`);
        timeoutError.name = 'TimeoutError';
        reject(timeoutError);
      }, timeoutInMs);
    }
  });
}
