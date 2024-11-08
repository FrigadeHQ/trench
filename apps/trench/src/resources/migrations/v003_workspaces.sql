DROP VIEW IF EXISTS kafka_events_consumer_{kafka_instance_id};

CREATE MATERIALIZED VIEW kafka_events_consumer_{kafka_instance_id} TO events AS
SELECT
    JSONExtractString(json, 'workspace_id') AS workspace_id,
    JSONExtractString(json, 'instance_id') AS instance_id,
    toUUID(JSONExtractString(json, 'uuid')) AS uuid,
    JSONExtractString(json, 'type') AS type,
    JSONExtractString(json, 'event') AS event,
    JSONExtractString(json, 'user_id') AS user_id,
    JSONExtractString(json, 'group_id') AS group_id,
    JSONExtractString(json, 'anonymous_id') AS anonymous_id,
    JSONExtractString(json, 'properties') AS properties,
    JSONExtractString(json, 'traits') AS traits,
    JSONExtractString(json, 'context') AS context,
    parseDateTimeBestEffort(JSONExtractString(json, 'timestamp')) AS timestamp, 
    now64() AS parsed_at
FROM kafka_events_data_{kafka_instance_id};

CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id UUID DEFAULT generateUUIDv4(),
    name String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY workspace_id;

CREATE TABLE IF NOT EXISTS api_keys (
    api_key_id UUID DEFAULT generateUUIDv4(),
    workspace_id UUID,
    key String,
    type String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (workspace_id, api_key_id);

-- Ensures backwards compatibility with the events table if the workspace_id column is not present
ALTER TABLE events ADD COLUMN workspace_id UUID AFTER instance_id;

