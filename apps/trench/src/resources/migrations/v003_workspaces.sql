CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id UUID DEFAULT generateUUIDv4(),
    name String,
    database_name String,
    is_default Boolean DEFAULT false,
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

