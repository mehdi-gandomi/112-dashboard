<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

try {
    $pdo = db();
    $sql = sprintf(
        'SELECT %s AS id, %s AS name,code_ostan,province_id FROM %s ORDER BY %s ASC',
        PROVINCE_ID_COLUMN,
        PROVINCE_NAME_COLUMN,
        PROVINCES_TABLE,
        PROVINCE_NAME_COLUMN
    );
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();
    respondJson(['provinces' => $rows]);
} catch (Throwable $e) {
    respondJson(['error' => 'Failed to load provinces', 'details' => $e->getMessage()], 500);
}

