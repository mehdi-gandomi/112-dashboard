<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

try {
    // Accept either id (for backward compatibility) or province_id + date range
    $params = $_GET;
    
    if (isset($params['id'])) {
        // Original functionality - fetch by record ID
        $id = (int)$params['id'];
        if ($id <= 0) {
            respondJson(['error' => 'Invalid id'], 400);
        }

        $pdo = db();

        // Fetch full row for a given daily record id
        $sql = sprintf(
            'SELECT * FROM `%s` WHERE `id` = :id LIMIT 1',
            DAILY_TABLE
        );
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            respondJson(['error' => 'Record not found', 'id' => $id], 404);
        }

        // Attempt to JSON-decode known JSON columns if they are strings
        $jsonColumns = [
            'handled_calls_per_operator',
            'average_talk_time_per_operator',
            'operator_missed_call_rate',
            'operator_answer_rate',
            'hourly_call_volume',
            'daily_call_volume',
            'daily_call_trend',
            'peak_hour_analysis',
            'avg_duration_by_hour',
            'call_origin_type',
            'queue_time',
            'zero_billsec_calls',
            'repeated_caller_analysis',
            'call_duration_distribution',
            'abandoned_call_analysis',
        ];

        foreach ($jsonColumns as $col) {
            if (array_key_exists($col, $row) && is_string($row[$col]) && $row[$col] !== '') {
                $decoded = json_decode($row[$col], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $row[$col] = $decoded;
                }
            }
        }

        respondJson(['record' => $row]);
        
    } else {
        // New functionality - fetch by province_id and date range
        $requiredParams = requireGet(['province_id', 'start_date', 'end_date']);
        $auth = getAuthenticatedUser();
        if ($auth && isset($auth['province_id']) && (int)$auth['province_id'] !== 0) {
            $requiredParams['province_id'] = (string)(int)$auth['province_id'];
        }
        $provinceId = $requiredParams['province_id'];
        $startDate = $requiredParams['start_date'];
        $endDate = $requiredParams['end_date'];

        if (!is_numeric($provinceId)) {
            respondJson(['error' => 'province_id must be numeric'], 400);
        }
        if (!isValidDate($startDate) || !isValidDate($endDate)) {
            respondJson(['error' => 'start_date/end_date must be in YYYY/MM/DD'], 400);
        }
        if ($startDate > $endDate) {
            respondJson(['error' => 'start_date must be <= end_date'], 400);
        }

        $pdo = db();

        // Fetch individual records for each day in the date range (no aggregation)
        $sql = sprintf(
            'SELECT * FROM `%s` 
             WHERE `%s` = :province_id 
               AND `%s` >= :start_date 
               AND `%s` <= :end_date
             ORDER BY `%s` ASC',
            DAILY_TABLE,
            DAILY_PROVINCE_ID_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':province_id' => (int)$provinceId,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
        ]);
        
        $records = $stmt->fetchAll();

        if (empty($records)) {
            respondJson(['error' => 'No data found for the specified criteria'], 404);
        }

        // Process JSON columns for each record
        $jsonColumns = [
            'handled_calls_per_operator',
            'average_talk_time_per_operator',
            'operator_missed_call_rate',
            'operator_answer_rate',
            'hourly_call_volume',
            'daily_call_volume',
            'daily_call_trend',
            'peak_hour_analysis',
            'avg_duration_by_hour',
            'call_origin_type',
            'queue_time',
            'zero_billsec_calls',
            'repeated_caller_analysis',
            'call_duration_distribution',
            'abandoned_call_analysis',
        ];

        foreach ($records as &$record) {
            $record['other']=$record['other']+$record['unknown'];
            $totalComputed=$record['mci']+$record['irancell']+$record['rightel']+$record['fixed']+$record['taliya']+$record['espadan']+$record['other'];
        if($totalComputed > $record['total_number']){
            $excess=$totalComputed -$record['total_number'];
            $record['other']=$record['other']-$excess;
        }
            // Process JSON columns
            foreach ($jsonColumns as $col) {
                if (array_key_exists($col, $record) && is_string($record[$col]) && $record[$col] !== '') {
                    $decoded = json_decode($record[$col], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $record[$col] = $decoded;
                    } else {
                        // If JSON decode fails, set to null or empty array
                        $record[$col] = null;
                    }
                } 
                // else {
                //     // If column doesn't exist or is empty, generate sample data
                //     $record[$col] = generateSampleData($col);
                // }
            }
        }

        // Set the first record as currentRecord for the popup
        $firstRecord = $records[0];
        $firstRecord['report_date'] = $firstRecord[DAILY_DATE_COLUMN];
        
        // Add province name to the current record
        $pdo = db();
        $provinceSql = sprintf(
            'SELECT %s AS name FROM %s WHERE %s = :province_id LIMIT 1',
            PROVINCE_NAME_COLUMN,
            PROVINCES_TABLE,
        PROVINCE_ID_COLUMN
        );
        $provinceStmt = $pdo->prepare($provinceSql);
        $provinceStmt->execute([':province_id' => (int)$provinceId]);
        $provinceRow = $provinceStmt->fetch();
        
        if ($provinceRow) {
            $firstRecord['province_name'] = $provinceRow['name'];
        }

        respondJson([
            'province_id' => (int)$provinceId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'records' => $records,
            'currentRecord' => $firstRecord
        ]);
    }

} catch (Throwable $e) {
    respondJson(['error' => 'Failed to load daily record details', 'details' => $e->getMessage()], 500);
}

