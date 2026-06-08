DROP DATABASE IF EXISTS vlu_enterprise_link;
CREATE DATABASE IF NOT EXISTS vlu_enterprise_link CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vlu_enterprise_link;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. clusters
CREATE TABLE IF NOT EXISTS clusters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. faculties
CREATE TABLE IF NOT EXISTS faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cluster_id INT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'FACULTY_MANAGER', 'LECTURER') DEFAULT 'LECTURER',
    faculty_id INT,
    tags VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. departments
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. scales (NEW)
CREATE TABLE IF NOT EXISTS scales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. fields (NEW)
CREATE TABLE IF NOT EXISTS fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. act_types (NEW)
CREATE TABLE IF NOT EXISTS act_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. targets (NEW)
CREATE TABLE IF NOT EXISTS targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. enterprises (UPDATED - normalized)
CREATE TABLE IF NOT EXISTS enterprises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(100),
    scale_id INT,
    is_hcmc BOOLEAN DEFAULT TRUE,
    status ENUM('Tiềm năng', 'Liên hệ', 'Đàm phán', 'Đề xuất', 'Đã ký hợp tác', 'Đang triển khai', 'Đã hoàn thành', 'Đã tạm ngưng') DEFAULT 'Tiềm năng',
    department_id INT,
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_ent_created (created_at),
    FOREIGN KEY (scale_id) REFERENCES scales(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. enterprise_representatives (NEW)
CREATE TABLE IF NOT EXISTS enterprise_representatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    title VARCHAR(50),
    full_name VARCHAR(255),
    role VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. enterprise_addresses (NEW)
CREATE TABLE IF NOT EXISTS enterprise_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    building_street VARCHAR(255),
    district VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Việt Nam',
    is_main BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. enterprise_fields junction (NEW)
CREATE TABLE IF NOT EXISTS enterprise_fields (
    enterprise_id INT NOT NULL,
    field_id INT NOT NULL,
    PRIMARY KEY (enterprise_id, field_id),
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. activities (UPDATED - removed type/description, added detail/collaboration_date)
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    detail TEXT,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    person_in_charge VARCHAR(255),
    tasks JSON,
    collaboration_date DATE,
    status ENUM('Đề xuất', 'Phê duyệt nội bộ', 'Đã triển khai', 'Đã kết thúc') DEFAULT 'Đề xuất',
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    INDEX idx_act_created (created_at),
    INDEX idx_act_ent (enterprise_id),
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. mous
CREATE TABLE IF NOT EXISTS mous (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mou_code VARCHAR(100) NOT NULL,
    enterprise_id INT NOT NULL,
    signing_date DATE,
    partner_contact VARCHAR(255),
    org_type VARCHAR(100),
    country VARCHAR(100),
    collaboration_scope TEXT,
    executing_unit_id INT NULL,
    vlu_contact VARCHAR(255),
    tasks_ay24_25 TEXT,
    next_steps TEXT,
    past_activities TEXT,
    related_data TEXT,
    working_dir VARCHAR(500),
    activity_id INT NULL,
    file_url VARCHAR(500),
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (executing_unit_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. activity_type_map junction (NEW)
CREATE TABLE IF NOT EXISTS activity_type_map (
    activity_id INT NOT NULL,
    type_id INT NOT NULL,
    PRIMARY KEY (activity_id, type_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES act_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. activity_target_map junction (NEW)
CREATE TABLE IF NOT EXISTS activity_target_map (
    activity_id INT NOT NULL,
    target_id INT NOT NULL,
    PRIMARY KEY (activity_id, target_id),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. students
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    class VARCHAR(100),
    major VARCHAR(100),
    advisor VARCHAR(255),
    activity_id INT,
    enterprise_id INT,
    position VARCHAR(255),
    status ENUM('Chờ phân công', 'Đang thực tập', 'Hoàn thành', 'Đã nghỉ') DEFAULT 'Chờ phân công',
    gpa DECIMAL(3,2),
    start_date DATE,
    end_date DATE,
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. workflow_history
CREATE TABLE IF NOT EXISTS workflow_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('ENTERPRISE', 'ACTIVITY') NOT NULL,
    entity_id INT NOT NULL,
    old_status VARCHAR(255) NOT NULL,
    new_status VARCHAR(255) NOT NULL,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. enterprise_ratings
CREATE TABLE IF NOT EXISTS enterprise_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    activity_id INT,
    user_type ENUM('LECTURER', 'STUDENT') DEFAULT 'LECTURER',
    overall_score INT NOT NULL,
    guidance_score INT,
    facilities_score INT,
    opportunities_score INT,
    coordination_score INT,
    internal_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. action_history
CREATE TABLE IF NOT EXISTS action_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE') NOT NULL,
    entity_type ENUM('ENTERPRISE', 'MOU', 'ACTIVITY', 'STUDENT') NOT NULL,
    entity_id INT NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    faculty_id INT NULL,
    changed_by INT NULL,
    old_value JSON DEFAULT NULL,
    new_value JSON DEFAULT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SEED DATA ====================

INSERT IGNORE INTO clusters (id, name) VALUES
(1, 'Khối Công nghệ & Kỹ thuật'),
(2, 'Khối Kinh tế & Quản lý'),
(3, 'Khối Xã hội & Ngôn ngữ');

INSERT IGNORE INTO faculties (id, cluster_id, name, code) VALUES
(1, 1, 'Khoa Công nghệ Thông tin', 'IT'),
(2, 2, 'Khoa Quản trị Kinh doanh', 'BA'),
(3, 3, 'Khoa Quan hệ Công chúng', 'PR'),
(4, 1, 'Khoa Kiến trúc', 'ARCH'),
(5, 1, 'Khoa Mỹ thuật', 'FA'),
(6, 1, 'Khoa Thiết kế Công nghiệp', 'ID'),
(7, 1, 'Khoa Thiết kế Đồ họa', 'GD'),
(8, 1, 'Khoa Thiết kế Nội thất', 'INT'),
(9, 1, 'Khoa Thiết kế Thời trang', 'FASH'),
(10, 1, 'Khoa Kỹ thuật Công trình', 'CE'),
(11, 1, 'Khoa Kỹ thuật Cơ - Điện tử', 'ME'),
(12, 2, 'Khoa Kinh tế', 'ECO'),
(13, 2, 'Khoa Marketing', 'MARK'),
(14, 2, 'Khoa Tài chính - Kế toán', 'FIN'),
(15, 2, 'Khoa Du lịch', 'TOUR'),
(16, 2, 'Khoa Khách sạn - Nhà hàng', 'HOTEL'),
(17, 3, 'Khoa Luật', 'LAW'),
(18, 3, 'Khoa Ngoại ngữ', 'ENG'),
(19, 3, 'Khoa Truyền thông & Báo chí', 'COMM'),
(20, 3, 'Khoa Tâm lý học', 'PSY'),
(21, 3, 'Khoa Điều dưỡng', 'NURS'),
(22, 3, 'Khoa Dược', 'PHARM');

INSERT IGNORE INTO users (id, full_name, email, password, role, faculty_id) VALUES
(1, 'System Admin', 'admin@vlu.edu.vn', '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy', 'ADMIN', NULL),
-- IT (id: 1)
(2, 'Quản lý Khoa Công nghệ Thông tin', 'manager.it@vlu.edu.vn', '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy', 'FACULTY_MANAGER', 1),
(3, 'Giảng viên Khoa Công nghệ Thông tin', 'lecturer.it@vlu.edu.vn', '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy', 'LECTURER', 1),
-- BA (id: 2)
(4, 'Quản lý Khoa Quản trị Kinh doanh', 'manager.ba@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 2),
(5, 'Giảng viên Khoa Quản trị Kinh doanh', 'lecturer.ba@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 2),
-- PR (id: 3)
(6, 'Quản lý Khoa Quan hệ Công chúng', 'manager.pr@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 3),
(7, 'Giảng viên Khoa Quan hệ Công chúng', 'lecturer.pr@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 3),
-- ARCH (id: 4)
(8, 'Quản lý Khoa Kiến trúc', 'manager.arch@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 4),
(9, 'Giảng viên Khoa Kiến trúc', 'lecturer.arch@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 4),
-- FA (id: 5)
(10, 'Quản lý Khoa Mỹ thuật', 'manager.fa@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 5),
(11, 'Giảng viên Khoa Mỹ thuật', 'lecturer.fa@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 5),
-- ID (id: 6)
(12, 'Quản lý Khoa Thiết kế Công nghiệp', 'manager.id@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 6),
(13, 'Giảng viên Khoa Thiết kế Công nghiệp', 'lecturer.id@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 6),
-- GD (id: 7)
(14, 'Quản lý Khoa Thiết kế Đồ họa', 'manager.gd@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 7),
(15, 'Giảng viên Khoa Thiết kế Đồ họa', 'lecturer.gd@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 7),
-- INT (id: 8)
(16, 'Quản lý Khoa Thiết kế Nội thất', 'manager.int@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 8),
(17, 'Giảng viên Khoa Thiết kế Nội thất', 'lecturer.int@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 8),
-- FASH (id: 9)
(18, 'Quản lý Khoa Thiết kế Thời trang', 'manager.fash@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 9),
(19, 'Giảng viên Khoa Thiết kế Thời trang', 'lecturer.fash@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 9),
-- CE (id: 10)
(20, 'Quản lý Khoa Kỹ thuật Công trình', 'manager.ce@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 10),
(21, 'Giảng viên Khoa Kỹ thuật Công trình', 'lecturer.ce@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 10),
-- ME (id: 11)
(22, 'Quản lý Khoa Kỹ thuật Cơ - Điện tử', 'manager.me@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 11),
(23, 'Giảng viên Khoa Kỹ thuật Cơ - Điện tử', 'lecturer.me@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 11),
-- ECO (id: 12)
(24, 'Quản lý Khoa Kinh tế', 'manager.eco@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 12),
(25, 'Giảng viên Khoa Kinh tế', 'lecturer.eco@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 12),
-- MARK (id: 13)
(26, 'Quản lý Khoa Marketing', 'manager.mark@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 13),
(27, 'Giảng viên Khoa Marketing', 'lecturer.mark@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 13),
-- FIN (id: 14)
(28, 'Quản lý Khoa Tài chính - Kế toán', 'manager.fin@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 14),
(29, 'Giảng viên Khoa Tài chính - Kế toán', 'lecturer.fin@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 14),
-- TOUR (id: 15)
(30, 'Quản lý Khoa Du lịch', 'manager.tour@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 15),
(31, 'Giảng viên Khoa Du lịch', 'lecturer.tour@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 15),
-- HOTEL (id: 16)
(32, 'Quản lý Khoa Khách sạn - Nhà hàng', 'manager.hotel@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 16),
(33, 'Giảng viên Khoa Khách sạn - Nhà hàng', 'lecturer.hotel@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 16),
-- LAW (id: 17)
(34, 'Quản lý Khoa Luật', 'manager.law@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 17),
(35, 'Giảng viên Khoa Luật', 'lecturer.law@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 17),
-- ENG (id: 18)
(36, 'Quản lý Khoa Ngoại ngữ', 'manager.eng@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 18),
(37, 'Giảng viên Khoa Ngoại ngữ', 'lecturer.eng@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 18),
-- COMM (id: 19)
(38, 'Quản lý Khoa Truyền thông & Báo chí', 'manager.comm@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 19),
(39, 'Giảng viên Khoa Truyền thông & Báo chí', 'lecturer.comm@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 19),
-- PSY (id: 20)
(40, 'Quản lý Khoa Tâm lý học', 'manager.psy@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 20),
(41, 'Giảng viên Khoa Tâm lý học', 'lecturer.psy@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 20),
-- NURS (id: 21)
(42, 'Quản lý Khoa Điều dưỡng', 'manager.nurs@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 21),
(43, 'Giảng viên Khoa Điều dưỡng', 'lecturer.nurs@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 21),
-- PHARM (id: 22)
(44, 'Quản lý Khoa Dược', 'manager.pharm@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'FACULTY_MANAGER', 22),
(45, 'Giảng viên Khoa Dược', 'lecturer.pharm@vlu.edu.vn', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'LECTURER', 22);

INSERT IGNORE INTO scales (id, name) VALUES
(1, 'Tier 1 (Tập đoàn/Global)'),
(2, 'Tier 2 (SME)'),
(3, 'Tier 3 (Startup/Micro)');

INSERT IGNORE INTO fields (id, name) VALUES
(1, 'Phần mềm & Outsource'),
(2, 'Giải pháp CNTT & Chuyển đổi số'),
(3, 'Hạ tầng & Viễn thông'),
(4, 'Tài chính & Fintech'),
(5, 'Phần cứng & Điện tử'),
(6, 'Marketing & Truyền thông'),
(7, 'Khác');

INSERT IGNORE INTO act_types (id, name) VALUES
(1, 'Tuyển dụng & Thực tập'),
(2, 'Hội thảo & Đào tạo'),
(3, 'Tài trợ & Học bổng'),
(4, 'Tham quan doanh nghiệp'),
(5, 'Kiểm định & Đánh giá'),
(6, 'Ký kết MOU'),
(7, 'Khác');

INSERT IGNORE INTO targets (id, name) VALUES
(1, 'Sinh viên năm 1'),
(2, 'Sinh viên năm 2'),
(3, 'Sinh viên năm 3'),
(4, 'Sinh viên năm 4'),
(5, 'Sinh viên mới tốt nghiệp'),
(6, 'Giảng viên'),
(7, 'Tất cả sinh viên');

INSERT IGNORE INTO enterprises (id, name, tax_code, scale_id, is_hcmc, status, faculty_id) VALUES
(1, 'FPT Software', '0304200420', 1, TRUE, 'Đang triển khai', 1),
(2, 'VNG Corporation', '0303456789', 1, TRUE, 'Đàm phán', 1),
(3, 'Unilever Vietnam', '0301112223', 2, TRUE, 'Đang triển khai', 2),
(4, 'Masan Group', '0309998887', 2, TRUE, 'Tiềm năng', 2);

INSERT IGNORE INTO enterprise_representatives (enterprise_id, title, full_name, role, phone, email, is_primary) VALUES
(1, 'Ông', 'Nguyễn Văn Hùng', 'HR Director', '02873004666', 'contact@fpt.com', TRUE),
(2, 'Bà', 'Trần Thị Lan', 'Talent Manager', '02811112222', 'contact@vng.com.vn', TRUE),
(3, 'Ông', 'Lê Văn Nam', 'HR Manager', '02833334444', 'hr@unilever.com', TRUE),
(4, 'Bà', 'Phạm Thị Hoa', 'Recruitment Lead', '02855556666', 'hr@masan.com', TRUE);

INSERT IGNORE INTO enterprise_addresses (enterprise_id, building_street, district, province, country, is_main) VALUES
(1, 'Tòa nhà FPT, Đường số 17A', 'Quận 9', 'TP. Hồ Chí Minh', 'Việt Nam', TRUE),
(2, '182 Lê Đại Hành', 'Quận 11', 'TP. Hồ Chí Minh', 'Việt Nam', TRUE),
(3, '156 Nguyễn Lương Bằng', 'Quận 7', 'TP. Hồ Chí Minh', 'Việt Nam', TRUE),
(4, '9-11 Đoàn Văn Bơ', 'Quận 4', 'TP. Hồ Chí Minh', 'Việt Nam', TRUE);

INSERT IGNORE INTO enterprise_fields (enterprise_id, field_id) VALUES
(1, 1), (2, 1), (2, 2), (3, 2), (3, 3), (4, 2);

INSERT IGNORE INTO activities (id, enterprise_id, title, detail, start_date, collaboration_date, status, faculty_id) VALUES
(1, 1, 'Tuyển dụng Fresher ReactJS', 'Tuyển dụng 50 sinh viên năm cuối ngành CNTT', '2024-05-10', '2024-04-01', 'Đã triển khai', 1),
(2, 1, 'Workshop: Định hướng nghề nghiệp IT', 'Chia sẻ kỹ năng phỏng vấn từ chuyên gia FPT', '2024-03-20', '2024-03-01', 'Đã triển khai', 1),
(3, 3, 'Thực tập sinh Marketing', 'Chương trình kỳ thực tập mùa hè 2024', '2024-06-01', NULL, 'Đề xuất', 2);

INSERT IGNORE INTO activity_type_map (activity_id, type_id) VALUES (1, 1), (2, 3), (3, 2);

INSERT IGNORE INTO mous (id, mou_code, enterprise_id, signing_date, partner_contact, org_type, country, collaboration_scope, executing_unit_id, vlu_contact, tasks_ay24_25, next_steps, past_activities, related_data, working_dir, activity_id, file_url, faculty_id) VALUES
(1, 'MOU-FPT-2024-001', 1, '2024-03-15', 'Ông Nguyễn Văn Hùng - HR Director', 'Tập đoàn Công nghệ', 'Việt Nam', 'Hợp tác đào tạo, thực tập sinh viên ngành CNTT; tổ chức hội thảo nghề nghiệp; tuyển dụng sinh viên tốt nghiệp; cung cấp học bổng cho sinh viên xuất sắc; chia sẻ chuyên gia giảng dạy và hướng dẫn luận văn tốt nghiệp.', NULL, 'ThS. Nguyễn Thị Hoa - Trưởng Ban Quan hệ Doanh nghiệp', 'Tuyển 50 thực tập sinh ReactJS/NodeJS học kỳ II/2024; tổ chức 2 buổi workshop định hướng nghề nghiệp (tháng 10 và tháng 12/2024); ký kết chương trình học bổng "FPT Talent" năm 2024.', 'Ký kết biên bản triển khai chi tiết Q2/2025; tổ chức Ngày hội Tuyển dụng FPT × VLU tháng 5/2025; mở rộng hợp tác sang ngành Trí tuệ Nhân tạo và Khoa học Dữ liệu.', 'Ký kết MOU lần đầu năm 2022; tổ chức 3 buổi hội thảo chuyên ngành CNTT (2022-2023); tiếp nhận 30 thực tập sinh mỗi năm học.', 'Đã tiếp nhận 120 sinh viên thực tập từ 2022-2024; 15 sinh viên nhận học bổng FPT Talent; 85% sinh viên được tuyển dụng chính thức sau thực tập.', NULL, 1, NULL, 1);

INSERT IGNORE INTO students (student_code, name, class, major, activity_id, faculty_id) VALUES
('207CT50111', 'Nguyễn Văn A', 'K26-IT1', 'Kỹ thuật Phần mềm', 1, 1),
('207CT50112', 'Trần Thị B', 'K26-IT2', 'Khoa học Máy tính', 1, 1),
('207BA50113', 'Lê Văn C', 'K27-BA1', 'Quản trị Marketing', 3, 2);
-- 21. tasks (NEW FOR KANBAN V2)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Cần làm', 'Đang thực hiện', 'Đang kiểm tra', 'Đã hoàn thành') DEFAULT 'Cần làm',
    priority ENUM('Thấp', 'Trung bình', 'Cao') DEFAULT 'Trung bình',
    due_date DATE DEFAULT NULL,
    assigned_to INT NULL,
    created_by INT NOT NULL,
    faculty_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. notes (NEW FOR KANBAN V2)
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) DEFAULT NULL,
    content TEXT NOT NULL,
    color VARCHAR(50) DEFAULT '#fef08a',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;