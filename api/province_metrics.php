<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);
// --- Query logging helpers ---
define('LOG_DIR', __DIR__ . '/logs');

if (!is_dir(LOG_DIR)) {
    // Create logs directory if it doesn't exist
    // 0755 perms, recursive off (path is single segment)
    @mkdir(LOG_DIR, 0755);
}
/* Remove newlines/tabs/extra spaces for logging & execution */
 function normalizeSql($sql){
    // collapse whitespace: replace \r, \n, \t with single space
    $sql = preg_replace('/\s+/', ' ', $sql);
    return trim($sql);
}

/**
 * Interpolate a PDO prepared SQL with its bound params.
 * Handles both named (:name) and positional (?) placeholders.
 */
function interpolateSql(PDO $pdo, string $sql, array $params): string
{
    if (!$params) {
        return $sql;
    }

    // Normalize params: PDO accepts both `:name` and `name` keys; ensure without colon
    $named = [];
    $positional = [];

    $hasNamed = false;
    foreach ($params as $k => $v) {
        if (is_string($k)) {
            $hasNamed = true;
            $named[ltrim($k, ':')] = $v;
        } else {
            $positional[] = $v;
        }
    }

    // Quoter for values
    $quote = function ($val) use ($pdo) {
        if ($val === null) return 'NULL';
        if (is_bool($val)) return $val ? '1' : '0';
        if (is_int($val) || is_float($val)) return (string)$val;
        // Fallback: quote as string
        return $pdo->quote((string)$val);
    };

    $out = $sql;

    // Replace named first (safer for mixed)
    if ($hasNamed) {
        // Sort by key length DESC to avoid partial collisions (e.g., :id before :id2)
        uksort($named, function ($a, $b) { return strlen($b) <=> strlen($a); });
        foreach ($named as $key => $val) {
            // Use word boundary after name; allow multiple occurrences
            $pattern = '/:' . preg_quote($key, '/') . '\b/';
            $out = preg_replace($pattern, $quote($val), $out);
        }
    }

    // Replace positional `?` left to right
    if (!empty($positional)) {
        foreach ($positional as $val) {
            // Replace first occurrence of ?
            $out = preg_replace('/\?/', $quote($val), $out, 1);
        }
    }

    return $out;
}

/**
 * Append a log line with timestamp, route, and the expanded SQL.
 */
function logQuery(PDO $pdo, string $sql, array $params, string $label = ''): void
{
    $file = LOG_DIR . '/queries-' . date('Y-m-d') . '.log';
    $expanded = interpolateSql($pdo, $sql, $params);
    $time = date('Y-m-d H:i:s');
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'CLI';
    $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $label = $label !== '' ? " [$label]" : '';

    $line = "[$time][$ip]$label $uri\n$expanded;\n---\n";
    // Suppress warnings if file isn't writable, to avoid breaking API output
    @file_put_contents($file, $line, FILE_APPEND);
}
// Required: province_id, start_date, end_date
[$provinceId, $startDate, $endDate] = (function () {
    $params = requireGet(['province_id', 'start_date', 'end_date']);
    $auth = getAuthenticatedUser();
    // If authenticated and province_id restricted (non-zero), override request
    if ($auth && isset($auth['province_id']) && (int)$auth['province_id'] !== 0) {
        $params['province_id'] = (string)(int)$auth['province_id'];
    }

    $provinceId = $params['province_id'];
    $startDate = $params['start_date'];
    $endDate = $params['end_date'];

    if (!is_numeric($provinceId)) {
        respondJson(['error' => 'province_id must be numeric'], 400);
    }
    // if (!isValidDate($startDate) || !isValidDate($endDate)) {
    //     respondJson(['error' => 'start_date/end_date must be in YYYY/MM/DD'], 400);
    // }
    if ($startDate > $endDate) {
        respondJson(['error' => 'start_date must be <= end_date'], 400);
    }
    return [(int)$provinceId, $startDate, $endDate];
})();

