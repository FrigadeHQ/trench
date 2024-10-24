import { BaseEvent } from 'shared-models';
import fetch from 'node-fetch';

export type TrenchConfig = {
  publicApiKey: string;
  enabled: boolean;
  serverUrl: string;
};

let isTrenchLoaded = false;
export function trench(config: TrenchConfig) {
  return {
    name: 'trench',

    initialize: (): void => {
      if (config.enabled) {
        // Assuming trench.init is a placeholder for any initialization logic
        isTrenchLoaded = true;
      }
    },

    track: async ({ payload }: { payload: BaseEvent }): Promise<void> => {
      await fetch(`${config.serverUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.publicApiKey}`,
        },
        body: JSON.stringify({
          events: [
            {
              userId: payload.userId,
              event: payload.event,
              properties: payload.properties,
              type: 'track',
            },
          ],
        }),
      });
    },

    page: async ({ payload }: { payload: BaseEvent }): Promise<void> => {
      await fetch(`${config.serverUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.publicApiKey}`,
        },
        body: JSON.stringify({
          events: [
            {
              userId: payload.userId,
              event: '$pageview',
              properties: payload.properties,
              type: 'track',
            },
          ],
        }),
      });
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
      const { userId } = payload;

      const set = payload.traits.$set ?? payload.traits;
      const setOnce = payload.traits.$set_once ?? {};

      if (userId) {
        await fetch(`${config.serverUrl}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.publicApiKey}`,
          },
          body: JSON.stringify({
            events: [
              {
                userId: payload.userId,
                event: 'identify',
                properties: { $set: set, $set_once: setOnce },
                type: 'identify',
              },
            ],
          }),
        });
      }
    },

    loaded: (): boolean => {
      return isTrenchLoaded;
    },

    // Custom Trench's functions to expose to analytics instance
    methods: {
      group: async ({
        payload,
      }: {
        payload: {
          groupId: string;
          traits: {
            $set?: object;
            $set_once?: object;
          } & Record<string, any>;
        };
      }): Promise<void> => {
        const { groupId } = payload;

        const set = payload.traits.$set ?? payload.traits;
        const setOnce = payload.traits.$set_once ?? {};

        if (groupId) {
          await fetch(`${config.serverUrl}/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.publicApiKey}`,
            },
            body: JSON.stringify({
              events: [
                {
                  groupId: payload.groupId,
                  event: 'group',
                  properties: { $set: set, $set_once: setOnce },
                  type: 'group',
                },
              ],
            }),
          });
        }
      },
    },
  };
}
