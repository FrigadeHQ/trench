import fetch from 'node-fetch';

export type TrenchConfig = {
  /**
   * The public API key.
   */
  publicApiKey: string;
  /**
   * Whether to enable the plugin.
   */
  enabled?: boolean;
  /**
   * The Trench API URL. E.g. https://api.trench.dev
   */
  serverUrl: string;
  /**
   * Whether to enable event batching. When enabled, events will be batched together
   * and sent periodically or when batch size is reached. Defaults to false.
   */
  batchingEnabled?: boolean;
  /**
   * Maximum number of events to collect before sending a batch. Default is 100.
   * Only applies when batchingEnabled is true.
   */
  batchSize?: number;
  /**
   * Maximum time in milliseconds to wait before sending a batch. Default is 5000ms.
   * Only applies when batchingEnabled is true.
   */
  batchTimeout?: number;
};

export interface BaseEvent {
  uuid?: string;
  anonymousId?: string;
  context?: {
    active?: boolean;
    app?: {
      name?: string;
      version?: string;
      build?: string;
      namespace?: string;
    };
    campaign?: {
      name?: string;
      source?: string;
      medium?: string;
      term?: string;
      content?: string;
    };
    device?: {
      id?: string;
      advertisingId?: string;
      adTrackingEnabled?: boolean;
      manufacturer?: string;
      model?: string;
      name?: string;
      type?: string;
      token?: string;
    };
    ip?: string;
    library?: {
      name?: string;
      version?: string;
    };
    locale?: string;
    network?: {
      bluetooth?: boolean;
      carrier?: string;
      cellular?: boolean;
      wifi?: boolean;
    };
    os?: {
      name?: string;
      version?: string;
    };
    page?: {
      path?: string;
      referrer?: string;
      search?: string;
      title?: string;
      url?: string;
    };
    referrer?: {
      id?: string;
      type?: string;
    };
    screen?: {
      width?: number;
      height?: number;
      density?: number;
    };
    groupId?: string;
    timezone?: string;
    userAgent?: string;
    userAgentData?: {
      brands?: {
        brand?: string;
        version?: string;
      }[];
      mobile?: boolean;
      platform?: string;
    };
  };
  integrations?: {
    All?: boolean;
    Mixpanel?: boolean;
    Salesforce?: boolean;
  };
  event?: string;
  messageId?: string;
  receivedAt?: string;
  sentAt?: string;
  timestamp?: string;
  type: 'page' | 'track' | 'identify' | 'group';
  userId?: string;
  groupId?: string;
  properties?: {
    [key: string]: any;
  };
  traits?: {
    [key: string]: any;
  };
  instanceId?: string;
}

const KEY_ANONYMOUS_ID = 'anonymousId';
const KEY_TRAITS = 'traits';
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_BATCH_TIMEOUT = 5000;

