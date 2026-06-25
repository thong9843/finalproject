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
    name VARCHAR(255) NOT NULL,
    faculty_id INT DEFAULT 0
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

-- 17a. student_activities junction (NEW - many-to-many participation)
CREATE TABLE IF NOT EXISTS student_activities (
    student_id INT NOT NULL,
    activity_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, activity_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
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
    overall_score DECIMAL(3,2) NOT NULL,
    guidance_score INT,
    facilities_score INT,
    opportunities_score INT,
    coordination_score INT,
    internal_note TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
(22, 3, 'Khoa Dược', 'PHARM'),
(23, 3, 'Khoa Khoa học Cơ bản', 'BASIC'),
(24, 1, 'Khoa Môi trường - VLTECH', 'ENV'),
(25, 3, 'Khoa Xã hội Và Nhân văn', 'FSSH'),
(26, 1, 'Khoa Công nghệ ứng dụng - VLTECH', 'APT'),
(27, 1, 'Khoa Kỹ thuật Y học', 'MDT'),
(28, 1, 'Khoa Răng Hàm Mặt', 'DENT'),
(29, 1, 'Khoa Y', 'MED'),
(30, 3, 'Khoa Ngôn ngữ và Văn hóa Hàn Quốc', 'KOR'),
(31, 1, 'Khoa Kỹ Thuật và Quản lý Công nghiệp', 'IEM'),
(32, 2, 'Khoa Kế toán Kiểm toán', 'ACC');

INSERT IGNORE INTO users (id, full_name, email, password, role, faculty_id) VALUES
(1, 'System Admin', 'admin@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'ADMIN', NULL),
-- IT (id: 1)
(2, 'Quản lý Khoa Công nghệ Thông tin', 'manager.it@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 1),
(3, 'Giảng viên Khoa Công nghệ Thông tin', 'lecturer.it@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 1),
-- BA (id: 2)
(4, 'Quản lý Khoa Quản trị Kinh doanh', 'manager.ba@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 2),
(5, 'Giảng viên Khoa Quản trị Kinh doanh', 'lecturer.ba@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 2),
-- PR (id: 3)
(6, 'Quản lý Khoa Quan hệ Công chúng', 'manager.pr@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 3),
(7, 'Giảng viên Khoa Quan hệ Công chúng', 'lecturer.pr@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 3),
-- ARCH (id: 4)
(8, 'Quản lý Khoa Kiến trúc', 'manager.arch@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 4),
(9, 'Giảng viên Khoa Kiến trúc', 'lecturer.arch@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 4),
-- FA (id: 5)
(10, 'Quản lý Khoa Mỹ thuật', 'manager.fa@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 5),
(11, 'Giảng viên Khoa Mỹ thuật', 'lecturer.fa@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 5),
-- ID (id: 6)
(12, 'Quản lý Khoa Thiết kế Công nghiệp', 'manager.id@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 6),
(13, 'Giảng viên Khoa Thiết kế Công nghiệp', 'lecturer.id@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 6),
-- GD (id: 7)
(14, 'Quản lý Khoa Thiết kế Đồ họa', 'manager.gd@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 7),
(15, 'Giảng viên Khoa Thiết kế Đồ họa', 'lecturer.gd@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 7),
-- INT (id: 8)
(16, 'Quản lý Khoa Thiết kế Nội thất', 'manager.int@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 8),
(17, 'Giảng viên Khoa Thiết kế Nội thất', 'lecturer.int@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 8),
-- FASH (id: 9)
(18, 'Quản lý Khoa Thiết kế Thời trang', 'manager.fash@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 9),
(19, 'Giảng viên Khoa Thiết kế Thời trang', 'lecturer.fash@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 9),
-- CE (id: 10)
(20, 'Quản lý Khoa Kỹ thuật Công trình', 'manager.ce@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 10),
(21, 'Giảng viên Khoa Kỹ thuật Công trình', 'lecturer.ce@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 10),
-- ME (id: 11)
(22, 'Quản lý Khoa Kỹ thuật Cơ - Điện tử', 'manager.me@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 11),
(23, 'Giảng viên Khoa Kỹ thuật Cơ - Điện tử', 'lecturer.me@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 11),
-- ECO (id: 12)
(24, 'Quản lý Khoa Kinh tế', 'manager.eco@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 12),
(25, 'Giảng viên Khoa Kinh tế', 'lecturer.eco@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 12),
-- MARK (id: 13)
(26, 'Quản lý Khoa Marketing', 'manager.mark@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 13),
(27, 'Giảng viên Khoa Marketing', 'lecturer.mark@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 13),
-- FIN (id: 14)
(28, 'Quản lý Khoa Tài chính - Kế toán', 'manager.fin@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 14),
(29, 'Giảng viên Khoa Tài chính - Kế toán', 'lecturer.fin@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 14),
-- TOUR (id: 15)
(30, 'Quản lý Khoa Du lịch', 'manager.tour@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 15),
(31, 'Giảng viên Khoa Du lịch', 'lecturer.tour@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 15),
-- HOTEL (id: 16)
(32, 'Quản lý Khoa Khách sạn - Nhà hàng', 'manager.hotel@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 16),
(33, 'Giảng viên Khoa Khách sạn - Nhà hàng', 'lecturer.hotel@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 16),
-- LAW (id: 17)
(34, 'Quản lý Khoa Luật', 'manager.law@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 17),
(35, 'Giảng viên Khoa Luật', 'lecturer.law@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 17),
-- ENG (id: 18)
(36, 'Quản lý Khoa Ngoại ngữ', 'manager.eng@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 18),
(37, 'Giảng viên Khoa Ngoại ngữ', 'lecturer.eng@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 18),
-- COMM (id: 19)
(38, 'Quản lý Khoa Truyền thông & Báo chí', 'manager.comm@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 19),
(39, 'Giảng viên Khoa Truyền thông & Báo chí', 'lecturer.comm@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 19),
-- PSY (id: 20)
(40, 'Quản lý Khoa Tâm lý học', 'manager.psy@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 20),
(41, 'Giảng viên Khoa Tâm lý học', 'lecturer.psy@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 20),
-- NURS (id: 21)
(42, 'Quản lý Khoa Điều dưỡng', 'manager.nurs@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 21),
(43, 'Giảng viên Khoa Điều dưỡng', 'lecturer.nurs@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 21),
-- PHARM (id: 22)
(44, 'Quản lý Khoa Dược', 'manager.pharm@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 22),
(45, 'Giảng viên Khoa Dược', 'lecturer.pharm@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 22),
-- BASIC (id: 23)
(46, 'Quản lý Khoa Khoa học Cơ bản', 'manager.basic@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 23),
(47, 'Giảng viên Khoa Khoa học Cơ bản', 'lecturer.basic@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 23),
-- ENV (id: 24)
(48, 'Quản lý Khoa Môi trường - VLTECH', 'manager.env@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 24),
(49, 'Giảng viên Khoa Môi trường - VLTECH', 'lecturer.env@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 24),
-- FSSH (id: 25)
(50, 'Quản lý Khoa Xã hội Và Nhân văn', 'manager.fssh@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 25),
(51, 'Giảng viên Khoa Xã hội Và Nhân văn', 'lecturer.fssh@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 25),
-- APT (id: 26)
(52, 'Quản lý Khoa Công nghệ ứng dụng - VLTECH', 'manager.apt@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 26),
(53, 'Giảng viên Khoa Công nghệ ứng dụng - VLTECH', 'lecturer.apt@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 26),
-- MDT (id: 27)
(54, 'Quản lý Khoa Kỹ thuật Y học', 'manager.mdt@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 27),
(55, 'Giảng viên Khoa Kỹ thuật Y học', 'lecturer.mdt@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 27),
-- DENT (id: 28)
(56, 'Quản lý Khoa Răng Hàm Mặt', 'manager.dent@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 28),
(57, 'Giảng viên Khoa Răng Hàm Mặt', 'lecturer.dent@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 28),
-- MED (id: 29)
(58, 'Quản lý Khoa Y', 'manager.med@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 29),
(59, 'Giảng viên Khoa Y', 'lecturer.med@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 29),
-- KOR (id: 30)
(60, 'Quản lý Khoa Ngôn ngữ và Văn hóa Hàn Quốc', 'manager.kor@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 30),
(61, 'Giảng viên Khoa Ngôn ngữ và Văn hóa Hàn Quốc', 'lecturer.kor@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 30),
-- IEM (id: 31)
(62, 'Quản lý Khoa Kỹ Thuật và Quản lý Công nghiệp', 'manager.iem@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 31),
(63, 'Giảng viên Khoa Kỹ Thuật và Quản lý Công nghiệp', 'lecturer.iem@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 31),
-- ACC (id: 32)
(64, 'Quản lý Khoa Kế toán Kiểm toán', 'manager.acc@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'FACULTY_MANAGER', 32),
(65, 'Giảng viên Khoa Kế toán Kiểm toán', 'lecturer.acc@vlu.edu.vn', '$2b$10$NAO3LBQuVGlv/47lZGXsq.jVL0zAgF/SLuUL8uueNjgxWDY8A2Rn.', 'LECTURER', 32);

INSERT IGNORE INTO scales (id, name) VALUES
(1, 'Tier 1 (Tập đoàn/Global)'),
(2, 'Tier 2 (SME)'),
(3, 'Tier 3 (Startup/Micro)');

-- Lĩnh vực/Ngành nghề chung (faculty_id = 0 => toàn hệ thống)
INSERT IGNORE INTO fields (id, name, faculty_id) VALUES
(1,  'Phần mềm & Outsource',              0),
(2,  'Giải pháp CNTT & Chuyển đổi số',    0),
(3,  'Hạ tầng & Viễn thông',              0),
(4,  'Tài chính & Fintech',               0),
(5,  'Phần cứng & Điện tử',               0),
(6,  'Marketing & Truyền thông',           0),
(7,  'Xây dựng & Kiến trúc',              0),
(8,  'Thiết kế & Mỹ thuật',               0),
(9,  'Y tế & Chăm sóc sức khỏe',          0),
(10, 'Du lịch & Nhà hàng - Khách sạn',    0),
(11, 'Giáo dục & Đào tạo',               0),
(12, 'Pháp lý & Tư vấn',                  0),
(13, 'Thương mại & Logistics',            0),
(14, 'Khác',                              0),
-- Lĩnh vực riêng Khoa Công nghệ Thông tin (faculty_id = 1)
(101, 'Phát triển Phần mềm (Web/Mobile)',         1),
(102, 'Trí tuệ Nhân tạo & Học máy',              1),
(103, 'An toàn Thông tin & Bảo mật Mạng',        1),
(104, 'Khoa học Dữ liệu & Phân tích',            1),
(105, 'Điện toán Đám mây & DevOps',              1),
-- Lĩnh vực riêng Khoa Quản trị Kinh doanh (faculty_id = 2)
(201, 'Quản trị Doanh nghiệp & Nhân sự',         2),
(202, 'Kinh doanh Quốc tế & Xuất nhập khẩu',     2),
(203, 'Chuỗi Cung ứng & Logistics',              2),
(204, 'Khởi nghiệp & Đổi mới sáng tạo',          2),
-- Lĩnh vực riêng Khoa Quan hệ Công chúng (faculty_id = 3)
(301, 'Tổ chức Sự kiện & MICE',                  3),
(302, 'Quan hệ Truyền thông & Báo chí',           3),
(303, 'Quảng bá Thương hiệu & PR Số',            3),
-- Lĩnh vực riêng Khoa Kiến trúc (faculty_id = 4)
(401, 'Thiết kế Kiến trúc Công trình',            4),
(402, 'Quy hoạch Đô thị & Cảnh quan',            4),
(403, 'Thiết kế Nội ngoại thất Không gian',       4),
-- Lĩnh vực riêng Khoa Mỹ thuật (faculty_id = 5)
(501, 'Hội họa & Điêu khắc Tạo hình',            5),
(502, 'Mỹ thuật Ứng dụng & Illustration',        5),
(503, 'Nghệ thuật Thị giác & Triển lãm',          5),
-- Lĩnh vực riêng Khoa Thiết kế Công nghiệp (faculty_id = 6)
(601, 'Thiết kế Sản phẩm Công nghiệp',           6),
(602, 'Thiết kế Bao bì & Kiểu dáng Hàng tiêu dùng', 6),
(603, 'Tạo mẫu Nhanh & In 3D',                   6),
-- Lĩnh vực riêng Khoa Thiết kế Đồ họa (faculty_id = 7)
(701, 'Thiết kế Đồ họa & Nhận diện Thương hiệu', 7),
(702, 'Thiết kế UI/UX & Truyền thông Số',        7),
(703, 'Sản xuất Nội dung Sáng tạo & Motion',     7),
-- Lĩnh vực riêng Khoa Thiết kế Nội thất (faculty_id = 8)
(801, 'Thiết kế Nội thất Nhà ở & Thương mại',    8),
(802, 'Trang trí Không gian & Phong thủy',        8),
(803, 'Sản xuất Nội thất Gỗ & Vật liệu xây dựng', 8),
-- Lĩnh vực riêng Khoa Thiết kế Thời trang (faculty_id = 9)
(901, 'Thiết kế Thời trang & May mặc cao cấp',   9),
(902, 'Công nghệ Dệt may & Phụ liệu thời trang', 9),
(903, 'Thương mại Thời trang & Bán lẻ',          9),
-- Lĩnh vực riêng Khoa Kỹ thuật Công trình (faculty_id = 10)
(1001, 'Thi công & Quản lý Dự án Xây dựng',     10),
(1002, 'Vật liệu Xây dựng & Kết cấu Công trình', 10),
(1003, 'Hạ tầng Giao thông & Thủy lợi',         10),
-- Lĩnh vực riêng Khoa Kỹ thuật Cơ - Điện tử (faculty_id = 11)
(1101, 'Tự động hóa & Robotics',                11),
(1102, 'Kỹ thuật Điện & Điện tử',               11),
(1103, 'Thiết bị Công nghiệp & IoT',            11),
-- Lĩnh vực riêng Khoa Kinh tế (faculty_id = 12)
(1201, 'Phân tích Kinh tế & Nghiên cứu Thị trường', 12),
(1202, 'Thương mại Quốc tế & Chính sách Kinh tế', 12),
(1203, 'Đầu tư & Quản lý Tài sản',              12),
-- Lĩnh vực riêng Khoa Marketing (faculty_id = 13)
(1301, 'Digital Marketing & Social Media',      13),
(1302, 'Nghiên cứu Hành vi Tiêu dùng & CRM',    13),
(1303, 'Quảng cáo Đa kênh & Performance Ads',   13),
-- Lĩnh vực riêng Khoa Tài chính - Kế toán (faculty_id = 14)
(1401, 'Kiểm toán & Dịch vụ Kế toán',           14),
(1402, 'Ngân hàng & Dịch vụ Tài chính',         14),
(1403, 'Fintech & Thanh toán Điện tử',           14),
-- Lĩnh vực riêng Khoa Du lịch (faculty_id = 15)
(1501, 'Lữ hành & Điều hành Tour',               15),
(1502, 'Du lịch Sinh thái & Cộng đồng',          15),
(1503, 'Hướng dẫn Du lịch Quốc tế',             15),
-- Lĩnh vực riêng Khoa Khách sạn - Nhà hàng (faculty_id = 16)
(1601, 'Quản lý Khách sạn & Resort',             16),
(1602, 'Ẩm thực & Dịch vụ Nhà hàng',            16),
(1603, 'Tổ chức Tiệc & Dịch vụ Lưu trú',        16),
-- Lĩnh vực riêng Khoa Luật (faculty_id = 17)
(1701, 'Luật Doanh nghiệp & Thương mại',         17),
(1702, 'Luật Lao động & Bảo hiểm Xã hội',        17),
(1703, 'Luật Quốc tế & Trọng tài Thương mại',    17),
-- Lĩnh vực riêng Khoa Ngoại ngữ (faculty_id = 18)
(1801, 'Dạy học Tiếng Anh & Chứng chỉ Quốc tế', 18),
(1802, 'Biên dịch & Phiên dịch Thương mại',      18),
(1803, 'Bản địa hóa & Văn hóa Đa ngôn ngữ',      18),
-- Lĩnh vực riêng Khoa Truyền thông & Báo chí (faculty_id = 19)
(1901, 'Báo chí & Sản xuất Nội dung Tin tức',    19),
(1902, 'Truyền thông Đa phương tiện & Podcast',   19),
(1903, 'Sản xuất Phim & Hậu kỳ',                 19),
-- Lĩnh vực riêng Khoa Tâm lý học (faculty_id = 20)
(2001, 'Tham vấn Tâm lý Học đường',              20),
(2002, 'Trị liệu Tâm lý Lâm sàng',               20),
(2003, 'Phát triển Kỹ năng Sống & Đào tạo Nhân lực', 20),
-- Lĩnh vực riêng Khoa Điều dưỡng (faculty_id = 21)
(2101, 'Chăm sóc Điều dưỡng Bệnh viện',          21),
(2102, 'Chăm sóc Sức khỏe Người cao tuổi',       21),
(2103, 'Điều dưỡng Cộng đồng & Y tế Dự phòng',   21),
-- Lĩnh vực riêng Khoa Dược (faculty_id = 22)
(2201, 'Dược lâm sàng & Tư vấn Dùng thuốc',      22),
(2202, 'Nghiên cứu & Sản xuất Dược phẩm',        22),
(2203, 'Kiểm nghiệm Dược liệu & Hóa dược',       22);

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
    enterprise_id INT DEFAULT NULL,
    activity_id INT DEFAULT NULL,
    mou_id INT DEFAULT NULL,
    student_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) DEFAULT 0,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (mou_id) REFERENCES mous(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;