// Helper function to generate sample data for JSON columns
function generateSampleData($columnName) {
    switch ($columnName) {
        case 'hourly_call_volume':
            $data = [];
            for ($hour = 0; $hour < 24; $hour++) {
                $data[] = [
                    'hour_number' => $hour,
                    'hour_formatted' => sprintf('%02d:00', $hour),
                    'hour_readable' => sprintf('%s - %s', 
                        $hour === 0 ? '12:00 AM' : ($hour === 12 ? '12:00 PM' : ($hour > 12 ? sprintf('%d:00 PM', $hour - 12) : sprintf('%d:00 AM', $hour))),
                        $hour === 23 ? '12:00 AM' : ($hour === 11 ? '12:00 PM' : ($hour > 11 ? sprintf('%d:00 PM', $hour - 11) : sprintf('%d:00 AM', $hour + 1)))
                    ),
                    'call_count' => rand(100, 1000),
                    'answered_calls' => rand(80, 800)
                ];
            }
            return $data;
            
        case 'handled_calls_per_operator':
            return [
                [
                    'operator' => 'operator_1',
                    'handled_calls' => rand(1000, 5000),
                    'total_calls' => rand(1200, 6000),
                    'missed_calls' => rand(10, 100)
                ]
            ];
            
        case 'average_talk_time_per_operator':
            return [
                [
                    'operator' => 'operator_1',
                    'avg_talk_time_seconds' => rand(10, 30)
                ]
            ];
            
        case 'operator_missed_call_rate':
            return [
                [
                    'operator' => 'operator_1',
                    'missed_call_rate_percentage' => number_format(rand(1, 10) / 10, 2),
                    'missed_calls' => rand(10, 100),
                    'total_calls' => rand(1000, 5000)
                ]
            ];
            
        case 'operator_answer_rate':
            return [
                [
                    'operator' => 'operator_1',
                    'answer_rate_percentage' => number_format(rand(85, 99) / 10, 2)
                ]
            ];
            
        case 'daily_call_volume':
            return [
                [
                    'day_number' => rand(1, 7),
                    'day_name' => 'Monday',
                    'call_count' => rand(50000, 100000)
                ]
            ];
            
        case 'daily_call_trend':
            return [
                [
                    'date' => date('Y-m-d'),
                    'day_name' => 'Monday',
                    'call_count' => rand(50000, 100000),
                    'answered_calls' => rand(30000, 60000)
                ]
            ];
            
        case 'peak_hour_analysis':
            return [
                [
                    'hour_number' => rand(9, 17),
                    'hour_formatted' => sprintf('%02d:00', rand(9, 17)),
                    'hour_readable' => '09:00 AM - 10:00 AM',
                    'call_count' => rand(5000, 10000),
                    'answered_calls' => rand(3000, 6000)
                ]
            ];
            
        case 'avg_duration_by_hour':
            $data = [];
            for ($hour = 0; $hour < 24; $hour++) {
                $data[] = [
                    'hour_number' => $hour,
                    'hour_readable' => sprintf('%s - %s', 
                        $hour === 0 ? '12:00 AM' : ($hour === 12 ? '12:00 PM' : ($hour > 12 ? sprintf('%d:00 PM', $hour - 12) : sprintf('%d:00 AM', $hour))),
                        $hour === 23 ? '12:00 AM' : ($hour === 11 ? '12:00 PM' : ($hour > 11 ? sprintf('%d:00 PM', $hour - 11) : sprintf('%d:00 AM', $hour + 1)))
                    ),
                    'avg_duration_seconds' => number_format(rand(5, 25) / 10, 2)
                ];
            }
            return $data;
            
        case 'call_origin_type':
            return [
                [
                    'origin_type' => 'Other/International',
                    'call_count' => rand(40000, 80000),
                    'answered_count' => rand(20000, 50000),
                    'answer_rate_percentage' => number_format(rand(30, 80) / 10, 2),
                    'avg_talk_time_seconds' => number_format(rand(10, 40) / 10, 2)
                ]
            ];
            
        case 'queue_time':
            return [
                'average_queue_time_seconds' => number_format(rand(1, 5) / 10, 2),
                'max_queue_time_seconds' => rand(1, 10),
                'min_queue_time_seconds' => 0,
                'total_queue_calls' => rand(5000, 20000)
            ];
            
        case 'zero_billsec_calls':
            return [
                'total_count' => rand(20000, 50000),
                'answered_with_zero_billsec' => rand(1000, 5000),
                'no_answer_zero_billsec' => rand(500, 2000),
                'percentage' => number_format(rand(40, 70) / 10, 2),
                'total_calls' => rand(50000, 100000)
            ];
            
        case 'repeated_caller_analysis':
            return [
                'repeated_callers' => [
                    [
                        'caller_number' => '210359156049591550',
                        'call_count' => rand(100, 1000),
                        'first_call' => date('Y-m-d H:i:s'),
                        'last_call' => date('Y-m-d H:i:s'),
                        'time_span_minutes' => rand(5, 60),
                        'avg_talk_time_seconds' => number_format(rand(20, 70) / 10, 1)
                    ]
                ],
                'repeated_caller_rate_percentage' => number_format(rand(10, 30) / 10, 2),
                'total_repeated_callers' => rand(1000, 3000),
                'unique_callers_total' => rand(10000, 20000)
            ];
            
        case 'call_duration_distribution':
            return [
                [
                    'duration_range' => 'No Answer (0s)',
                    'call_count' => rand(20000, 50000),
                    'percentage' => number_format(rand(40, 70) / 10, 2),
                    'avg_duration_in_range' => 0
                ]
            ];
            
        case 'abandoned_call_analysis':
            return [
                'average_abandoned_duration_seconds' => number_format(rand(1, 6) / 10, 2),
                'min_abandoned_duration_seconds' => 0,
                'max_abandoned_duration_seconds' => rand(100, 500),
                'abandoned_under_5s' => rand(20000, 40000),
                'abandoned_6_15s' => rand(1000, 3000),
                'abandoned_over_15s' => rand(200, 1000),
                'total_abandoned' => rand(25000, 50000),
                'breakdown_by_reason' => [
                    'no_answer' => rand(1000, 5000),
                    'busy' => rand(20000, 40000),
                    'congestion' => rand(1, 100)
                ]
            ];
            
        default:
            return null;
    }
}


