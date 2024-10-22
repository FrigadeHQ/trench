create table if not exists kafka_events_data_{kafka_instance_id} (
    json String
) engine = Kafka settings
    kafka_broker_list = '{kafka_brokers}',
    kafka_topic_list = '{kafka_topic}',
    kafka_group_name = 'trench-clickhouse',
    kafka_format = 'JSONAsString',
    kafka_num_consumers = {kafka_partitions}
;

create table if not exists events (
    uuid UUID,
    type String,
    event String,
    user_id String,
    group_id String,
    anonymous_id String,
    instance_id String,
    properties VARCHAR CODEC(ZSTD(3)),
    traits VARCHAR CODEC(ZSTD(3)),
    context VARCHAR CODEC(ZSTD(3)),
    timestamp DateTime64(6, 'UTC'),
    parsed_at DateTime64(6, 'UTC')
) engine = MergeTree()
PARTITION BY instance_id
ORDER BY (instance_id, user_id, -toUnixTimestamp(timestamp));

CREATE MATERIALIZED VIEW kafka_events_consumer_{kafka_instance_id} TO events AS
SELECT
    toUUID(JSONExtractString(json, 'uuid')) AS uuid,
    JSONExtractString(json, 'type') AS type,
    JSONExtractString(json, 'event') AS event,
    JSONExtractString(json, 'user_id') AS user_id,
    JSONExtractString(json, 'group_id') AS group_id,
    JSONExtractString(json, 'anonymous_id') AS anonymous_id,
    JSONExtractString(json, 'instance_id') AS instance_id,
    JSONExtractString(json, 'properties') AS properties,
    JSONExtractString(json, 'traits') AS traits,
    JSONExtractString(json, 'context') AS context,
    parseDateTimeBestEffort(JSONExtractString(json, 'timestamp')) AS timestamp, 
    now64() AS parsed_at
FROM kafka_events_data_{kafka_instance_id};
