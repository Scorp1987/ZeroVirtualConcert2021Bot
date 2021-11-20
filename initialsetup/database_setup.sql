CREATE TABLE IF NOT EXISTS users(
    telegram_id INT PRIMARY KEY,
    telegram_name VARCHAR(50),
    telegram_user_name VARCHAR(20),
    language VARCHAR(2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments(
    payment_id SERIAL PRIMARY KEY,
    telegram_id INT,
    telegram_file_id VARCHAR(255),
    currency VARCHAR(3),
    method VARCHAR(10),
    count INT,
    amount NUMERIC(10,2),
    submitted_date TIMESTAMP NOT NULL,
    verified_date TIMESTAMP,
    verified_by INT
);

CREATE TABLE IF NOT EXISTS tickets(
    ticket_id SERIAL PRIMARY KEY,
    payment_id INT,
    code VARCHAR(255),
    generated_date TIMESTAMP,
    added_to_group_date TIMESTAMP,
    added_to_group_by INT
);

CREATE TABLE IF NOT EXISTS authorizations(
    auth_id SERIAL PRIMARY KEY,
    token VARCHAR(30) NOT NULL,
    name VARCHAR(50) NOT NULL,
    query_users boolean NOT NULL DEFAULT FALSE,
    query_payments boolean NOT NULL DEFAULT FALSE,
    query_tickets boolean NOT NULL DEFAULT FALSE,
    generate_tickets boolean NOT NULL DEFAULT FALSE,
    query_auth boolean NOT NULL DEFAULT FALSE,
    add_auth boolean NOT NULL DEFAULT FALSE,
    update_auth boolean NOT NULL DEFAULT FALSE,
    delete_auth boolean NOT NULL DEFAULT FALSE,
    query_log boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS logs(
    log_id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    auth_id INT NOT NULL,
    resource VARCHAR(20) NOT NULL,
    status boolean NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS ix_telegram_id ON payments(telegram_id);
CREATE INDEX IF NOT EXISTS ix_payment_id ON tickets (payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_token ON authorizations (token);
CREATE INDEX IF NOT EXISTS ix_auth_id ON logs(auth_id);

INSERT INTO authorizations(token,name,query_users,query_payments,query_tickets,generate_tickets,query_auth,add_auth,update_auth,delete_auth,query_log)
SELECT '{ownerToken}','{ownerName}',TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE
WHERE NOT EXISTS(SELECT auth_id FROM authorizations WHERE token='{ownerToken}');