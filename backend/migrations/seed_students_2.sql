-- ============================================================
-- SEED DATA 2: 30 More Students
-- Linking to enterprises 51-70 and their activities
-- ============================================================

INSERT INTO students 
    (student_code, name, email, class, major, advisor, activity_id, enterprise_id, position, status, gpa, start_date, end_date, faculty_id)
VALUES
-- Đang thực tập (10 SV)
('217CT26001', 'Phạm Hoàng Long',      'long.ph217ct@vlu.edu.vn',    'K27-CNTT5', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     82, 51, 'UX/UI Designer Intern',        'Đang thực tập', 3.40, '2025-04-01', '2025-09-30', 1),
('217CT26002', 'Lê Thị Mỹ Hạnh',       'hanh.ltm217ct@vlu.edu.vn',   'K27-CNTT1', 'Khoa học Máy tính',  'ThS. Lê Thanh Hà',      83, 52, 'Python Developer Intern',      'Đang thực tập', 3.15, '2025-04-01', '2025-09-30', 1),
('217CT26003', 'Nguyễn Đức Trọng',     'trong.nd217ct@vlu.edu.vn',   'K27-CNTT3', 'Hệ thống Thông tin', 'TS. Nguyễn Minh Đức',   84, 53, 'System Admin Intern',          'Đang thực tập', 3.05, '2025-03-15', '2025-08-31', 1),
('217CT26004', 'Trần Bảo Ngọc',        'ngoc.tb217ct@vlu.edu.vn',    'K27-CNTT2', 'Kỹ thuật Phần mềm',  'ThS. Trần Quốc Bảo',    87, 55, 'PHP Developer Intern',         'Đang thực tập', 3.25, '2025-04-01', '2025-09-30', 1),
('217CT26005', 'Đỗ Thành Trung',       'trung.dt217ct@vlu.edu.vn',   'K27-CNTT4', 'An toàn Thông tin',  'TS. Phạm Văn Hùng',     89, 57, 'Security Compliance Intern',   'Đang thực tập', 3.50, '2025-03-20', '2025-08-20', 1),
('217CT26006', 'Vũ Thị Kim Ngân',      'ngan.vtk217ct@vlu.edu.vn',   'K27-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Lê Thanh Hà',      90, 58, 'Web Developer Intern',         'Đang thực tập', 3.60, '2025-04-01', '2025-09-30', 1),
('217CT26007', 'Hoàng Văn Khải',       'khai.hv217ct@vlu.edu.vn',    'K27-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   93, 60, 'Java Developer Intern',        'Đang thực tập', 3.10, '2025-03-01', '2025-08-31', 1),
('217CT26008', 'Ngô Bảo Châu',         'chau.nb217ct@vlu.edu.vn',    'K27-CNTT3', 'Hệ thống Thông tin', 'ThS. Trần Quốc Bảo',    95, 61, 'ERP Consultant Intern',        'Đang thực tập', 3.70, '2025-04-15', '2025-10-15', 1),
('217CT26009', 'Đặng Minh Quân',       'quan.dm217ct@vlu.edu.vn',    'K27-CNTT4', 'An toàn Thông tin',  'TS. Phạm Văn Hùng',     96, 62, 'Cloud Security Intern',        'Đang thực tập', 3.35, '2025-04-01', '2025-09-30', 1),
('217CT26010', 'Bùi Xuân Trường',      'truong.bx217ct@vlu.edu.vn',   'K27-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Lê Thanh Hà',      101, 65, 'Node.js Intern',               'Đang thực tập', 3.00, '2025-03-10', '2025-08-10', 1),

-- Hoàn thành (10 SV)
('207CT24511', 'Lê Quốc Anh',          'anh.lq207ct@vlu.edu.vn',     'K26-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   102, 66, 'Data Engineer Intern',         'Hoàn thành',    3.40, '2024-08-01', '2025-01-31', 1),
('207CT24512', 'Nguyễn Diệu Linh',     'linh.nd207ct@vlu.edu.vn',    'K26-CNTT3', 'Hệ thống Thông tin', 'ThS. Trần Quốc Bảo',    103, 66, 'IT Auditor Intern',            'Hoàn thành',    3.25, '2024-08-01', '2025-01-31', 1),
('207CT24513', 'Phạm Thế Vinh',        'vinh.pt207ct@vlu.edu.vn',    'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     105, 67, 'Game Developer Intern',        'Hoàn thành',    3.10, '2024-07-01', '2024-12-31', 1),
('207CT24514', 'Vũ Hà My',             'my.vh207ct@vlu.edu.vn',      'K26-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      106, 67, 'SOC Analyst Intern',           'Hoàn thành',    3.55, '2024-08-15', '2025-02-15', 1),
('207CT24515', 'Trần Văn Tuyển',       'tuyen.tv207ct@vlu.edu.vn',   'K26-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   109, 67, 'AI Research Intern',           'Hoàn thành',    3.85, '2024-07-01', '2024-12-31', 1),
('207CT24516', 'Lý Phương Thảo',       'thao.lp207ct@vlu.edu.vn',    'K26-CNTT3', 'Hệ thống Thông tin', 'ThS. Trần Quốc Bảo',    110, 68, 'Business Intelligence Intern', 'Hoàn thành',    3.45, '2024-08-01', '2025-01-31', 1),
('207CT24517', 'Đặng Hồng Phước',      'phuoc.dh207ct@vlu.edu.vn',   'K26-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     111, 69, 'iOS Developer Intern',         'Hoàn thành',    2.95, '2024-07-15', '2025-01-15', 1),
('207CT24518', 'Nguyễn Thanh Tùng',    'tung.nt207ct@vlu.edu.vn',    'K26-CNTT4', 'An toàn Thông tin',  'ThS. Lê Thanh Hà',      112, 70, 'Cryptographer Intern',         'Hoàn thành',    3.65, '2024-08-01', '2025-01-31', 1),
('207CT24519', 'Hoàng Minh Quân',      'quan.hm207ct@vlu.edu.vn',    'K26-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   5, 2, 'C# Developer Intern',          'Hoàn thành',    3.20, '2024-06-01', '2024-11-30', 1),
('207CT24520', 'Trịnh Thu Trang',      'trang.tt207ct@vlu.edu.vn',   'K26-CNTT3', 'Hệ thống Thông tin', 'ThS. Trần Quốc Bảo',    1, 2, 'Technical Writer Intern',      'Hoàn thành',    3.30, '2024-06-01', '2024-11-30', 1),

-- Chờ phân công (5 SV)
('227CT27021', 'Bùi Minh Đức',         'duc.bm227ct@vlu.edu.vn',     'K28-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      NULL, NULL, NULL,                        'Chờ phân công', 3.25, NULL,         NULL,         1),
('227CT27022', 'Vũ Hải Yến',           'yen.vh227ct@vlu.edu.vn',     'K28-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     NULL, NULL, NULL,                        'Chờ phân công', 3.50, NULL,         NULL,         1),
('227CT27023', 'Lê Hữu Nghĩa',         'nghia.lh227ct@vlu.edu.vn',   'K28-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   NULL, NULL, NULL,                        'Chờ phân công', 2.80, NULL,         NULL,         1),
('227CT27024', 'Nguyễn Thị Hoa',       'hoa.nt227ct@vlu.edu.vn',     'K28-CNTT4', 'An toàn Thông tin',  'ThS. Trần Quốc Bảo',    NULL, NULL, NULL,                        'Chờ phân công', 3.65, NULL,         NULL,         1),
('227CT27025', 'Trần Công Danh',       'danh.tc227ct@vlu.edu.vn',    'K28-CNTT1', 'Kỹ thuật Phần mềm',  'TS. Phạm Văn Hùng',     NULL, NULL, NULL,                        'Chờ phân công', 3.15, NULL,         NULL,         1),

-- Đã nghỉ (5 SV)
('207CT23526', 'Phạm Văn Hậu',         'hau.pv207ct@vlu.edu.vn',     'K25-CNTT2', 'Khoa học Máy tính',  'TS. Nguyễn Minh Đức',   2, 2, 'Intern',                         'Đã nghỉ',       2.40, '2024-01-10', '2024-03-10', 1),
('207CT23527', 'Lê Thị Diệu',          'dieu.lt207ct@vlu.edu.vn',    'K25-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Trần Quốc Bảo',    3, 2, 'Intern',                         'Đã nghỉ',       2.55, '2024-01-15', '2024-04-01', 1),
('207CT23528', 'Nguyễn Hoàng Sa',      'sa.nh207ct@vlu.edu.vn',      'K25-CNTT3', 'Hệ thống Thông tin', 'ThS. Lê Thanh Hà',      4, 2, 'Intern',                         'Đã nghỉ',       2.30, '2024-02-01', '2024-05-01', 1),
('207CT23529', 'Trần Tuyết Mai',       'mai.tt207ct@vlu.edu.vn',     'K25-CNTT4', 'An toàn Thông tin',  'TS. Phạm Văn Hùng',     6, 4, 'Intern',                         'Đã nghỉ',       2.65, '2024-01-20', '2024-04-20', 1),
('207CT23530', 'Đặng Văn Phước',       'phuoc.dv207ct@vlu.edu.vn',   'K25-CNTT1', 'Kỹ thuật Phần mềm',  'ThS. Trần Quốc Bảo',    7, 5, 'Intern',                         'Đã nghỉ',       2.20, '2024-02-15', '2024-05-15', 1);
