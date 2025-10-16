<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/jdf.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type");

// Set content type for Excel file
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="call-center-data-export.xlsx"');
header('Cache-Control: max-age=0');

// Include PhpSpreadsheet library
require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

// Get parameters
$provinceId = isset($_GET['province_id']) ? (int)$_GET['province_id'] : 0;
$startDate  = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y/m/d', strtotime('-7 days'));
$endDate    = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y/m/d');

// Validate token if needed
$headers = function_exists('getallheaders') ? getallheaders() : [];
$token = null;
if (isset($headers['Authorization'])) {
    $auth_header = $headers['Authorization'];
    if (strpos($auth_header, 'Bearer ') === 0) {
        $token = substr($auth_header, 7);
        // Validate token here if needed
        $auth = function_exists('getAuthenticatedUser') ? getAuthenticatedUser() : null;
        // If authenticated and province_id restricted (non-zero), override request
        if ($auth && isset($auth['province_id']) && (int)$auth['province_id'] !== 0) {
            $provinceId = (int)$auth['province_id'];
        }
    }
}

// -------------------- SQL SELECT PARTS --------------------

// SUM columns from daily table
$sumColumns = [
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
$sumParts = array_map(function ($c) {
    return sprintf('SUM(`%s`) AS `%s`', $c, $c);
}, $sumColumns);

// AVG columns from daily table
$avgColumns = [
    'call_completion_rate',
    'average_speed_of_answer_asa',
    'average_handle_time_aht',
    'service_level',
    'call_abandonment_rate',
    'answer_rate',
    'average_wait_time',
    'queue_calls',
    // 'fcr_rate',
];
$avgParts = array_map(function ($c) {
    return sprintf('AVG(`%s`) AS `%s`', $c, $c);
}, $avgColumns);

// transfer_date per province from tbl_ostan (safe with GROUP BY)
$transferDatePart = "MAX(o.`transfer_date`) AS `transfer_date`";

// Final SELECT fragment (used for per-province aggregation)
$select = implode(",\n        ", array_merge($sumParts, $avgParts)) . ",\n        " . $transferDatePart;

// -------------------- OUTPUT COLUMN MAP (ORDER MATTERS) --------------------
$outputColumns = [
    'province_name'                 => 'نام استان',
    'province_id'                   => 'شناسه استان',
    'transfer_date'                 => 'آخرین تاریخ انتقال',
    'total_number'                  => 'تعداد کل تماس‌ها',
    'number_answered_operator'      => 'تعداد تماس‌های پاسخ داده شده توسط اپراتور',
    'number_resulted_operation'     => 'تعداد تماس‌های منجر به عملیات',
    'number_answered'               => 'تماس‌های پاسخ داده شده',
    'number_unanswerd'              => 'تماس‌های بدون پاسخ',
    'number_failed'                 => 'تماس‌های ناموفق',
    'number_busy'                   => 'تماس‌های مشغول',
    'congestion'                    => 'تماس‌های ازدحام',
    'rightel'                       => 'رایتل',
    'irancell'                      => 'ایرانسل',
    'fixed'                         => 'ثابت',
    'unknown'                       => 'ناشناخته',
    'taliya'                        => 'تالیا',
    'espadan'                       => 'اسپادان',
    'mci'                           => 'همراه اول',
    'abandoned_calls'               => 'تماس‌های رها شده',
    'short_calls_less_than_5s'      => 'تماس‌های کوتاه (کمتر از ۵ ثانیه)',
    'answer_rate'                   => 'نرخ پاسخگویی (%)',
    'call_abandonment_rate'         => 'نرخ رها شدن تماس (%)',
    'service_level'                 => 'سطح سرویس (%)',
    // 'fcr_rate'                    => 'نرخ حل در اولین تماس (%)',
    'average_handle_time_aht'       => 'میانگین زمان مکالمه (ثانیه)',
    'average_wait_time'             => 'میانگین زمان انتظار (ثانیه)',
    'queue_calls'                   => 'تماس‌های در صف',
    'total_wait_time'               => 'کل زمان انتظار (ثانیه)',
];

try {
    $pdo = db();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = [];

    if ($provinceId === 0) {
        // All provinces + transfer_date from tbl_ostan, ordered by province name ASC
        $perSql = sprintf(
            "SELECT
                p.`%s` AS province_id,
                p.`%s` AS province_name,
                %s
             FROM `%s` p
             LEFT JOIN `%s` d
                ON p.`%s` = d.`%s`
               AND d.`%s` >= :start_date
               AND d.`%s` <= :end_date
             LEFT JOIN tbl_ostan o
                ON o.province_id = p.`%s`
             GROUP BY p.`%s`, p.`%s`
             ORDER BY p.`%s` ASC",
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
            PROVINCE_NAME_COLUMN,
            PROVINCE_NAME_COLUMN
        );

        $stmt = $pdo->prepare($perSql);
        $stmt->execute([
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // -------------------- Fetch external operations count via cURL --------------------
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
        if ($response && !$err) {
            $response = json_decode($response, true);
            if (is_array($response)) {
                foreach ($response as $item) {
                    if (isset($item['province_id'], $item['events_count'])) {
                        $operationsData[(string)$item['province_id']] = (int)$item['events_count'];
                    }
                }
            }
        }

        // ----- Grand Total (Summary) from daily table: SUM for sums + AVG for averages -----
        $totalsSelect = implode(",\n        ", array_merge($sumParts, $avgParts));
        $summarySqlAll = sprintf(
            "SELECT %s FROM `%s` d
             WHERE d.`%s` >= :start_date AND d.`%s` <= :end_date",
            $totalsSelect,
            DAILY_TABLE,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN
        );
        $stmtSum = $pdo->prepare($summarySqlAll);
        $stmtSum->execute([
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ]);
        $sumRow = $stmtSum->fetch(PDO::FETCH_ASSOC) ?: [];

        // Replace number_resulted_operation in summary with external total (if any)
        $sumOperation = 0;
        if (!empty($operationsData)) {
            foreach ($operationsData as $val) {
                $sumOperation += (int)$val;
            }
        }
        $sumRow['number_resulted_operation'] = $sumOperation;

        // Build grand total row (display fields aligned to $outputColumns)
        $summaryDisplayRow = array_fill_keys(array_keys($outputColumns), 0);
        foreach ($sumRow as $k => $v) {
            if (array_key_exists($k, $summaryDisplayRow)) {
                $summaryDisplayRow[$k] = $v;
            }
        }
        $summaryDisplayRow['province_name'] = 'جمع کل';
        $summaryDisplayRow['province_id']   = '-';
        $summaryDisplayRow['transfer_date'] = ''; // no single date for total

        $data[] = $summaryDisplayRow;

    } else {
        // Single province (with its transfer_date from tbl_ostan)
        $summarySql = sprintf(
            "SELECT
                p.`%s` AS province_id,
                p.`%s` AS province_name,
                %s
             FROM `%s` p
             LEFT JOIN `%s` d
                ON p.`%s` = d.`%s`
               AND d.`%s` >= :start_date
               AND d.`%s` <= :end_date
               AND d.`%s` = :province_id
             LEFT JOIN tbl_ostan o
                ON o.province_id = p.`%s`
             WHERE p.`%s` = :province_id
             GROUP BY p.`%s`, p.`%s`",
            PROVINCE_ID_COLUMN,
            PROVINCE_NAME_COLUMN,
            $select,
            PROVINCES_TABLE,
            DAILY_TABLE,
            PROVINCE_ID_COLUMN,
            DAILY_PROVINCE_ID_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_DATE_COLUMN,
            DAILY_PROVINCE_ID_COLUMN,
            PROVINCE_ID_COLUMN,
            PROVINCE_ID_COLUMN,
            PROVINCE_NAME_COLUMN
        );

        $stmt = $pdo->prepare($summarySql);
        $stmt->execute([
            ':province_id' => $provinceId,
            ':start_date'  => $startDate,
            ':end_date'    => $endDate,
        ]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // (Optional) اگر برای یک استان هم می‌خواهید از API خارجی مقدار عملیات را اعمال کنید،
        // اینجا مشابه حالت بالا Fetch کرده و در $data[0]['number_resulted_operation'] جایگزین نمایید.
    }

    // -------------------- EXCEL BUILD --------------------
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    // RTL for Persian
    $sheet->setRightToLeft(true);

    // Determine last column letter once (based on output columns)
    $lastColLetter = Coordinate::stringFromColumnIndex(count($outputColumns));

    // -------------------- TITLE ROW --------------------
    $title = "گزارش تماس های 112 برای بازه تاریخی {$startDate} تا {$endDate}";
    $sheet->setCellValue("A1", $title);
    $sheet->mergeCells("A1:{$lastColLetter}1");
    $sheet->getStyle("A1")->applyFromArray([
        'font' => ['bold' => true, 'size' => 14],
        'fill' => [
            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'FFF2CC'],
        ],
        'alignment' => [
            'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
            'vertical'   => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
        ],
    ]);
    $sheet->getRowDimension(1)->setRowHeight(28);

    // Header row should start at row 2
    $headerRowIndex = 2;

    // Header row
    $colIndex = 1;
    foreach ($outputColumns as $key => $titleText) {
        $colLetter = Coordinate::stringFromColumnIndex($colIndex);
        $sheet->setCellValue($colLetter . $headerRowIndex, $titleText);
        $colIndex++;
    }

    // Header style
    $headerStyle = [
        'font' => ['bold' => true],
        'fill' => [
            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
            'startColor' => ['rgb' => 'FFF2CC'],
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
            ],
        ],
        'alignment' => [
            'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
            'vertical'   => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
        ],
    ];
    $sheet->getStyle("A{$headerRowIndex}:{$lastColLetter}{$headerRowIndex}")->applyFromArray($headerStyle);
    $sheet->getRowDimension($headerRowIndex)->setRowHeight(22);

    // Data rows start from row 3
    $row = $headerRowIndex + 1;

    // External operations presence
    $hasExternalOps = isset($operationsData) && is_array($operationsData) && !empty($operationsData);

    foreach ($data as $record) {
        $colIndex = 1;
        foreach ($outputColumns as $key => $_title) {
            $colLetter = Coordinate::stringFromColumnIndex($colIndex);
            $value = $record[$key] ?? 0;

            // transfer_date: keep string & convert to Jalali if yyyy-mm-dd
            if ($key === 'transfer_date') {
                if ($value == 0) {
                    $value = '';
                } else if (is_string($value)) {
                    $arr = explode('-', $value);
                    if (count($arr) == 3) {
                        $value = gregorian_to_jalali((int)$arr[0], (int)$arr[1], (int)$arr[2], "/");
                    }
                }
            }

            // Override number_resulted_operation from external API (per province)
            if ($key === 'number_resulted_operation' && $hasExternalOps && isset($record['province_id'])) {
                $pidKey = (string)$record['province_id'];
                if (isset($operationsData[$pidKey])) {
                    $value = (int)$operationsData[$pidKey];
                }
            }

            $sheet->setCellValue($colLetter . $row, $value);
            $colIndex++;
        }
        $row++;
    }
    foreach ($avgColumns as $avgColKey) {
        $colIndex = array_search($avgColKey, array_keys($outputColumns)) + 1;
        if ($colIndex > 0) {
            $colLetter = Coordinate::stringFromColumnIndex($colIndex);
            // اعمال فرمت روی تمام ردیف‌های داده + ردیف جمع کل
            $sheet->getStyle("{$colLetter}3:{$colLetter}{$row}")
                  ->getNumberFormat()
                  ->setFormatCode('0.00');
        }
    }
    // Auto size columns
    for ($i = 1; $i <= count($outputColumns); $i++) {
        $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($i))->setAutoSize(true);
    }

    // Style the Grand Total row (only in all-province mode and if data exists)
    if ($provinceId === 0 && !empty($data)) {
        // total row is the last data row we just wrote (row - 1)
        $totalRowIdx = $row - 1;
        $totalRowRange = "A{$totalRowIdx}:{$lastColLetter}{$totalRowIdx}";
        $sheet->getStyle($totalRowRange)->applyFromArray([
            'font' => ['bold' => true],
            'fill' => [
                'fillType'   => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FFF2CC'],
            ],
            'borders' => [
                'top'       => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THICK],
                'allBorders'=> ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN],
            ],
        ]);
    }

    // Output
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');

} catch (Throwable $e) {
    header_remove('Content-Type');
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
}
