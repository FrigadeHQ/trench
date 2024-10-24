"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trench = trench;
const node_fetch_1 = require("node-fetch");
let isTrenchLoaded = false;
function trench(config) {
    return {
        name: 'trench',
        initialize: () => {
            if (config.enabled) {
                // Assuming trench.init is a placeholder for any initialization logic
                isTrenchLoaded = true;
            }
        },
        track: async ({ payload }) => {
            await (0, node_fetch_1.default)(`${config.serverUrl}/events`, {
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
        page: async ({ payload }) => {
            await (0, node_fetch_1.default)(`${config.serverUrl}/events`, {
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
        identify: async ({ payload, }) => {
            var _a, _b;
            const { userId } = payload;
            const set = (_a = payload.traits.$set) !== null && _a !== void 0 ? _a : payload.traits;
            const setOnce = (_b = payload.traits.$set_once) !== null && _b !== void 0 ? _b : {};
            if (userId) {
                await (0, node_fetch_1.default)(`${config.serverUrl}/events`, {
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
        loaded: () => {
            return isTrenchLoaded;
        },
        // Custom Trench's functions to expose to analytics instance
        methods: {
            group: async (groupId, traits) => {
                var _a, _b;
                const set = (_a = traits.$set) !== null && _a !== void 0 ? _a : traits;
                const setOnce = (_b = traits.$set_once) !== null && _b !== void 0 ? _b : {};
                if (groupId) {
                    await (0, node_fetch_1.default)(`${config.serverUrl}/events`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${config.publicApiKey}`,
                        },
                        body: JSON.stringify({
                            events: [
                                {
                                    groupId,
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
