-- Users table for simple auth
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `province_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_province` (`province_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example admin (password: admin123) with all provinces access = 0
-- Change province_id to a real province code if needed.
INSERT INTO `users` (`username`, `password`, `province_id`) VALUES
('admin', '$2y$10$5eRk4u7N2d9M8bR0o3sNxebn6Q8S3Y7xD7xO6M2J5wKxI8m9JmXre', 0)
ON DUPLICATE KEY UPDATE username = username;


