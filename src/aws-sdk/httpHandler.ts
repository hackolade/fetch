import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import { hckFetch } from '../index';
import { isEmpty } from './utils/isEmpty';

type LogFn = (message: string, ...params: unknown[]) => void;

type Logger = {
  debug?: LogFn;
  info?: LogFn;
  warn?: LogFn;
};

type HttpHandlerConstructorParams = {
  requestTimeout?: number;
  logger: Logger;
};

type RequestOptions = {
  headers: Headers;
  body?: any;
  method: string;
  signal?: AbortSignal;
};

export class HttpHandler extends FetchHttpHandler {
  requestTimeout?: HttpHandlerConstructorParams['requestTimeout'];
  logger: Logger;

  constructor({ requestTimeout, logger }: HttpHandlerConstructorParams) {
    super({ requestTimeout });
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

    const fetchRequest = new Request(url, requestOptions);
    this.logger.info?.('Http request details', { fetchRequest });

    let timeout: NodeJS.Timeout | undefined;
    if (!abortSignal && this.requestTimeout) {
      const controller = new AbortController();
      requestOptions.signal = controller.signal;
      timeout = setTimeout(() => controller!.abort(), this.requestTimeout);
    }

    try {
      const result = await hckFetch(fetchRequest);
      const transformedHeaders: Record<string, string> = {};

      for (const [key, value] of result.headers) {
        transformedHeaders[key] = value;
      }

      const response = {
        headers: transformedHeaders,
        statusCode: result.status,
        body: result.body || (await result.blob()),
      };

      return { response };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn?.('Request was aborted');
        throw this.getAbortError();
      }
      throw error;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
