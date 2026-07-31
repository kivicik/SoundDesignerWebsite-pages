<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

function raw_value(string $key): string
{
    return isset($_POST[$key]) ? trim((string)$_POST[$key]) : '';
}

function clip_value(string $value, int $limit): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $limit);
    }
    return substr($value, 0, $limit);
}

function value_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function insert_errored(PDO $pdo, string $name, string $email, string $phone, string $message, string $reason): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO errored_messages (name, email, phone, message, error_reason, ip_address, user_agent, created_at)
         VALUES (:name, :email, :phone, :message, :error_reason, :ip_address, :user_agent, :created_at)'
    );

    $stmt->execute([
        ':name' => clip_value($name, 1000),
        ':email' => clip_value($email, 1000),
        ':phone' => clip_value($phone, 1000),
        ':message' => clip_value($message, 2000),
        ':error_reason' => clip_value($reason, 500),
        ':ip_address' => isset($_SERVER['REMOTE_ADDR']) ? (string)$_SERVER['REMOTE_ADDR'] : null,
        ':user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : null,
        ':created_at' => gmdate('c'),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'error' => 'Method not allowed',
    ]);
    exit;
}

$rawName = raw_value('name');
$rawEmail = raw_value('email');
$rawSubject = raw_value('subject');
$rawPhone = raw_value('phone');
$rawMessage = raw_value('message');

$name = clip_value($rawName, 1000);
$email = clip_value($rawEmail, 1000);
$subject = $rawSubject !== '' ? $rawSubject : $rawPhone;
$phone = clip_value($subject, 1000);
$message = clip_value($rawMessage, 4000);
$pdo = null;

try {
    $pdo = contact_db();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to save message.',
    ]);
    exit;
}

if ($name === '' || $email === '' || $message === '') {
    insert_errored($pdo, $rawName, $rawEmail, $subject, $rawMessage, 'Missing required fields');
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'Name, email and message are required.',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    insert_errored($pdo, $rawName, $rawEmail, $subject, $rawMessage, 'Invalid email address');
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'Invalid email address.',
    ]);
    exit;
}

$messageLength = value_length($rawMessage);
if ($messageLength > 4000) {
    insert_errored($pdo, $rawName, $rawEmail, $subject, $rawMessage, 'Message length exceeds 4000 characters');
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'Message can be maximum 4000 characters.',
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO contact_messages (name, email, phone, message, ip_address, user_agent, created_at)
         VALUES (:name, :email, :phone, :message, :ip_address, :user_agent, :created_at)'
    );

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':phone' => $phone,
        ':message' => $message,
        ':ip_address' => isset($_SERVER['REMOTE_ADDR']) ? (string)$_SERVER['REMOTE_ADDR'] : null,
        ':user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : null,
        ':created_at' => gmdate('c'),
    ]);

    echo json_encode([
        'ok' => true,
        'id' => (int)$pdo->lastInsertId(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to save message.',
    ]);
}
