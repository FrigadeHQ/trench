import { TrenchConfig, BaseEvent } from 'analytics-plugin-trench';

export type TrenchJSConfig = TrenchConfig & {
  /**
   * Private API key for authentication. WARNING: This should only be used if you're using this library from a backend environment.
   */
  privateApiKey?: string;
  /**
   * Boolean flag to enable or disable auto capturing of events. This will automatically record pageviews and track events if set to true in a web environment.
   * Defaults to false.
   */
  autoCaptureEvents?: boolean;
  /**
   * The base URL of the Trench server.
   */
  serverUrl?: string;
};
export type PaginatedResponse<T> = {
  results: T[];
  limit: number | null;
  offset: number | null;
  total: number | null;
};

export type PaginatedQueryResponse = PaginatedResponse<any>;

export type PaginatedEventResponse = PaginatedResponse<BaseEvent>;
