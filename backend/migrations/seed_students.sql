-- ============================================================
-- SEED DATA: 30 Students (Sinh viên thực tập mẫu)
-- Gắn với enterprise_id và activity_id từ Output_DB
-- Faculty 1 = Khoa CNTT
-- ============================================================

INSERT INTO students 
    (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id)
VALUES
-- Đang thực tập (10 SV)
('217CT25001', 'Nguyễn Văn An',       'an.nv217ct@vlu.edu.vn',       'K27-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   11,  8,  'Backend Developer Intern',      'Đang thực tập', 3.20, '2025-02-01', '2025-07-31', 1),
('217CT25002', 'Trần Thị Bích',       'bich.tt217ct@vlu.edu.vn',     'K27-CNTT2', 'Khoa học Máy tính',  'ThS. Lê Thanh Hà',      14, 10,  'Frontend Developer Intern',     'Đang thực tập', 3.50, '2025-02-01', '2025-07-31', 1),
('217CT25003', 'Lê Hoàng Cường',      'cuong.lh217ct@vlu.edu.vn',    'K27-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     16, 12,  'Mobile Developer Intern',       'Đang thực tập', 3.10, '2025-03-01', '2025-08-31', 1),
('217CT25004', 'Phạm Thị Dung',       'dung.pt217ct@vlu.edu.vn',     'K27-CNTT3', 'Hệ thống Thông tin', 'TS. Nguyễn Minh Đức',   18, 13,  'Business Analyst Intern',       'Đang thực tập', 3.65, '2025-01-15', '2025-06-30', 1),
('217CT25005', 'Vũ Minh Đạt',         'dat.vm217ct@vlu.edu.vn',      'K27-CNTT2', 'Khoa học Máy tính',  'ThS. Trần Quốc Bảo',    20, 15,  'Software Tester Intern',        'Đang thực tập', 2.90, '2025-02-15', '2025-07-31', 1),
('217CT25006', 'Hoàng Thị Lan',       'lan.ht217ct@vlu.edu.vn',      'K27-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      22, 17,  'Security Analyst Intern',       'Đang thực tập', 3.75, '2025-03-01', '2025-08-31', 1),
('217CT25007', 'Đặng Quốc Hùng',      'hung.dq217ct@vlu.edu.vn',     'K27-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     24, 18,  'DevOps Intern',                 'Đang thực tập', 3.30, '2025-01-20', '2025-06-30', 1),
('217CT25008', 'Nguyễn Thị Mai',      'mai.nt217ct@vlu.edu.vn',      'K27-CNTT3', 'Hệ thống Thông tin', 'ThS. Trần Quốc Bảo',    26, 19,  'Data Analyst Intern',           'Đang thực tập', 3.40, '2025-02-01', '2025-07-31', 1),
('217CT25009', 'Trịnh Văn Nam',       'nam.tv217ct@vlu.edu.vn',      'K27-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   31, 24,  'Backend Developer Intern',      'Đang thực tập', 3.00, '2025-03-15', '2025-08-31', 1),
('217CT25010', 'Lý Thị Oanh',         'oanh.lt217ct@vlu.edu.vn',     'K27-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      33, 25,  'IT Support Intern',             'Đang thực tập', 3.55, '2025-02-15', '2025-07-31', 1),

-- Hoàn thành (12 SV)
('207CT24011', 'Bùi Thanh Phong',     'phong.bt207ct@vlu.edu.vn',    'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     34, 27,  'Backend Developer Intern',      'Hoàn thành',    3.45, '2024-07-01', '2024-12-31', 1),
('207CT24012', 'Đinh Thị Quỳnh',      'quynh.dt207ct@vlu.edu.vn',   'K26-CNTT2', 'Khoa học Máy tính',  'ThS. Trần Quốc Bảo',    37, 28,  'Frontend Developer Intern',     'Hoàn thành',    3.60, '2024-07-01', '2024-12-31', 1),
('207CT24013', 'Cao Văn Sơn',         'son.cv207ct@vlu.edu.vn',      'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   39, 29,  'Fullstack Developer Intern',    'Hoàn thành',    3.20, '2024-06-01', '2024-11-30', 1),
('207CT24014', 'Ngô Thị Thu',         'thu.nt207ct@vlu.edu.vn',      'K26-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      40, 30,  'System Analyst Intern',         'Hoàn thành',    3.80, '2024-07-15', '2024-12-31', 1),
('207CT24015', 'Phan Minh Tuấn',      'tuan.pm207ct@vlu.edu.vn',     'K26-CNTT2', 'Khoa học Máy tính',  'TS. Phạm Văn Hùng',     45, 32,  'AI/ML Engineer Intern',         'Hoàn thành',    3.70, '2024-06-15', '2024-12-15', 1),
('207CT24016', 'Lương Thị Uyên',      'uyen.lt207ct@vlu.edu.vn',     'K26-CNTT4', 'An toàn Thông tin',  'ThS. Trần Quốc Bảo',    47, 33,  'Penetration Tester Intern',     'Hoàn thành',    3.35, '2024-08-01', '2024-12-31', 1),
('207CT24017', 'Võ Anh Việt',         'viet.va207ct@vlu.edu.vn',     'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   52, 35,  'Software Developer Intern',     'Hoàn thành',    3.15, '2024-07-01', '2024-12-31', 1),
('207CT24018', 'Trương Thị Xuân',     'xuan.tt207ct@vlu.edu.vn',    'K26-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      53, 36,  'Database Administrator Intern', 'Hoàn thành',    3.55, '2024-06-01', '2024-11-30', 1),
('207CT24019', 'Đỗ Quang Yên',        'yen.dq207ct@vlu.edu.vn',      'K26-CNTT2', 'Khoa học Máy tính',  'TS. Phạm Văn Hùng',     54, 38,  'QA Engineer Intern',            'Hoàn thành',    2.85, '2024-07-15', '2024-12-31', 1),
('207CT24020', 'Hồ Thị Ánh',          'anh.ht207ct@vlu.edu.vn',      'K26-CNTT4', 'An toàn Thông tin',  'ThS. Trần Quốc Bảo',    56, 38,  'Network Security Intern',       'Hoàn thành',    3.90, '2024-08-01', '2025-01-31', 1),
('207CT24021', 'Kiều Văn Bảo',        'bao.kv207ct@vlu.edu.vn',      'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   63, 41,  'React Developer Intern',        'Hoàn thành',    3.25, '2024-07-01', '2024-12-31', 1),
('207CT24022', 'Lê Ngọc Chi',         'chi.ln207ct@vlu.edu.vn',      'K26-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      67, 43,  'Project Coordinator Intern',    'Hoàn thành',    3.50, '2024-06-15', '2024-12-15', 1),

-- Chờ phân công (5 SV)
('227CT25023', 'Mai Xuân Dũng',       'dung.mx227ct@vlu.edu.vn',    'K28-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     NULL, NULL, NULL,                           'Chờ phân công', 3.10, NULL,         NULL,         1),
('227CT25024', 'Trần Mỹ Hạnh',        'hanh.tm227ct@vlu.edu.vn',    'K28-CNTT2', 'Khoa học Máy tính',  'ThS. Trần Quốc Bảo',    NULL, NULL, NULL,                           'Chờ phân công', 3.40, NULL,         NULL,         1),
('227CT25025', 'Nguyễn Bảo Khánh',    'khanh.nb227ct@vlu.edu.vn',   'K28-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Nguyễn Minh Đức',   NULL, NULL, NULL,                           'Chờ phân công', 2.95, NULL,         NULL,         1),
('227CT25026', 'Phùng Thị Linh',      'linh.pt227ct@vlu.edu.vn',    'K28-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      NULL, NULL, NULL,                           'Chờ phân công', 3.70, NULL,         NULL,         1),
('227CT25027', 'Đinh Công Minh',      'minh.dc227ct@vlu.edu.vn',    'K28-CNTT2', 'Khoa học Máy tính',  'TS. Phạm Văn Hùng',     NULL, NULL, NULL,                           'Chờ phân công', 3.20, NULL,         NULL,         1),

-- Đã nghỉ (3 SV)
('207CT23028', 'Trần Thị Ngọc',       'ngoc.tt207ct23@vlu.edu.vn',   'K25-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Trần Quốc Bảo',    73, 45,  'Frontend Intern',               'Đã nghỉ',       2.70, '2024-01-15', '2024-04-30', 1),
('207CT23029', 'Phan Văn Phát',       'phat.pv207ct23@vlu.edu.vn',   'K25-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   77, 48,  'Backend Intern',                'Đã nghỉ',       2.60, '2024-02-01', '2024-05-15', 1),
('207CT23030', 'Võ Thị Quỳnh',        'quynh.vt207ct23@vlu.edu.vn',  'K25-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      80, 50,  'Data Entry Intern',             'Đã nghỉ',       2.50, '2024-01-20', '2024-03-31', 1);