// Columns to select/aggregate from daily_calls_provinces
$columns = [
    'total_number',
    'number_resulted_operation',
    'number_answered',
    'number_unanswerd',
    'number_answered_operator',
    'number_failed',
    'number_busy',
    'other',
    'congestion',
    'operator-rendered_services',
    'comments',
    'duration_seconds',
    'duration_answered_seconds',
    'countt_moz',
    'rightel',
    'irancell',
    'fixed',
    'unknown',
    'taliya',
    'espadan',
    'kish',
    'mci',
    'short_calls_less_than_5s',
    'anonymous_calls',
    'abandoned_calls',
    'total_wait_time',
];

// Build SUM aggregates for numeric columns
$sumParts = array_map(function ($c) {
    // Backtick for safety; column names may include dashes
    return sprintf('SUM(`%s`) AS `%s`', $c, $c);
}, $columns);

// Averages for certain rates
$avgColumns = [
    'call_completion_rate',
    'average_speed_of_answer_asa',
    'average_handle_time_aht',
    'service_level',
    'call_abandonment_rate',
    'answer_rate',
    'average_wait_time',
];

$avgParts = array_map(function ($c) {
    return sprintf('AVG(`%s`) AS `%s`', $c, $c);
}, $avgColumns);

$select = implode(",\n        ", array_merge($sumParts, $avgParts));

