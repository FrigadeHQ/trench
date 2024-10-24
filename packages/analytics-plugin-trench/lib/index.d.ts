import { BaseEvent } from 'shared-models';
export type TrenchConfig = {
    publicApiKey: string;
    enabled: boolean;
    serverUrl: string;
};
export declare function trench(config: TrenchConfig): {
    name: string;
    initialize: () => void;
    track: ({ payload }: {
        payload: BaseEvent;
    }) => Promise<void>;
    page: ({ payload }: {
        payload: BaseEvent;
    }) => Promise<void>;
    identify: ({ payload, }: {
        payload: {
            userId: string;
            traits: {
                $set?: object;
                $set_once?: object;
            } & Record<string, any>;
        };
    }) => Promise<void>;
    loaded: () => boolean;
    methods: {
        group: (groupId: string, traits: {
            $set?: object;
            $set_once?: object;
        } & Record<string, any>) => Promise<void>;
    };
};
