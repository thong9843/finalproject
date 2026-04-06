CREATE DATABASE IF NOT EXISTS vlu_enterprise_link;

USE vlu_enterprise_link;

-- 1. faculties
CREATE TABLE IF NOT EXISTS faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
);

-- 2. users
-- Role: ADMIN, FACULTY_MANAGER, LECTURER
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM(
        'ADMIN',
        'FACULTY_MANAGER',
        'LECTURER'
    ) NOT NULL,
    faculty_id INT,
    FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE SET NULL
);

-- 3. enterprises
-- status: 'Tiềm năng', 'Đang đàm phán', 'Đang hợp tác', 'Đã ngừng'
CREATE TABLE IF NOT EXISTS enterprises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(100) NOT NULL,
    industry VARCHAR(255),
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    status ENUM(
        'Tiềm năng',
        'Đang đàm phán',
        'Đang hợp tác',
        'Đã ngừng'
    ) DEFAULT 'Tiềm năng',
    collaboration_date DATE NULL,
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE
);

-- 4. activities
-- type: 'Tuyển dụng việc làm', 'Tuyển dụng thực tập', 'Tặng hoa 20/11', 'Tham quan công ty', 'Workshop', 'Khác'
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM(
        'Tuyển dụng việc làm',
        'Tuyển dụng thực tập',
        'Tặng hoa 20/11',
        'Tham quan công ty',
        'Workshop',
        'Khác'
    ) NOT NULL,
    description TEXT,
    start_date DATE,
    status ENUM('Tiềm năng', 'Đã triển khai') DEFAULT 'Tiềm năng',
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises (id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties (id) ON DELETE CASCADE
);

-- 5. students
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(100),
    major VARCHAR(100),
    activity_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
);

-- INSERT SEED DATA
-- Password for all is '123456' ($2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW)

INSERT IGNORE INTO
    faculties (id, name, code)
VALUES (
        1,
        'Khoa Công nghệ Thông tin',
        'IT'
    ),
    (
        2,
        'Khoa Quản trị Kinh doanh',
        'BA'
    ),
    (
        3,
        'Khoa Quan hệ Công chúng',
        'PR'
    );

INSERT IGNORE INTO
    users (
        id,
        full_name,
        email,
        password,
        role,
        faculty_id
    )
VALUES (
        1,
        'System Admin',
        'admin@vlu.edu.vn',
        '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy',
        'ADMIN',
        NULL
    ),
    (
        2,
        'IT Manager',
        'manager.it@vlu.edu.vn',
        '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy',
        'FACULTY_MANAGER',
        1
    ),
    (
        3,
        'IT Lecturer',
        'lecturer.it@vlu.edu.vn',
        '$2b$10$9FfmKHRV6ffkngWroSCTt.ha.L2GDuFCjxHtqxgMoJfUfHxx5tamy',
        'LECTURER',
        1
    ),
    (
        4,
        'BA Manager',
        'manager.ba@vlu.edu.vn',
        '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        'FACULTY_MANAGER',
        2
    );

INSERT IGNORE INTO
    enterprises (
        id,
        name,
        tax_code,
        industry,
        address,
        email,
        phone,
        status,
        collaboration_date,
        faculty_id
    )
VALUES (
        1,
        'FPT Software',
        '0304200420',
        'Công nghệ thông tin',
        'Quận 9, TP.HCM',
        'contact@fpt.com',
        '02873004666',
        'Đang hợp tác',
        '2023-01-15',
        1
    ),
    (
        2,
        'VNG Corporation',
        '0303456789',
        'Công nghệ thông tin',
        'Quận 7, TP.HCM',
        'contact@vng.com.vn',
        '02811112222',
        'Đang đàm phán',
        NULL,
        1
    ),
    (
        3,
        'Unilever Vietnam',
        '0301112223',
        'FMCG',
        'Quận 7, TP.HCM',
        'hr@unilever.com',
        '02833334444',
        'Đang hợp tác',
        '2022-11-20',
        2
    ),
    (
        4,
        'Masan Group',
        '0309998887',
        'Bán lẻ',
        'Quận 1, TP.HCM',
        'hr@masan.com',
        '02855556666',
        'Tiềm năng',
        NULL,
        2
    );

INSERT IGNORE INTO
    activities (
        id,
        enterprise_id,
        title,
        type,
        description,
        start_date,
        status,
        faculty_id
    )
VALUES (
        1,
        1,
        'Tuyển dụng Fresher ReactJS',
        'Tuyển dụng việc làm',
        'Tuyển dụng 50 sinh viên năm cuối',
        '2024-05-10',
        'Đã triển khai',
        1
    ),
    (
        2,
        1,
        'Workshop: Định hướng nghề nghiệp IT',
        'Workshop',
        'Chia sẻ kỹ năng phỏng vấn từ chuyên gia FPT',
        '2024-03-20',
        'Đã triển khai',
        1
    ),
    (
        3,
        3,
        'Thực tập sinh Marketing',
        'Tuyển dụng thực tập',
        'Chương trình kỳ thực tập mùa hè 2024',
        '2024-06-01',
        'Tiềm năng',
        2
    );

INSERT IGNORE INTO
    students (
        student_code,
        name,
        class,
        major,
        activity_id
    )
VALUES (
        '207CT50111',
        'Nguyễn Văn A',
        'K26-IT1',
        'Kỹ thuật Phần mềm',
        1
    ),
    (
        '207CT50112',
        'Trần Thị B',
        'K26-IT2',
        'Khoa học Máy tính',
        1
    ),
    (
        '207BA50113',
        'Lê Văn C',
        'K27-BA1',
        'Quản trị Marketing',
        3
    );