try {
    $pdo = db();

    if ($provinceId === 0) {
        // Overall summary across all provinces in range
        $summarySql = sprintf(
            "SELECT\n            %s\n        FROM `%s`\n        WHERE `%s` >= :start_date AND `%s` <= :end_date",
            $select,
            DAILY_TABLE,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN
        );
        $summarySql = normalizeSql($summarySql);        
        $summaryStmt = $pdo->prepare($summarySql);
        
        $summaryStmt->execute([
            ':start_date' => $startDate,
            ':end_date' => $endDate,
        ]);
        $summary = $summaryStmt->fetch() ?: new stdClass();

        logQuery($pdo, $summarySql, [':start_date' => $startDate, ':end_date' => $endDate], 'summary-all');
        // Per-province aggregates - Start from provinces table to include all provinces
        $perSql = sprintf(
            "SELECT p.`%s` AS province_id, p.`%s` AS province_name,\n            %s,\n            MAX(o.transfer_time) AS transfer_time, MAX(o.transfer_date) AS transfer_date\n        FROM `%s` p\n        LEFT JOIN `%s` d ON p.`%s` = d.`%s`\n            AND d.`%s` >= :start_date AND d.`%s` <= :end_date\n        LEFT JOIN tbl_ostan o ON o.province_id = p.`%s`\n        GROUP BY p.`%s`, p.`%s`",
            PROVINCE_ID_COLUMN,
            PROVINCE_NAME_COLUMN,
            $select,
            PROVINCES_TABLE,
            DAILY_TABLE,
            PROVINCE_ID_COLUMN,
            DAILY_PROVINCE_ID_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN,
            PROVINCE_ID_COLUMN,
            PROVINCE_ID_COLUMN,
            PROVINCE_NAME_COLUMN
        );
        $perSql = normalizeSql($perSql);        
        $perStmt = $pdo->prepare($perSql);
        $perStmt->execute([
            ':start_date' => $startDate,
            ':end_date' => $endDate,
        ]);
        $rows = $perStmt->fetchAll();

        $curl = curl_init();
        curl_setopt_array($curl, [
          CURLOPT_URL => "https://raromis.ir/superapp/dmis/events-num",
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_POSTFIELDS => json_encode([
            'api_key' => '0bg37280538e47301mcab9ced900432a22323am',
            'date_start' => $startDate,
            'date_end' => $endDate
          ]),
          CURLOPT_HTTPHEADER => [
            "content-type: application/json"
          ],
        ]);
        // ⚠️ فقط برای تست: غیرفعال کردن اعتبارسنجی SSL
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

        $response = curl_exec($curl);
        $err = curl_error($curl);
        curl_close($curl);

        $operationsData = [];
        $allOperationsCount=0;
        if ($response && !$err) {
            $response = json_decode($response, true);
            if (is_array($response)) {
                foreach ($response as $item) {
                    if (isset($item['province_id'], $item['events_count'])) {
                        $operationsData[(string)$item['province_id']] = (int)$item['events_count'];
                        $allOperationsCount+=(int)$item['events_count'];
                    }
                }
            }
        }
        
        foreach($rows as &$row){
            if(isset($operationsData[$row['province_id']])){
                $row['events_count']=$operationsData[$row['province_id']];

            }
        }
        $summary['events_count']=$allOperationsCount;
        
        logQuery($pdo, $perSql, [':start_date' => $startDate, ':end_date' => $endDate], 'per-province');
        respondJson([
            'province_id' => 0,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'summary' => $summary,
            'metrics' => $rows,
        ]);
    } else {
        // Summary for single province (entire range)
        $summarySql = sprintf(
            "SELECT\n            %s\n,MAX(tbl_ostan.transfer_time) AS transfer_time, MAX(tbl_ostan.transfer_date) AS transfer_date        FROM `%s`\n   LEFT JOIN  tbl_ostan ON tbl_ostan.province_id=daily_calls_provinces.code_ostan    WHERE daily_calls_provinces.`%s` = :province_id\n          AND `%s` >= :start_date\n          AND `%s` <= :end_date",
            $select,
            DAILY_TABLE,
            DAILY_PROVINCE_ID_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN
        );
        
        $summarySql = normalizeSql($summarySql);        
        $stmt = $pdo->prepare($summarySql);
        $stmt->execute([
            ':province_id' => $provinceId,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
        ]);
        $summary = $stmt->fetch() ?: new stdClass();
        logQuery($pdo, $summarySql, [
            ':province_id' => $provinceId,
            ':start_date'  => $startDate,
            ':end_date'    => $endDate,
        ], 'summary-one');
        $curl = curl_init();
        curl_setopt_array($curl, [
          CURLOPT_URL => "https://raromis.ir/superapp/dmis/events-num",
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_POSTFIELDS => json_encode([
            'api_key' => '0bg37280538e47301mcab9ced900432a22323am',
            'date_start' => $startDate,
            'date_end' => $endDate,
            'province_id'=>$provinceId
          ]),
          CURLOPT_HTTPHEADER => [
            "content-type: application/json"
          ],
        ]);
        // ⚠️ فقط برای تست: غیرفعال کردن اعتبارسنجی SSL
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

        $response = curl_exec($curl);
        $err = curl_error($curl);
        curl_close($curl);

        if($response && !$err){
            $response=json_decode($response,true);
            if(is_array($response)){
                $summary['events_count']=$response[0]['events_count'];
            }
        }
        
        // Per-date aggregates for this province (include primary key id for details fetching)
        // Assumes the table has an auto-increment primary key column named `id`
        $dailySelect = sprintf("`id` AS record_id, `%s` AS report_date,\n            %s", DAILY_DATE_COLUMN, $select);
        $dailySql = sprintf(
            "SELECT\n            %s\n        FROM `%s`\n        WHERE `%s` = :province_id\n          AND `%s` >= :start_date\n          AND `%s` <= :end_date\n        GROUP BY `id`, `%s`\n        ORDER BY `%s` ASC",
            $dailySelect,
            DAILY_TABLE,
            DAILY_PROVINCE_ID_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN
        );
        $dailySql = normalizeSql($dailySql);        
        $dailyStmt = $pdo->prepare($dailySql);
        $dailyStmt->execute([
            ':province_id' => $provinceId,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
        ]);
        $rows = $dailyStmt->fetchAll();
        logQuery($pdo, $dailySql, [
            ':province_id' => $provinceId,
            ':start_date'  => $startDate,
            ':end_date'    => $endDate,
        ], 'per-date');
        respondJson([
            'province_id' => $provinceId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'summary' => $summary,
            'metrics' => $rows,
        ]);
    }
} catch (Throwable $e) {
     // Minimal error logging (doesn't expose to client)
     $errLine = sprintf("[%s] ERROR %s in %s:%d\n",
     date('Y-m-d H:i:s'), $e->getMessage(), $e->getFile(), $e->getLine()
 );
 @file_put_contents(LOG_DIR . '/queries-' . date('Y-m-d') . '.log', $errLine . "---\n", FILE_APPEND);
    respondJson(['error' => 'Failed to load province metrics', 'details' => $e->getMessage()], 500);
}

