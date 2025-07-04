-- Webhooks table to store webhook configurations
CREATE TABLE webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    description TEXT,
    secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhook requests table to store incoming webhook data
CREATE TABLE webhook_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    headers TEXT, -- JSON string
    body TEXT,
    query_params TEXT, -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    status_code INTEGER DEFAULT 200,
    response_time INTEGER, -- in milliseconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

-- Webhook stats table for analytics
CREATE TABLE webhook_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    success_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
    UNIQUE(webhook_id, date)
);

-- Test requests table for webhook testing
CREATE TABLE test_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_url TEXT NOT NULL,
    method TEXT NOT NULL,
    headers TEXT, -- JSON string
    body TEXT,
    response_status INTEGER,
    response_body TEXT,
    response_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_webhooks_endpoint ON webhooks(endpoint);
CREATE INDEX idx_webhook_requests_webhook_id ON webhook_requests(webhook_id);
CREATE INDEX idx_webhook_requests_created_at ON webhook_requests(created_at);
CREATE INDEX idx_webhook_stats_webhook_id_date ON webhook_stats(webhook_id, date);
CREATE INDEX idx_test_requests_created_at ON test_requests(created_at);