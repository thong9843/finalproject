-- Expand enterprises.status enum to include new values
ALTER TABLE enterprises MODIFY COLUMN status ENUM(
    'Tiềm năng', 'Đang đàm phán', 'Đang hợp tác', 'Đã ngừng',
    'Liên hệ', 'Đàm phán', 'Đề xuất', 'Đã ký hợp tác', 'Đang triển khai', 'Đã hoàn thành', 'Đã tạm ngưng'
) DEFAULT 'Tiềm năng';

-- Update records
UPDATE enterprises SET status = 'Đàm phán' WHERE status = 'Đang đàm phán';
UPDATE enterprises SET status = 'Đang triển khai' WHERE status = 'Đang hợp tác';
UPDATE enterprises SET status = 'Đã tạm ngưng' WHERE status = 'Đã ngừng';

-- Shrink enterprises.status enum to only new values
ALTER TABLE enterprises MODIFY COLUMN status ENUM(
    'Tiềm năng', 'Liên hệ', 'Đàm phán', 'Đề xuất', 'Đã ký hợp tác', 'Đang triển khai', 'Đã hoàn thành', 'Đã tạm ngưng'
) DEFAULT 'Tiềm năng';

-- Expand activities.status enum to include new values
ALTER TABLE activities MODIFY COLUMN status ENUM(
    'Tiềm năng', 'Đã triển khai',
    'Đề xuất', 'Phê duyệt nội bộ', 'Đã kết thúc'
) DEFAULT 'Đề xuất';

-- Update records
UPDATE activities SET status = 'Đề xuất' WHERE status = 'Tiềm năng';

-- Shrink activities.status enum to only new values
ALTER TABLE activities MODIFY COLUMN status ENUM(
    'Đề xuất', 'Phê duyệt nội bộ', 'Đã triển khai', 'Đã kết thúc'
) DEFAULT 'Đề xuất';

-- Create workflow_history table
CREATE TABLE IF NOT EXISTS workflow_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('ENTERPRISE', 'ACTIVITY') NOT NULL,
    entity_id INT NOT NULL,
    old_status VARCHAR(255) NOT NULL,
    new_status VARCHAR(255) NOT NULL,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);
