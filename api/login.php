<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

// Allow only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJson(['error' => 'Method not allowed'], 405);
}

// Read JSON body
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim((string)($body['username'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($username === '' || $password === '') {
    respondJson(['error' => 'username and password are required'], 400);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, username, password, province_id FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, (string)$user['password'])) {
        respondJson(['error' => 'Invalid credentials'], 401);
    }

    $token = signToken([
        'sub' => (int)$user['id'],
        'username' => (string)$user['username'],
        'province_id' => (int)$user['province_id'],
    ], 86400 * 2);

    respondJson([
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'username' => (string)$user['username'],
            'province_id' => (int)$user['province_id'],
        ],
    ]);
} catch (Throwable $e) {
    respondJson(['error' => 'Login failed', 'details' => $e->getMessage()], 500);
}


