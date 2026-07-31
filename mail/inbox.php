<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function h(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function preview_text(?string $value, int $limit = 64): string
{
    $text = trim((string)$value);
    if ($text === '') {
        return '';
    }
    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        if (mb_strlen($text) <= $limit) {
            return $text;
        }
        return mb_substr($text, 0, $limit) . '...';
    }
    if (strlen($text) <= $limit) {
        return $text;
    }
    return substr($text, 0, $limit) . '...';
}

function fmt_date(?string $value): string
{
    if ($value === null || trim($value) === '') {
        return '';
    }
    try {
        $dt = new DateTime($value, new DateTimeZone('UTC'));
        $dt->setTimezone(new DateTimeZone('America/New_York'));
        return $dt->format('d M Y, h:i A (T)');
    } catch (Throwable $e) {
        return (string)$value;
    }
}

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
if ($limit < 1) {
    $limit = 50;
}
if ($limit > 500) {
    $limit = 500;
}

$error = null;
$messages = [];
$erroredMessages = [];
$total = 0;
$erroredTotal = 0;

try {
    $pdo = contact_db();
    $total = (int)$pdo->query('SELECT COUNT(*) FROM contact_messages')->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT id, name, email, phone, message, ip_address, user_agent, created_at
         FROM contact_messages
         ORDER BY id DESC
         LIMIT :limit'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $messages = $stmt->fetchAll();

    $erroredTotal = (int)$pdo->query('SELECT COUNT(*) FROM errored_messages')->fetchColumn();
    $errStmt = $pdo->prepare(
        'SELECT id, name, email, phone, message, error_reason, created_at
         FROM errored_messages
         ORDER BY id DESC
         LIMIT :limit'
    );
    $errStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $errStmt->execute();
    $erroredMessages = $errStmt->fetchAll();
} catch (Throwable $e) {
    $error = 'Failed to load messages.';
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Inbox</title>
    <style>
        :root {
            color-scheme: dark;
        }
        body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #1f2126;
            color: #f0f0f0;
        }
        .wrap {
            max-width: 1200px;
            margin: 0 auto;
            padding: 28px 18px 40px;
        }
        .topbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 0.6px;
        }
        .meta {
            color: #b9bec7;
            font-size: 14px;
        }
        .controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        input[type="number"] {
            width: 84px;
            border: 1px solid #4d5562;
            border-radius: 6px;
            background: #171a20;
            color: #fff;
            padding: 8px;
            font-size: 14px;
        }
        button, .btn {
            border: 1px solid #4d5562;
            background: #2b313b;
            color: #fff;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            text-decoration: none;
            cursor: pointer;
        }
        button:hover, .btn:hover {
            background: #353d49;
        }
        .panel {
            background: #252932;
            border: 1px solid #3a404b;
            border-radius: 10px;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead th {
            text-align: left;
            font-size: 13px;
            color: #d8dbe1;
            background: #2e3440;
            border-bottom: 1px solid #3f4754;
            padding: 10px 12px;
        }
        tbody td {
            border-bottom: 1px solid #353c47;
            padding: 12px;
            vertical-align: top;
            font-size: 15px;
            line-height: 1.45;
            color: #f3f5f8;
        }
        tbody tr:last-child td {
            border-bottom: 0;
        }
        .col-id { width: 54px; }
        .col-date { width: 190px; white-space: nowrap; }
        .col-email { width: 210px; }
        .msg {
            white-space: pre-wrap;
            word-break: break-word;
            max-width: 600px;
        }
        .msg-preview {
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 4px;
        }
        .msg-full summary {
            cursor: pointer;
            color: #c8d5ff;
            font-size: 13px;
            user-select: none;
            margin-bottom: 6px;
        }
        .msg-full[open] summary {
            color: #ffffff;
        }
        .muted {
            color: #a5adba;
        }
        .error {
            margin-top: 10px;
            color: #ff8f8f;
        }
        .stack {
            display: grid;
            gap: 14px;
        }
        details.dropdown {
            background: #252932;
            border: 1px solid #3a404b;
            border-radius: 10px;
            overflow: hidden;
        }
        details.dropdown summary {
            list-style: none;
            cursor: pointer;
            padding: 12px 14px;
            background: #2e3440;
            color: #f2f4f8;
            font-weight: 600;
            border-bottom: 1px solid #3f4754;
        }
        details.dropdown summary::-webkit-details-marker {
            display: none;
        }
        .reason-badge {
            display: inline-block;
            font-size: 12px;
            color: #ffd6d6;
            background: rgba(140, 40, 40, 0.28);
            border: 1px solid rgba(255, 128, 128, 0.35);
            border-radius: 999px;
            padding: 3px 8px;
            margin-bottom: 6px;
        }
        .new-indicator {
            color: #ffd166;
            font-weight: 700;
            margin-left: 6px;
            display: none;
        }
        @media (max-width: 900px) {
            table, thead, tbody, tr, th, td {
                display: block;
            }
            thead {
                display: none;
            }
            tbody td {
                border-bottom: 1px solid #3b4250;
                padding: 8px 12px;
            }
            tbody td::before {
                content: attr(data-label) ": ";
                color: #b8c0cd;
                font-weight: 600;
            }
        }
    </style>
</head>
<body>
    <main class="wrap">
        <div class="topbar">
            <div>
                <h1>Inbox</h1>
                <div class="meta">Total messages: <?php echo $total; ?></div>
            </div>
            <form method="get" class="controls">
                <label for="limit" class="meta">Show</label>
                <input id="limit" name="limit" type="number" min="1" max="500" value="<?php echo $limit; ?>">
                <button type="submit">Apply</button>
                <a class="btn" href="inbox.php">Reset</a>
            </form>
        </div>

        <?php if ($error !== null): ?>
            <div class="error"><?php echo h($error); ?></div>
        <?php else: ?>
            <div class="stack">
                <div class="panel">
                    <table>
                        <thead>
                            <tr>
                                <th class="col-id">#</th>
                                <th>Name</th>
                                <th class="col-email">Email</th>
                                <th>Subject</th>
                                <th>Message</th>
                            <th class="col-date">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (count($messages) === 0): ?>
                                <tr>
                                    <td colspan="6" class="muted">No messages yet.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($messages as $row): ?>
                                    <tr>
                                        <td data-label="#"><?php echo (int)$row['id']; ?></td>
                                        <td data-label="Name"><?php echo h($row['name']); ?></td>
                                        <td data-label="Email"><?php echo h($row['email']); ?></td>
                                        <td data-label="Subject"><?php echo h($row['phone']); ?></td>
                                        <td data-label="Message">
                                            <div class="msg-preview"><?php echo h(preview_text($row['message'])); ?></div>
                                            <details class="msg-full">
                                                <summary>Read full</summary>
                                                <div class="msg"><?php echo h($row['message']); ?></div>
                                            </details>
                                        </td>
                                        <td data-label="Created"><?php echo h(fmt_date($row['created_at'])); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <details class="dropdown" id="invalidAttempts" data-max-id="<?php echo count($erroredMessages) ? (int)$erroredMessages[0]['id'] : 0; ?>">
                    <summary>Invalid Attempts (<?php echo $erroredTotal; ?>)<span class="new-indicator" id="invalidAttemptsNew">*</span></summary>
                    <div class="panel">
                        <table>
                            <thead>
                                <tr>
                                    <th class="col-id">#</th>
                                    <th>Name</th>
                                    <th class="col-email">Email</th>
                                    <th>Subject</th>
                                    <th>Error / Message</th>
                                    <th class="col-date">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (count($erroredMessages) === 0): ?>
                                    <tr>
                                        <td colspan="6" class="muted">No errored messages.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($erroredMessages as $row): ?>
                                        <tr>
                                            <td data-label="#"><?php echo (int)$row['id']; ?></td>
                                            <td data-label="Name"><?php echo h($row['name']); ?></td>
                                            <td data-label="Email"><?php echo h($row['email']); ?></td>
                                            <td data-label="Subject"><?php echo h($row['phone']); ?></td>
                                            <td data-label="Error / Message">
                                                <div class="reason-badge"><?php echo h($row['error_reason']); ?></div>
                                                <div class="msg-preview"><?php echo h(preview_text($row['message'])); ?></div>
                                                <details class="msg-full">
                                                    <summary>Read full</summary>
                                                    <div class="msg"><?php echo h($row['message']); ?></div>
                                                </details>
                                            </td>
                                            <td data-label="Created"><?php echo h(fmt_date($row['created_at'])); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </details>
            </div>
        <?php endif; ?>
    </main>
    <script>
        (function () {
            var section = document.getElementById('invalidAttempts');
            var marker = document.getElementById('invalidAttemptsNew');
            if (!section || !marker) return;

            var maxId = parseInt(section.getAttribute('data-max-id') || '0', 10);
            var key = 'inbox_last_seen_invalid_attempt_id';
            var seen = parseInt(localStorage.getItem(key) || '0', 10);

            if (maxId > seen) {
                marker.style.display = 'inline';
            }

            section.addEventListener('toggle', function () {
                if (!section.open) return;
                localStorage.setItem(key, String(maxId));
                marker.style.display = 'none';
            });
        })();
    </script>
</body>
</html>
