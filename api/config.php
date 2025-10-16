<?php
declare(strict_types=1);

// Basic CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// Database configuration
// Adjust these values to match your MySQL setup
$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_PORT = getenv('DB_PORT') ?: '3306';
$DB_NAME = getenv('DB_NAME') ?: 'cdr';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';

// Table and column names (adjust if needed)
const PROVINCES_TABLE = 'tbl_ostan';
const PROVINCE_ID_COLUMN = 'code_ostan';
const PROVINCE_NAME_COLUMN = 'nameostan';
const DAILY_TABLE = 'daily_calls_provinces';
const DAILY_DATE_COLUMN = 'date'; // format: YYYY-MM-DD (stored as VARCHAR(10))
const DAILY_PROVINCE_ID_COLUMN = 'code_ostan';

// Auth secret for signing tokens (set ENV AUTH_SECRET for production)
$AUTH_SECRET = getenv('AUTH_SECRET') ?: '8ed1d86e541cf5b1c7adb80e5ee2af87';

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    global $DB_HOST, $DB_PORT, $DB_NAME, $DB_USER, $DB_PASS;
    $dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    try {
        $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
        return $pdo;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
        exit;
    }
}

function respondJson($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireGet(array $keys): array {
    $out = [];
    foreach ($keys as $k) {
        if (!isset($_GET[$k]) || $_GET[$k] === '') {
            respondJson(['error' => "Missing required parameter: {$k}"], 400);
        }
        $out[$k] = trim((string)$_GET[$k]);
    }
    return $out;
}

function isValidDate(string $date): bool {
    // Expect YYYY-MM-DD
    if (!preg_match('/^\d{4}\/\d{2}\/\d{2}$/', $date)) {
        return false;
    }
    [$y, $m, $d] = array_map('intval', explode('/', $date));
    return checkdate($m, $d, $y);
}

// ---- Simple auth helpers ----

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function signToken(array $payload, int $ttlSeconds = 86400): string {
    global $AUTH_SECRET;
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload['exp'] = time() + $ttlSeconds;
    $segments = [base64url_encode(json_encode($header)), base64url_encode(json_encode($payload))];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, $AUTH_SECRET, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function verifyToken(string $token): ?array {
    global $AUTH_SECRET;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', $h . '.' . $p, $AUTH_SECRET, true));
    if (!hash_equals($expected, $s)) return null;
    $payload = json_decode(base64_decode(strtr($p, '-_', '+/')), true);
    if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

function getBearerToken(): ?string {
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (stripos($hdr, 'Bearer ') === 0) {
        return trim(substr($hdr, 7));
    }
    return null;
}

function getAuthenticatedUser(): ?array {
    $tok = getBearerToken();
    if (!$tok) return null;
    return verifyToken($tok);
}

