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
};

export interface BaseEvent {
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

export function trench(config: TrenchConfig) {
  const globalPrefix = '__trench__';
  let isTrenchLoaded = false;
  let anonymousId: string | undefined;
  let currentUserId: string | undefined;
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
      let storedAnonymousId = localStorage.getItem('anonymousId');
      if (!storedAnonymousId) {
        storedAnonymousId = generateAnonymousId();
        localStorage.setItem('anonymousId', storedAnonymousId);
      }
      return storedAnonymousId;
    } else {
      if (!anonymousId) {
        anonymousId = generateAnonymousId();
      }
      return anonymousId;
    }
  }

  async function sendEvents(events: BaseEvent[]): Promise<void> {
    if (config.enabled === false) {
      return;
    }

    const lastEvents = getGlobalValue<BaseEvent[]>('lastEvents');

    if (lastEvents && JSON.stringify(events) === JSON.stringify(lastEvents)) {
      return;
    }
    setGlobalValue('lastEvents', events);

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

      await sendEvents([
        {
          anonymousId: payload.userId ? undefined : getAnonymousId(),
          userId: payload.userId ?? getAnonymousId(),
          event: payload.event,
          properties: payload.properties,
          type: 'track',
        },
      ]);
    },

    page: async ({ payload }: { payload: BaseEvent }): Promise<void> => {
      if (config.enabled === false) {
        return;
      }

      await sendEvents([
        {
          anonymousId: payload.userId ? undefined : getAnonymousId(),
          userId: payload.userId ?? getAnonymousId(),
          event: '$pageview',
          properties: payload.properties,
          type: 'page',
        },
      ]);
    },

    identify: async ({
      payload,
    }: {
      payload: {
        userId: string;
        traits: {
          $set?: object;
          $set_once?: object;
        } & Record<string, any>;
      };
    }): Promise<void> => {
      if (config.enabled === false) {
        return;
      }

      const { userId } = payload;

      setCurrentUserId(userId);

      const set = payload.traits.$set ?? payload.traits;
      const setOnce = payload.traits.$set_once ?? {};

      if (userId) {
        await sendEvents([
          {
            anonymousId: getAnonymousId(),
            userId: payload.userId ?? getAnonymousId(),
            event: 'identify',
            properties: { $set: set, $set_once: setOnce },
            type: 'identify',
          },
        ]);
      }
    },

    loaded: (): boolean => {
      return isTrenchLoaded;
    },

    // Custom Trench's functions to expose to analytics instance
    methods: {
      group: async (
        groupId: string,
        traits: {
          $set?: object;
          $set_once?: object;
        } & Record<string, any>
      ): Promise<void> => {
        if (config.enabled === false) {
          return;
        }

        const set = traits.$set ?? traits;
        const setOnce = traits.$set_once ?? {};

        if (groupId) {
          await sendEvents([
            {
              userId: getCurrentUserId() ?? getAnonymousId(),
              groupId,
              event: 'group',
              properties: { $set: set, $set_once: setOnce },
              type: 'group',
            },
          ]);
        }
      },
    },
  };
}

function removeTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