export function trench(config: TrenchConfig) {
  const globalPrefix = '__trench__';
  let isTrenchLoaded = false;
  let anonymousId: string | undefined;
  let currentUserId: string | undefined;
  let eventBatch: BaseEvent[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;

  const batchSize = config.batchSize || DEFAULT_BATCH_SIZE;
  const batchTimeoutMs = config.batchTimeout || DEFAULT_BATCH_TIMEOUT;

  function setGlobalValue(key: string, value: any): void {
    const prefixedKey = `${globalPrefix}${key}`;
    if (typeof globalThis !== 'undefined') {
      (globalThis as any)[prefixedKey] = value;
    } else if (typeof window !== 'undefined') {
      (window as any)[prefixedKey] = value;
    } else if (typeof global !== 'undefined') {
      (global as any)[prefixedKey] = value;
    }
  }

  function getGlobalValue<T>(key: string): T | undefined {
    const prefixedKey = `${globalPrefix}${key}`;
    if (typeof globalThis !== 'undefined') {
      return (globalThis as any)[prefixedKey] as T;
    } else if (typeof window !== 'undefined') {
      return (window as any)[prefixedKey] as T;
    } else if (typeof global !== 'undefined') {
      return (global as any)[prefixedKey] as T;
    }
    return undefined;
  }

  function setCurrentUserId(userId: string): void {
    currentUserId = userId;
  }

  function getCurrentUserId(): string | undefined {
    return currentUserId;
  }

  function getContext(): Record<string, any> | undefined {
    if (getGlobalValue(KEY_TRAITS)) {
      return {
        traits: getGlobalValue(KEY_TRAITS),
      };
    }
    return undefined;
  }

  /* tslint:disable */
  function generateAnonymousId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  /* tslint:enable */

  function getAnonymousId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      let storedAnonymousId = localStorage.getItem(KEY_ANONYMOUS_ID);
      if (!storedAnonymousId) {
        storedAnonymousId = generateAnonymousId();
        localStorage.setItem(KEY_ANONYMOUS_ID, storedAnonymousId);
      }
      return storedAnonymousId;
    } else {
      if (!anonymousId) {
        anonymousId = generateAnonymousId();
      }
      return anonymousId;
    }
  }

  async function flushEventBatch(): Promise<void> {
    if (eventBatch.length === 0) return;

    const eventsToSend = [...eventBatch];
    eventBatch = [];

    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }

    await sendEvents(eventsToSend);
  }

  async function queueEvent(event: BaseEvent): Promise<void> {
    if (config.enabled === false) {
      return;
    }

    if (!config.batchingEnabled) {
      await sendEvents([event]);
      return;
    }

    eventBatch.push(event);

    if (eventBatch.length >= batchSize) {
      await flushEventBatch();
    } else if (!batchTimeout) {
      batchTimeout = setTimeout(() => flushEventBatch(), batchTimeoutMs);
    }
  }

  async function sendEvents(events: BaseEvent[]): Promise<void> {
    if (config.enabled === false) {
      return;
    }

    await fetch(`${removeTrailingSlash(config.serverUrl)}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.publicApiKey}`,
      },
      body: JSON.stringify({ events }),
    });
  }

  return {
    name: 'trench',

    initialize: (): void => {
      if (config.enabled !== false) {
        isTrenchLoaded = true;
      }
    },

    track: async ({ payload }: { payload: BaseEvent }): Promise<void> => {
      if (config.enabled === false) {
        return;
      }

      await queueEvent({
        anonymousId: payload.userId ? undefined : getAnonymousId(),
        userId: payload.userId ?? getAnonymousId(),
        event: payload.event,
        properties: payload.properties,
        context: getContext(),
        type: 'track',
      });
    },

    page: async ({ payload }: { payload: BaseEvent }): Promise<void> => {
      if (config.enabled === false) {
        return;
      }

      await queueEvent({
        anonymousId: payload.userId ? undefined : getAnonymousId(),
        userId: payload.userId ?? getAnonymousId(),
        event: '$pageview',
        properties: payload.properties,
        context: getContext(),
        type: 'page',
      });
    },

    identify: async ({
      payload,
    }: {
      payload: {
        userId: string;
        traits?: Record<string, any>;
      };
    }): Promise<void> => {
      if (config.enabled === false) {
        return;
      }

      const { userId } = payload;

      setCurrentUserId(userId);

      if (userId) {
        const traits = payload?.traits ?? {};

        setGlobalValue(KEY_TRAITS, traits);

        await queueEvent({
          anonymousId: getAnonymousId(),
          userId: payload.userId ?? getAnonymousId(),
          event: 'identify',
          traits,
          type: 'identify',
        });
      }
    },

    loaded: (): boolean => {
      return isTrenchLoaded;
    },

    // Custom Trench's functions to expose to analytics instance
    methods: {
      group: async (groupId: string, traits?: Record<string, any>): Promise<void> => {
        if (config.enabled === false) {
          return;
        }

        if (groupId) {
          await queueEvent({
            userId: getCurrentUserId() ?? getAnonymousId(),
            groupId,
            event: 'group',
            traits,
            type: 'group',
          });
        }
      },
    },
  };
}

function removeTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
