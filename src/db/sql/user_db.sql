CREATE TABLE IF NOT EXISTS user
(
    device_id  VARCHAR(255) PRIMARY KEY,
    x_coord    DOUBLE NOT NULL DEFAULT 0,
    y_coord    DOUBLE NOT NULL DEFAULT 0,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
