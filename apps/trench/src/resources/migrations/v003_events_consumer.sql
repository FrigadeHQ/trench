DROP VIEW IF EXISTS kafka_events_consumer_{kafka_instance_id};

CREATE MATERIALIZED VIEW kafka_events_consumer_{kafka_instance_id} TO events AS
SELECT
    toUUID(JSONExtractString(json, 'workspace_id')) AS workspace_id,
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
