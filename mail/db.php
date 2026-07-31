<?php
declare(strict_types=1);

function contact_db_path(): string
{
    $projectRoot = dirname(__DIR__);
    $workspaceRoot = dirname($projectRoot);

    // If running from generated "_site", step one level up to keep DB persistent.
    if (basename($workspaceRoot) === '_site') {
        $workspaceRoot = dirname($workspaceRoot);
    }

    $dbDir = $workspaceRoot . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0777, true);
    }

    return $dbDir . DIRECTORY_SEPARATOR . 'messages.sqlite';
}

function contact_db(): PDO
{
    $dbPath = contact_db_path();
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS errored_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT NOT NULL,
            error_reason TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT NOT NULL
        )'
    );

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_errored_messages_created_at ON errored_messages(created_at DESC)');

    return $pdo;
}
