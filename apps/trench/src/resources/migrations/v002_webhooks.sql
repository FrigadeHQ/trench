CREATE TABLE IF NOT EXISTS webhooks (
    uuid UUID DEFAULT generateUUIDv4(),
    url String,
    enable_batching Bool DEFAULT false,
    created_at DateTime DEFAULT now(),
    event_types Array(String),
    event_names Array(String),
) ENGINE = MergeTree()
ORDER BY created_at;
