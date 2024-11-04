export type FetchParameters = Parameters<typeof globalThis.fetch>;

export type FetchReturnType = ReturnType<typeof globalThis.fetch>;

export function hckFetch(...params: FetchParameters): FetchReturnType;

// <HttpHandler>
import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler';

type LogFn = (message: string, ...params: unknown[]) => void;

export type Logger = {
  debug?: LogFn;
  info?: LogFn;
  warn?: LogFn;
};

export type HttpHandlerConstructorParams = {
  requestTimeout?: number;
  logger: Logger;
};

export type RequestOptions = {
  headers: Headers;
  body?: any;
  method: string;
  signal?: AbortSignal;
};

export type HttpResponse = {
  headers: Record<string, string>;
  statusCode: number;
  body: Blob | ReadableStream<Uint8Array>;
};

export declare class HttpHandler extends FetchHttpHandler {
  requestTimeout?: number;
  logger: Logger;

  constructor(params: HttpHandlerConstructorParams);

  getAbortError(): Error;

  handle(request: any, options?: { abortSignal?: AbortSignal }): Promise<{ response: HttpResponse }>;
}
// </HttpHandler>
