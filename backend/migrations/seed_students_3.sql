-- ============================================================
-- SEED DATA 3: 30 More Students
-- Linking to various enterprises and activities
-- ============================================================

INSERT INTO students 
    (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id)
VALUES
-- Đang thực tập (10 SV)
('217CT27001', 'Nguyễn Thái Sơn',      'son.nt217ct@vlu.edu.vn',    'K27-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     1, 2, 'Golang Intern',                'Đang thực tập', 3.30, '2025-04-15', '2025-10-15', 1),
('217CT27002', 'Lê Hoài Nam',         'nam.lh217ct@vlu.edu.vn',     'K27-CNTT2', 'Khoa học Máy tính',  'ThS. Lê Thanh Hà',      2, 2, 'Embedded C Intern',           'Đang thực tập', 3.45, '2025-04-15', '2025-10-15', 1),
('217CT27003', 'Phạm Minh Khôi',      'khoi.pm217ct@vlu.edu.vn',    'K27-CNTT3', 'Hệ thống Thông tin', 'TS. Nguyễn Minh Đức',   6, 4, 'Business Analyst Intern',      'Đang thực tập', 3.10, '2025-04-01', '2025-09-30', 1),
('217CT27004', 'Trần Phương Thùy',    'thuy.tp217ct@vlu.edu.vn',    'K27-CNTT4', 'An toàn Thông tin',  'ThS. Trần Quốc Bảo',    7, 5, 'Network Security Intern',     'Đang thực tập', 3.60, '2025-04-01', '2025-09-30', 1),
('217CT27005', 'Đỗ Gia Huy',          'huy.dg217ct@vlu.edu.vn',     'K27-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     8, 6, 'DevOps Intern',               'Đang thực tập', 3.25, '2025-03-25', '2025-09-25', 1),
('217CT27006', 'Vũ Anh Thư',          'thu.va217ct@vlu.edu.vn',     'K27-CNTT2', 'Khoa học Máy tính',  'ThS. Lê Thanh Hà',      10, 7, 'Flutter Intern',              'Đang thực tập', 3.80, '2025-04-01', '2025-09-30', 1),
('217CT27007', 'Hoàng Bảo Long',      'long.hb217ct@vlu.edu.vn',    'K27-CNTT3', 'Hệ thống Thông tin', 'TS. Nguyễn Minh Đức',   11, 8, 'Data Analyst Intern',        'Đang thực tập', 3.40, '2025-04-05', '2025-10-05', 1),
('217CT27008', 'Ngô Kiến Huy',        'huy.nk217ct@vlu.edu.vn',     'K27-CNTT4', 'An toàn Thông tin',  'ThS. Trần Quốc Bảo',    13, 9, 'Security Analyst Intern',    'Đang thực tập', 2.95, '2025-04-01', '2025-09-30', 1),
('217CT27009', 'Đặng Thành Đô',       'do.dt217ct@vlu.edu.vn',      'K27-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     14, 10, 'Laravel Intern',             'Đang thực tập', 3.15, '2025-04-01', '2025-09-30', 1),
('217CT27010', 'Bùi Nhật Minh',       'minh.bn217ct@vlu.edu.vn',    'K27-CNTT2', 'Khoa học Máy tính',  'ThS. Lê Thanh Hà',      15, 11, 'Python Intern',              'Đang thực tập', 3.50, '2025-04-01', '2025-09-30', 1),

-- Hoàn thành (10 SV)
('207CT25011', 'Lê Bảo Trâm',         'tram.lb207ct@vlu.edu.vn',    'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   18, 13, 'System Engineer Intern',     'Hoàn thành',    3.70, '2024-09-01', '2025-02-28', 1),
('207CT25012', 'Nguyễn Gia Bảo',      'bao.ng207ct@vlu.edu.vn',     'K26-CNTT2', 'Khoa học Máy tính',  'ThS. Trần Quốc Bảo',    19, 14, 'Software Tester Intern',     'Hoàn thành',    3.30, '2024-09-01', '2025-02-28', 1),
('207CT25013', 'Phạm Quỳnh Anh',      'anh.pq207ct@vlu.edu.vn',     'K26-CNTT3', 'Hệ thống Thông tin', 'TS. Phạm Văn Hùng',     20, 15, 'Marketing Intern (Tech)',    'Hoàn thành',    3.55, '2024-08-15', '2025-02-15', 1),
('207CT25014', 'Vũ Quang Minh',       'minh.vq207ct@vlu.edu.vn',     'K26-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      22, 17, 'Cyber Security Intern',      'Hoàn thành',    3.20, '2024-09-01', '2025-02-28', 1),
('207CT25015', 'Trần Nhật Hạ',        'ha.tn207ct@vlu.edu.vn',      'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   24, 19, 'Project Admin Intern',       'Hoàn thành',    3.65, '2024-08-01', '2025-01-31', 1),
('207CT25016', 'Lý Quốc Việt',        'viet.lq207ct@vlu.edu.vn',    'K26-CNTT2', 'Khoa học Máy tính',  'ThS. Trần Quốc Bảo',    25, 20, 'Software Dev Intern',        'Hoàn thành',    3.10, '2024-09-01', '2025-02-28', 1),
('207CT25017', 'Đặng Mỹ Linh',        'linh.dm207ct@vlu.edu.vn',    'K26-CNTT3', 'Hệ thống Thông tin', 'TS. Phạm Văn Hùng',     27, 21, 'IT Support Intern',          'Hoàn thành',    3.40, '2024-08-15', '2025-02-15', 1),
('207CT25018', 'Nguyễn Tấn Tài',      'tai.nt207ct@vlu.edu.vn',     'K26-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      29, 22, 'Security Intern',            'Hoàn thành',    3.85, '2024-09-01', '2025-02-28', 1),
('207CT25019', 'Hoàng Phi Hùng',      'hung.hp207ct@vlu.edu.vn',    'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   31, 24, 'Java Web Intern',            'Hoàn thành',    3.05, '2024-08-01', '2025-01-31', 1),
('207CT25020', 'Trịnh Cẩm Tú',        'tu.tc207ct@vlu.edu.vn',      'K26-CNTT2', 'Khoa học Máy tính',  'ThS. Trần Quốc Bảo',    32, 25, 'Python Dev Intern',          'Hoàn thành',    3.25, '2024-09-01', '2025-02-28', 1),

-- Chờ phân công (5 SV)
('227CT28021', 'Dương Minh Hạnh',     'hanh.dm227ct@vlu.edu.vn',    'K28-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      NULL, NULL, NULL,                        'Chờ phân công', 3.60, NULL,         NULL,         1),
('227CT28022', 'Kiều Ánh Tuyết',      'tuyet.ka227ct@vlu.edu.vn',   'K28-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     NULL, NULL, NULL,                        'Chờ phân công', 3.40, NULL,         NULL,         1),
('227CT28023', 'Vương Kiến Quốc',     'quoc.vk227ct@vlu.edu.vn',    'K28-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   NULL, NULL, NULL,                        'Chờ phân công', 2.90, NULL,         NULL,         1),
('227CT28024', 'Tạ Minh Tâm',         'tam.tm227ct@vlu.edu.vn',     'K28-CNTT3', 'Hệ thống Thông tin', 'ThS. Trần Quốc Bảo',    NULL, NULL, NULL,                        'Chờ phân công', 3.15, NULL,         NULL,         1),
('227CT28025', 'Nhan Văn Nghĩa',      'nghia.nv227ct@vlu.edu.vn',   'K28-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     NULL, NULL, NULL,                        'Chờ phân công', 3.75, NULL,         NULL,         1),

-- Đã nghỉ (5 SV)
('207CT23826', 'Thái Quốc Bảo',       'bao.tq207ct@vlu.edu.vn',     'K25-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   33, 26, 'Intern',                         'Đã nghỉ',       2.50, '2024-02-01', '2024-04-01', 1),
('207CT23827', 'Phan Hoài Thương',    'thuong.ph207ct@vlu.edu.vn',  'K25-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Trần Quốc Bảo',    34, 27, 'Intern',                         'Đã nghỉ',       2.35, '2024-02-15', '2024-05-01', 1),
('207CT23828', 'Đỗ Thành Vinh',       'vinh.dt207ct@vlu.edu.vn',    'K25-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      35, 27, 'Intern',                         'Đã nghỉ',       2.25, '2024-01-20', '2024-03-20', 1),
('207CT23829', 'Trần Thị Thúy',       'thuy.tt207ct@vlu.edu.vn',    'K25-CNTT4', 'An toàn Thông tin',  'TS. Phạm Văn Hùng',     37, 28, 'Intern',                         'Đã nghỉ',       2.60, '2024-02-01', '2024-04-15', 1),
('207CT23830', 'Nguyễn Hữu Đạt',      'dat.nh207ct@vlu.edu.vn',     'K25-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Trần Quốc Bảo',    38, 28, 'Intern',                         'Đã nghỉ',       2.45, '2024-02-10', '2024-04-10', 1);
