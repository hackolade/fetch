import { hckFetch } from '../index';
import { requestTimeout } from './requestTimeout';
import { isEmpty } from './isEmpty';

type LogHandler = (...content: unknown[]) => string;

export type Logger = {
  log?: LogHandler;
  info?: LogHandler;
};

export type HttpHandlerConstructor = {
  requestTimeout?: number;
  logger?: Logger;
};

type RequestOptions = {
  headers: Headers;
  body?: any;
  method: string;
  signal?: AbortSignal;
};

export class HttpHandler {
  requestTimeout?: HttpHandlerConstructor['requestTimeout'];
  logger?: Logger;

  constructor({ requestTimeout, logger }: HttpHandlerConstructor = {}) {
    this.requestTimeout = requestTimeout;
    this.logger = logger;
  }

  getAbortError = () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    return abortError;
  };

  async handle(request: any, { abortSignal }: { abortSignal?: AbortSignal } = {}) {
    if (abortSignal?.aborted) {
      throw this.getAbortError();
    }

    const { method, query, protocol, port, hostname, body, headers: requestHeaders } = request;

    const headers = new Headers(requestHeaders);
    const headersToSkip = ['content-length', 'host'];
    headersToSkip.forEach(header => headers.delete(header));

    let { path } = request;

    if (!isEmpty(query) && typeof query === 'object') {
      path += `?${new URLSearchParams(query).toString()}`;
    }

    const portParam = port ? `:${port}` : '';

    const url = `${protocol}//${hostname}${portParam}${path}`;

    const methodsWithoutBody = ['GET', 'HEAD'];

    const requestOptions: RequestOptions = {
      body: methodsWithoutBody.includes(method) ? undefined : body,
      headers,
      method,
    };

    if (typeof AbortController !== 'undefined') {
      requestOptions.signal = abortSignal;
    }

    const fetchRequest = new Request(url, requestOptions);

    this.log('info', { fetchRequest }, 'Http request details');

    const resultResolver = async (result: any) => {
      const fetchHeaders = result.headers;
      const transformedHeaders: Record<string, string> = {};

      for (const [key, value] of fetchHeaders.entries()) {
        transformedHeaders[key] = value;
      }

      const hasReadableStream = result.body !== undefined;

      const response = {
        headers: transformedHeaders,
        statusCode: result.status,
        body: hasReadableStream ? result.body : await result.blob(),
      };

      return { response };
    };

    const race = [hckFetch(fetchRequest).then(resultResolver), requestTimeout({ requestTimeout: this.requestTimeout })];

    if (abortSignal) {
      race.push(
        new Promise((_, reject) => {
          abortSignal.onabort = () => {
            reject(this.getAbortError());
          };
        }),
      );
    }

    return Promise.race(race);
  }

  log(...payload: Parameters<LogHandler>) {
    const method = this.logger?.log || this.logger?.info;
    if (method) {
      method(payload);
    }
  }
}
