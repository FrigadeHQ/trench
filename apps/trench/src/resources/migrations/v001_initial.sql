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
    workspace_id UUID,
    instance_id String,
    uuid UUID,
    type String,
    event String,
    user_id String,
    group_id String,
    anonymous_id String,
    properties VARCHAR CODEC(ZSTD(3)),
    traits VARCHAR CODEC(ZSTD(3)),
    context VARCHAR CODEC(ZSTD(3)),
    timestamp DateTime64(6, 'UTC'),
    parsed_at DateTime64(6, 'UTC')
) engine = MergeTree()
PARTITION BY workspace_id
ORDER BY (workspace_id, instance_id, user_id, -toUnixTimestamp(timestamp));

