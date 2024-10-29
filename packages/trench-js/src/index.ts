import Analytics from 'analytics';
import { trench, TrenchConfig } from 'analytics-plugin-trench';
import { PaginatedEventResponse, PaginatedQueryResponse, TrenchJSConfig } from './types';

class Trench {
  private analytics: ReturnType<typeof Analytics>;
  private config: TrenchJSConfig;

  constructor(config: TrenchJSConfig) {
    if (!config.serverUrl) {
      throw new Error('Trench serverUrl is required in the configuration.');
    }

    try {
      const url = new URL(config.serverUrl);
    } catch (error) {
      throw new Error(`Trench serverUrl '${config.serverUrl}' is not a valid URL.`, error);
    }

    if (!config.publicApiKey) {
      throw new Error('Trench publicApiKey is required.');
    }

    this.config = {
      ...config,
      serverUrl: this.removeTrailingSlash(config.serverUrl),
    };
    this.analytics = Analytics({
      app: 'trench-app',
      plugins: [trench(config)],
    });

    if (config.autoCaptureEvents) {
      this.page({});
      this.enableAutoCapture();
    }
  }

  private enableAutoCapture() {
    if (typeof window !== 'undefined') {
      let lastPage = '';

      const sendPageView = () => {
        const currentPage = window.location.href;
        if (currentPage !== lastPage) {
          this.page({});
          lastPage = currentPage;
        }
      };

      window.addEventListener('load', () => {
        sendPageView();
      });

      window.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const eventName = target.getAttribute('data-event-name') || 'click';
        this.track(eventName, {
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          textContent: target.textContent,
        });
      });

      window.addEventListener('popstate', () => {
        sendPageView();
      });

      const originalPushState = history.pushState;
      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        sendPageView();
      };

      const originalReplaceState = history.replaceState;
      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        sendPageView();
      };
    }
  }

  track(event: string, properties: Record<string, unknown>) {
    this.analytics.track(event, properties);
  }

  page(properties: Record<string, unknown>) {
    const mergedProperties = {
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...properties,
    };
    this.analytics.page(mergedProperties);
  }

  identify(userId: string, traits: Record<string, unknown>) {
    this.analytics.identify(userId, traits);
  }

  group(groupId: string, traits: Record<string, unknown>) {
    // @ts-ignore
    this.analytics.plugins.trench.group(groupId, traits);
  }
  /**
   * Queries events from the Trench server.
   * Note: This method only works when a private API key is specified.
   * @param {object} queryParams - The query parameters to filter events.
   * @param {string} [queryParams.event] - The event name to filter by.
   * @param {string} [queryParams.userId] - The user ID to filter by.
   * @param {string} [queryParams.groupId] - The group ID to filter by.
   * @param {string} [queryParams.anonymousId] - The anonymous ID to filter by.
   * @param {string} [queryParams.instanceId] - The instance ID to filter by.
   * @param {string} [queryParams.startDate] - The start date to filter by.
   * @param {string} [queryParams.endDate] - The end date to filter by.
   * @param {number} [queryParams.limit] - The limit of records to return.
   * @param {number} [queryParams.offset] - The offset of records to return.
   * @param {string} [queryParams.orderByField] - The field to order by.
   * @param {string} [queryParams.orderByDirection] - The direction to order by. Available options: ASC, DESC.
   * @returns {Promise<any>} - A promise that resolves to the queried events.
   */
  async getEvents(queryParams: {
    event?: string;
    userId?: string;
    groupId?: string;
    anonymousId?: string;
    instanceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    orderByField?: string;
    orderByDirection?: 'ASC' | 'DESC';
  }): Promise<PaginatedEventResponse> {
    this.assertPrivateApiKey();
    const queryString = new URLSearchParams(queryParams as any).toString();
    const response = await fetch(`${this.config.serverUrl}/events?${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.privateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to query events');
    }

    return response.json();
  }

  /**
   * Executes one or more raw SQL queries on the Trench server.
   * Note: This method only works when a private API key is specified.
   * @param {string[]} queries - The SQL queries to execute.
   * @returns {Promise<PaginatedQueryResponse>} - A promise that resolves to the query results.
   */
  async executeQueries(queries: string[]): Promise<PaginatedQueryResponse> {
    this.assertPrivateApiKey();
    const response = await fetch(`${this.config.serverUrl}/queries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.privateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queries }),
    });

    if (!response.ok) {
      throw new Error('Failed to execute query');
    }

    return response.json();
  }

  loaded() {
    return true;
  }

  private assertPrivateApiKey() {
    if (!this.config.privateApiKey) {
      throw new Error('Trench privateApiKey is required to access private endpoints.');
    }
  }

  private removeTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
}

export default Trench;
