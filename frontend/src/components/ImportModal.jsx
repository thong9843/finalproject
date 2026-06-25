import React, { useState, useEffect } from 'react';
import { Modal, Upload, Button, message, Alert, Typography, Table, Tag, Steps, Select, Spin, Space, App as AntApp, Tooltip } from 'antd';
import { UploadOutlined, FileExcelOutlined, InboxOutlined, DownloadOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { Option } = Select;

const ALIAS_MAP = {
    students: {
        'mssv': ['mssv', 'student_code', 'student code', 'mã sinh viên', 'ma sinh vien', 'mã sv', 'ma sv', 'mã số sinh viên', 'ma so sinh vien'],
        'họ tên': ['họ tên', 'ho ten', 'họ và tên', 'ho va ten', 'tên', 'ten', 'name', 'tên sinh viên', 'ten sinh vien', 'họ & tên'],
        'email': ['email', 'thư điện tử', 'thu dien tu'],
        'lớp': ['lớp', 'lop', 'class', 'lớp học', 'lop hoc'],
        'ngành học': ['ngành học', 'nganh hoc', 'ngành', 'nganh', 'major', 'chuyên ngành', 'chuyen nganh'],
        'giảng viên hd': ['giảng viên hd', 'giang vien hd', 'giảng viên hướng dẫn', 'giang vien huong dan', 'gvhd', 'advisor', 'gv hướng dẫn', 'gv huong dan'],
        'nơi thực tập/làm việc': ['nơi thực tập/làm việc', 'noi thuc tap/lam viec', 'nơi thực tập / làm việc', 'nơi thực tập', 'noi thuc tap', 'tên doanh nghiệp', 'ten doanh nghiep', 'doanh nghiệp', 'doanh nghiep', 'công ty', 'cong ty', 'enterprise', 'enterprise_name'],
        'mã doanh nghiệp (id)': ['mã doanh nghiệp (id)', 'enterprise_id', 'mã doanh nghiệp', 'ma doanh nghiep'],
        'hoạt động tham gia': ['hoạt động tham gia', 'hoat dong tham gia', 'hoạt động', 'hoat dong', 'tên hoạt động', 'ten hoat dong', 'activity', 'activity_title'],
        'mã hoạt động (id)': ['mã hoạt động (id)', 'activity_id', 'mã hoạt động', 'ma hoat dong'],
        'vị trí': ['vị trí', 'vi tri', 'position', 'vị trí thực tập', 'vi tri thuc tap'],
        'trạng thái': ['trạng thái', 'trang thai', 'status'],
        'gpa': ['gpa', 'điểm', 'diem', 'điểm trung bình', 'diem trung binh'],
        'ngày bắt đầu': ['ngày bắt đầu', 'ngay bat dau', 'start_date', 'start date', 'từ ngày', 'tu ngay'],
        'ngày kết thúc': ['ngày kết thúc', 'ngay ket thuc', 'end_date', 'end date', 'đến ngày', 'den ngay']
    },
    enterprises: {
        'tên doanh nghiệp': ['tên doanh nghiệp', 'ten doanh nghiep', 'name', 'tên công ty', 'ten cong ty', 'tên', 'ten', 'doanh nghiệp', 'doanh nghiep'],
        'mã số thuế': ['mã số thuế', 'ma so thue', 'tax_code', 'tax code', 'mst'],
        'quy mô': ['quy mô', 'quy mo', 'scale', 'scale_name'],
        'lĩnh vực': ['lĩnh vực', 'linh vuc', 'fields', 'ngành nghề', 'nganh nghe'],
        'ở tp.hcm': ['ở tp.hcm', 'o tp.hcm', 'is_hcmc', 'tp.hcm', 'hcm', 'tphcm', 'ở tphcm'],
        'danh xưng': ['danh xưng', 'danh xung', 'rep_title', 'title'],
        'họ và tên': ['họ và tên', 'ho va ten', 'rep_name', 'rep_full_name', 'người đại diện', 'nguoi dai dien', 'họ tên', 'ho ten'],
        'chức vụ': ['chức vụ', 'chuc vu', 'rep_role', 'role'],
        'số điện thoại': ['số điện thoại', 'so dien thoai', 'rep_phone', 'sđt', 'sdt', 'phone'],
        'email': ['email', 'rep_email'],
        'địa chỉ': ['địa chỉ', 'dia chi', 'building_street', 'address', 'địa chỉ chi tiết'],
        'quận/huyện': ['quận/huyện', 'quan/huyen', 'district'],
        'tỉnh/thành': ['tỉnh/thành', 'tinh/thanh', 'province', 'tỉnh/thành phố'],
        'quốc gia': ['quốc gia', 'quoc gia', 'country'],
        'bộ môn id': ['bộ môn id', 'bo mon id', 'department_id'],
        'trạng thái': ['trạng thái', 'trang thai', 'status']
    },
    activities: {
        'tên hoạt động': ['tên hoạt động', 'ten hoat dong', 'title', 'activity_title'],
        'tên doanh nghiệp': ['tên doanh nghiệp', 'ten doanh nghiep', 'enterprise_name', 'doanh nghiệp', 'doanh nghiep', 'công ty', 'cong ty'],
        'mã doanh nghiệp (id)': ['mã doanh nghiệp (id)', 'enterprise_id', 'mã doanh nghiệp', 'ma doanh nghiep'],
        'loại hình': ['loại hình', 'loai hinh', 'type', 'activity_type', 'loại hình hoạt động'],
        'đối tượng': ['đối tượng', 'doi tuong', 'target'],
        'mô tả': ['mô tả', 'mo ta', 'detail', 'mô tả nội dung', 'description', 'nội dung'],
        'ngày bắt đầu': ['ngày bắt đầu', 'ngay bat dau', 'start_date'],
        'ngày kết thúc': ['ngày kết thúc', 'ngay ket thuc', 'end_date'],
        'thời gian bắt đầu': ['thời gian bắt đầu', 'thoi gian bat dau', 'start_time', 'start time', 'giờ bắt đầu', 'gio bat dau'],
        'thời gian kết thúc': ['thời gian kết thúc', 'thoi gian ket thuc', 'end_time', 'end time', 'giờ kết thúc', 'gio ket thuc'],
        'người phụ trách': ['người phụ trách', 'nguoi phu trach', 'person_in_charge', 'person in charge', 'phụ trách', 'phu trach'],
        'nhiệm vụ': ['nhiệm vụ', 'nhiem vu', 'tasks', 'công việc', 'cong viec'],
        'ngày hợp tác': ['ngày hợp tác', 'ngay hop tac', 'collaboration_date'],
        'trạng thái': ['trạng thái', 'trang thai', 'status']
    },
    mous: {
        'mã mou': ['mã mou', 'ma mou', 'mou_code', 'mã biên bản', 'ma bien ban'],
        'tên doanh nghiệp': ['tên doanh nghiệp', 'ten doanh nghiep', 'enterprise_name', 'doanh nghiệp', 'doanh nghiep', 'công ty', 'cong ty', 'đối tác', 'doi tac'],
        'mã doanh nghiệp (id)': ['mã doanh nghiệp (id)', 'enterprise_id', 'mã doanh nghiệp', 'ma doanh nghiep'],
        'ngày ký': ['ngày ký', 'ngay ky', 'signing_date', 'ngày ký kết', 'ngay ky ket'],
        'đầu mối đối tác': ['đầu mối đối tác', 'dau moi doi tac', 'partner_contact', 'đại diện đối tác'],
        'loại tổ chức': ['loại tổ chức', 'loai to chuc', 'org_type', 'phân loại tổ chức'],
        'quốc gia': ['quốc gia', 'quoc gia', 'country'],
        'mảng hợp tác': ['mảng hợp tác', 'mang hop tac', 'collaboration_scope', 'phạm vi hợp tác'],
        'bộ môn id': ['bộ môn id', 'bo mon id', 'executing_unit_id', 'department_id'],
        'bộ môn triển khai': ['bộ môn triển khai', 'bo mon trien khai', 'executing_unit_name', 'department_name'],
        'đầu mối vlu': ['đầu mối vlu', 'dau moi vlu', 'vlu_contact'],
        'nhiệm vụ': ['nhiệm vụ', 'nhiem vu', 'tasks_ay24_25'],
        'bước tiếp theo': ['bước tiếp theo', 'buoc tiep theo', 'next_steps'],
        'hoạt động đã qua': ['hoạt động đã qua', 'hoat dong da qua', 'past_activities'],
        'số liệu liên quan': ['số liệu liên quan', 'so lieu lien quan', 'related_data'],
        'thư mục làm việc': ['thư mục làm việc', 'thu muc lam viec', 'working_dir', 'working dir', 'folder'],
        'hoạt động liên kết': ['hoạt động liên kết', 'hoat dong lien ket', 'activity_title', 'hoạt động', 'hoat dong', 'tên hoạt động', 'ten hoat dong', 'activity'],
        'mã hoạt động (id)': ['mã hoạt động (id)', 'activity_id', 'mã hoạt động', 'ma hoat dong'],
        'link tài liệu': ['link tài liệu', 'link tai lieu', 'file_url', 'file url']
    }
};

const standardizeRowKeys = (row, entityType) => {
    const standardized = {};
    const typeMapping = ALIAS_MAP[entityType] || {};

    // First, convert row keys to lowercase and trim
    const normalizedRow = {};
    for (const key in row) {
        normalizedRow[key.trim().toLowerCase()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
    }

    // Map according to our ALIAS_MAP
    for (const canonicalKey in typeMapping) {
        const aliases = typeMapping[canonicalKey];
        // Find if any of the aliases exists in the normalized row
        const matchedAlias = aliases.find(alias => alias in normalizedRow);
        if (matchedAlias !== undefined) {
            standardized[canonicalKey] = normalizedRow[matchedAlias];
        } else {
            // Default to fallback to check if canonical key exists as is
            standardized[canonicalKey] = normalizedRow[canonicalKey] !== undefined ? normalizedRow[canonicalKey] : undefined;
        }
    }

    // Keep any other keys that were not mapped, just in case
    for (const key in normalizedRow) {
        let isMapped = false;
        for (const canonicalKey in typeMapping) {
            if (typeMapping[canonicalKey].includes(key)) {
                isMapped = true;
                break;
            }
        }
        if (!isMapped) {
            standardized[key] = normalizedRow[key];
        }
    }

    return standardized;
};

const ImportModal = ({ open, onClose, onSuccess, type, templateColumns }) => {
    const { modal } = AntApp.useApp();
    const [currentStep, setCurrentStep] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [faculties, setFaculties] = useState([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [originalFile, setOriginalFile] = useState(null);
    const [step2Loading, setStep2Loading] = useState(false);
    const [filterType, setFilterType] = useState('all');

    // Get user role
    const userCookie = Cookies.get('user');
    const user = userCookie ? JSON.parse(userCookie) : null;
    const isAdmin = user?.role === 'ADMIN';

    const typeLabels = {
        enterprises: 'Doanh nghiệp',
        activities: 'Hoạt động',
        students: 'Sinh viên',
        mous: 'Biên bản ghi nhớ (MOU)',
    };

    // Load faculties if Admin
    useEffect(() => {
        if (open && isAdmin) {
            const fetchFaculties = async () => {
                try {
                    const res = await api.get('/structure/faculties');
                    setFaculties(res.data);
                } catch (error) {
                    message.error('Lỗi khi tải danh sách khoa');
                }
            };
            fetchFaculties();
        }
    }, [open, isAdmin]);

    // Handle file selection in Step 1
    const handleBeforeUpload = (file) => {
        if (isAdmin && !selectedFacultyId) {
            message.error('Vui lòng chọn Khoa quản lý trước khi tải file lên!');
            return false;
        }
        setOriginalFile(file);
        setStep2Loading(true);
        setCurrentStep(1);

        // Process file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(sheet);

                if (json.length === 0) {
                    message.error('File Excel không có dữ liệu!');
                    handleReset();
                    return;
                }

                // Standardize keys
                const normalized = json.map(row => standardizeRowKeys(row, type));

                // Post to validate endpoint
                api.post(`/import/${type}/validate`, {
                    rows: normalized,
                    faculty_id: isAdmin ? selectedFacultyId : undefined
                }).then((res) => {
                    setParsedRows(res.data.validatedRows);
                    setStep2Loading(false);
                    setCurrentStep(2);
                }).catch((err) => {
                    message.error('Lỗi khi kiểm tra dữ liệu: ' + (err.response?.data?.message || err.message));
                    handleReset();
                });

            } catch (err) {
                message.error('Lỗi khi đọc file Excel: ' + err.message);
                handleReset();
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // Prevent default upload
    };

    const handleConfirmImport = async () => {
        setUploading(true);
        try {
            const cleanRows = parsedRows
                .filter(r => r.status === 'success' || r.status === 'warning')
                .map(r => r.row);

            if (cleanRows.length === 0) {
                message.error('Không có dòng dữ liệu hợp lệ nào để import!');
                setUploading(false);
                return;
            }

            const payload = {
                rows: cleanRows,
                faculty_id: isAdmin ? selectedFacultyId : undefined
            };

            const res = await api.post(`/import/${type}`, payload);
            setResult(res.data);
            if (res.data.inserted > 0) {
                message.success(res.data.message);
                onSuccess?.();
            } else {
                message.warning(res.data.message);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu lên hệ thống');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            templateColumns.reduce((obj, col) => ({ ...obj, [col]: '' }), {})
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `template_${type}.xlsx`);
        message.success('Đã tải file mẫu');
    };

    const handleReset = () => {
        setParsedRows([]);
        setOriginalFile(null);
        setResult(null);
        setStep2Loading(false);
        setCurrentStep(0);
        setFilterType('all');
    };

    const handleClose = () => {
        handleReset();
        setSelectedFacultyId(null);
        onClose();
    };

    // Columns configuration for Preview Table
    const getPreviewColumns = () => {
        const statusColumn = {
            title: 'Trạng thái',
            key: 'validation_status',
            width: 140,
            fixed: 'left',
            render: (_, r) => {
                if (r.status === 'success') {
                    return <Tag color="green">🟢 Hợp lệ</Tag>;
                }
                if (r.status === 'warning') {
                    return (
                        <Tooltip title={r.warnings.join('; ')}>
                            <Tag color="orange" className="cursor-help">⚠️ Cảnh báo</Tag>
                        </Tooltip>
                    );
                }
                if (r.status === 'error') {
                    return (
                        <Tooltip title={r.errors.join('; ')}>
                            <Tag color="red" className="cursor-help">🚫 Lỗi liên kết</Tag>
                        </Tooltip>
                    );
                }
                if (r.status === 'duplicate') {
                    return (
                        <Tooltip title={r.errors.join('; ')}>
                            <Tag color="volcano" className="cursor-help">⛔ Trùng lặp</Tag>
                        </Tooltip>
                    );
                }
                return '---';
            }
        };

        let entityColumns = [];
        if (type === 'enterprises') {
            entityColumns = [
                {
                    title: 'Tên Doanh nghiệp',
                    render: (_, r) => r.row['tên doanh nghiệp'] || r.row['name'] || r.row['ten_doanh_nghiep'] || '---',
                    width: 180,
                },
                {
                    title: 'Mã số thuế',
                    render: (_, r) => r.row['mã số thuế'] || r.row['tax_code'] || r.row['ma_so_thue'] || '---',
                    width: 120,
                },
                {
                    title: 'Quy mô',
                    render: (_, r) => r.row['quy mô'] || r.row['scale'] || r.row['scale_name'] || '---',
                    width: 110,
                },
                {
                    title: 'Lĩnh vực',
                    render: (_, r) => r.row['lĩnh vực'] || r.row['fields'] || r.row['fields_text'] || '---',
                    width: 150,
                },
                {
                    title: 'Ở TP.HCM',
                    render: (_, r) => r.row['ở tp.hcm'] !== undefined ? (r.row['ở tp.hcm'] === 1 || r.row['ở tp.hcm'].toString().toLowerCase() === 'có' || r.row['ở tp.hcm'].toString().toLowerCase() === 'true' ? 'Có' : 'Không') : '---',
                    width: 90,
                },
                {
                    title: 'Danh xưng',
                    render: (_, r) => r.row['danh xưng'] || r.row['rep_title'] || r.row['title'] || '---',
                    width: 90,
                },
                {
                    title: 'Người đại diện',
                    render: (_, r) => r.row['họ và tên'] || r.row['rep_name'] || r.row['rep_full_name'] || '---',
                    width: 150,
                },
                {
                    title: 'Chức vụ',
                    render: (_, r) => r.row['chức vụ'] || r.row['rep_role'] || r.row['role'] || '---',
                    width: 120,
                },
                {
                    title: 'SĐT',
                    render: (_, r) => r.row['số điện thoại'] || r.row['rep_phone'] || r.row['phone'] || '---',
                    width: 120,
                },
                {
                    title: 'Email',
                    render: (_, r) => r.row['email'] || r.row['rep_email'] || '---',
                    width: 160,
                },
                {
                    title: 'Địa chỉ',
                    render: (_, r) => r.row['địa chỉ'] || r.row['building_street'] || r.row['address'] || '---',
                    width: 180,
                },
                {
                    title: 'Quận/Huyện',
                    render: (_, r) => r.row['quận/huyện'] || r.row['district'] || '---',
                    width: 110,
                },
                {
                    title: 'Tỉnh/Thành',
                    render: (_, r) => r.row['tỉnh/thành'] || r.row['province'] || '---',
                    width: 110,
                },
                {
                    title: 'Quốc gia',
                    render: (_, r) => r.row['quốc gia'] || r.row['country'] || '---',
                    width: 110,
                },
                {
                    title: 'Bộ môn ID',
                    render: (_, r) => r.row['bộ môn id'] || r.row['department_id'] || '---',
                    width: 90,
                },
                {
                    title: 'Trạng thái',
                    render: (_, r) => r.row['trạng thái'] || r.row['status'] || '---',
                    width: 110,
                }
            ];
        } else if (type === 'activities') {
            entityColumns = [
                {
                    title: 'Tên Hoạt động',
                    render: (_, r) => r.row['tên hoạt động'] || r.row['title'] || r.row['ten_hoat_dong'] || '---',
                    width: 180,
                },
                {
                    title: 'Doanh nghiệp',
                    render: (_, r) => r.row['tên doanh nghiệp'] || r.row['enterprise_name'] || r.row['enterprise'] || '---',
                    width: 180,
                },
                {
                    title: 'Mã DN (ID)',
                    render: (_, r) => r.row['mã doanh nghiệp (id)'] || r.row['enterprise_id'] || '---',
                    width: 100,
                },
                {
                    title: 'Loại hình',
                    render: (_, r) => r.row['loại hình'] || r.row['type'] || r.row['loai_hinh'] || '---',
                    width: 130,
                },
                {
                    title: 'Đối tượng',
                    render: (_, r) => r.row['đối tượng'] || r.row['target'] || '---',
                    width: 120,
                },
                {
                    title: 'Mô tả',
                    render: (_, r) => r.row['mô tả'] || r.row['detail'] || r.row['description'] || '---',
                    width: 200,
                    ellipsis: true,
                },
                {
                    title: 'Ngày bắt đầu',
                    render: (_, r) => r.row['ngày bắt đầu'] || r.row['start_date'] || '---',
                    width: 110,
                },
                {
                    title: 'Ngày kết thúc',
                    render: (_, r) => r.row['ngày kết thúc'] || r.row['end_date'] || '---',
                    width: 110,
                },
                {
                    title: 'Ngày hợp tác',
                    render: (_, r) => r.row['ngày hợp tác'] || r.row['collaboration_date'] || '---',
                    width: 110,
                },
                {
                    title: 'Thời gian bắt đầu',
                    render: (_, r) => r.row['thời gian bắt đầu'] || r.row['start_time'] || '---',
                    width: 120,
                },
                {
                    title: 'Thời gian kết thúc',
                    render: (_, r) => r.row['thời gian kết thúc'] || r.row['end_time'] || '---',
                    width: 120,
                },
                {
                    title: 'Người phụ trách',
                    render: (_, r) => r.row['người phụ trách'] || r.row['person_in_charge'] || '---',
                    width: 150,
                },
                {
                    title: 'Nhiệm vụ',
                    render: (_, r) => {
                        const tasks = r.row['nhiệm vụ'] || r.row['tasks'];
                        return tasks ? (typeof tasks === 'string' ? tasks : JSON.stringify(tasks)) : '---';
                    },
                    width: 200,
                    ellipsis: true,
                },
                {
                    title: 'Trạng thái',
                    render: (_, r) => r.row['trạng thái'] || r.row['status'] || '---',
                    width: 110,
                }
            ];
        } else if (type === 'students') {
            entityColumns = [
                {
                    title: 'MSSV',
                    render: (_, r) => r.row['mssv'] || r.row['student_code'] || '---',
                    width: 110,
                },
                {
                    title: 'Họ và Tên',
                    render: (_, r) => r.row['họ tên'] || r.row['name'] || r.row['ho_ten'] || '---',
                    width: 160,
                },
                {
                    title: 'Email',
                    render: (_, r) => r.row['email'] || '---',
                    width: 160,
                },
                {
                    title: 'Lớp',
                    render: (_, r) => r.row['lớp'] || r.row['class'] || r.row['lop'] || '---',
                    width: 90,
                },
                {
                    title: 'Ngành học',
                    render: (_, r) => r.row['ngành học'] || r.row['major'] || r.row['nganh_hoc'] || '---',
                    width: 140,
                },
                {
                    title: 'Giảng viên HD',
                    render: (_, r) => r.row['giảng viên hd'] || r.row['advisor'] || r.row['gvhd'] || '---',
                    width: 150,
                },
                {
                    title: 'Nơi thực tập',
                    render: (_, r) => r.row['nơi thực tập/làm việc'] || r.row['enterprise_name'] || r.row['enterprise'] || '---',
                    width: 180,
                },
                {
                    title: 'Mã DN (ID)',
                    render: (_, r) => r.row['mã doanh nghiệp (id)'] || r.row['enterprise_id'] || '---',
                    width: 100,
                },
                {
                    title: 'Hoạt động tham gia',
                    render: (_, r) => r.row['hoạt động tham gia'] || r.row['activity_title'] || r.row['activity'] || '---',
                    width: 180,
                },
                {
                    title: 'Mã HĐ (ID)',
                    render: (_, r) => r.row['mã hoạt động (id)'] || r.row['activity_id'] || '---',
                    width: 100,
                },
                {
                    title: 'Vị trí',
                    render: (_, r) => r.row['vị trí'] || r.row['position'] || r.row['vi_tri'] || '---',
                    width: 130,
                },
                {
                    title: 'Trạng thái',
                    render: (_, r) => r.row['trạng thái'] || r.row['status'] || '---',
                    width: 120,
                },
                {
                    title: 'GPA',
                    render: (_, r) => r.row['gpa'] || '---',
                    width: 70,
                },
                {
                    title: 'Ngày bắt đầu',
                    render: (_, r) => r.row['ngày bắt đầu'] || r.row['start_date'] || '---',
                    width: 110,
                },
                {
                    title: 'Ngày kết thúc',
                    render: (_, r) => r.row['ngày kết thúc'] || r.row['end_date'] || '---',
                    width: 110,
                }
            ];
        } else if (type === 'mous') {
            entityColumns = [
                {
                    title: 'Mã MOU',
                    render: (_, r) => r.row['mã mou'] || r.row['mou_code'] || r.row['ma_mou'] || '---',
                    width: 120,
                },
                {
                    title: 'Doanh nghiệp',
                    render: (_, r) => r.row['tên doanh nghiệp'] || r.row['enterprise_name'] || r.row['enterprise'] || '---',
                    width: 180,
                },
                {
                    title: 'Mã DN (ID)',
                    render: (_, r) => r.row['mã doanh nghiệp (id)'] || r.row['enterprise_id'] || '---',
                    width: 100,
                },
                {
                    title: 'Ngày ký',
                    render: (_, r) => r.row['ngày ký'] || r.row['signing_date'] || '---',
                    width: 110,
                },
                {
                    title: 'Đầu mối đối tác',
                    render: (_, r) => r.row['đầu mối đối tác'] || r.row['partner_contact'] || '---',
                    width: 150,
                },
                {
                    title: 'Loại tổ chức',
                    render: (_, r) => r.row['loại tổ chức'] || r.row['org_type'] || '---',
                    width: 120,
                },
                {
                    title: 'Quốc gia',
                    render: (_, r) => r.row['quốc gia'] || r.row['country'] || '---',
                    width: 110,
                },
                {
                    title: 'Mảng hợp tác',
                    render: (_, r) => r.row['mảng hợp tác'] || r.row['collaboration_scope'] || '---',
                    width: 180,
                    ellipsis: true,
                },
                {
                    title: 'Bộ môn ID',
                    render: (_, r) => r.row['bộ môn id'] || r.row['department_id'] || r.row['executing_unit_id'] || '---',
                    width: 90,
                },
                {
                    title: 'Bộ môn triển khai',
                    render: (_, r) => r.row['bộ môn triển khai'] || r.row['executing_unit_name'] || '---',
                    width: 160,
                },
                {
                    title: 'Đầu mối VLU',
                    render: (_, r) => r.row['đầu mối vlu'] || r.row['vlu_contact'] || '---',
                    width: 150,
                },
                {
                    title: 'Nhiệm vụ',
                    render: (_, r) => r.row['nhiệm vụ'] || r.row['tasks_ay24_25'] || '---',
                    width: 150,
                    ellipsis: true,
                },
                {
                    title: 'Bước tiếp theo',
                    render: (_, r) => r.row['bước tiếp theo'] || r.row['next_steps'] || '---',
                    width: 150,
                    ellipsis: true,
                },
                {
                    title: 'Hoạt động đã qua',
                    render: (_, r) => r.row['hoạt động đã qua'] || r.row['past_activities'] || '---',
                    width: 150,
                    ellipsis: true,
                },
                {
                    title: 'Số liệu liên quan',
                    render: (_, r) => r.row['số liệu liên quan'] || r.row['related_data'] || '---',
                    width: 150,
                    ellipsis: true,
                },
                {
                    title: 'Thư mục làm việc',
                    render: (_, r) => r.row['thư mục làm việc'] || r.row['working_dir'] || '---',
                    width: 180,
                    ellipsis: true,
                },
                {
                    title: 'Hoạt động liên kết',
                    render: (_, r) => r.row['hoạt động liên kết'] || r.row['activity_title'] || '---',
                    width: 180,
                    ellipsis: true,
                },
                {
                    title: 'Mã HĐ (ID)',
                    render: (_, r) => r.row['mã hoạt động (id)'] || r.row['activity_id'] || '---',
                    width: 100,
                },
                {
                    title: 'Link tài liệu',
                    render: (_, r) => r.row['link tài liệu'] || r.row['file_url'] || '---',
                    width: 180,
                    ellipsis: true,
                }
            ];
        }
        return [statusColumn, ...entityColumns];
    };

    const counts = {
        all: parsedRows.length,
        success: parsedRows.filter(r => r.status === 'success').length,
        warning: parsedRows.filter(r => r.status === 'warning').length,
        error: parsedRows.filter(r => r.status === 'error').length,
        duplicate: parsedRows.filter(r => r.status === 'duplicate').length
    };

    const getFilteredRows = () => {
        if (filterType === 'all') return parsedRows;
        return parsedRows.filter(r => r.status === filterType);
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <FileExcelOutlined className="text-green-600 text-xl" />
                    <span>Import dữ liệu {typeLabels[type]}</span>
                </div>
            }
            open={open}
            onCancel={handleClose}
            footer={null}
            width={currentStep === 2 ? '95%' : 600}
            style={currentStep === 2 ? { top: 20, maxWidth: '1600px' } : {}}
            destroyOnClose
        >
            <div className="mt-4">
                <Steps
                    current={currentStep}
                    size="small"
                    items={[
                        { title: 'Tải file lên' },
                        { title: 'Xử lý dữ liệu' },
                        { title: 'Preview & Lưu' }
                    ]}
                    className="mb-6"
                />

                {/* STEP 1: Upload and options */}
                {currentStep === 0 && (
                    <div className="space-y-4">
                        <Alert
                            message="Hướng dẫn Import"
                            description={
                                <div className="text-sm">
                                    <p>1. Tải file mẫu Excel bên dưới để điền dữ liệu theo đúng cấu trúc cột.</p>
                                    <p>2. {isAdmin ? 'Chọn Khoa quản lý (bắt buộc dành cho Admin).' : 'Hệ thống tự động lưu vào Khoa của bạn.'}</p>
                                    <p>3. Kéo thả file Excel/CSV vào ô bên dưới để xử lý.</p>
                                </div>
                            }
                            type="info"
                            showIcon
                        />

                        {isAdmin && (
                            <div className="bg-slate-50 dark:bg-gray-800/40 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                                <div className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                                    Chọn Khoa quản lý nhận dữ liệu <span className="text-red-500">*</span>
                                </div>
                                <Select
                                    placeholder="Vui lòng chọn Khoa quản lý..."
                                    className="w-full h-10"
                                    value={selectedFacultyId}
                                    onChange={setSelectedFacultyId}
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {faculties.map(f => (
                                        <Option key={f.id} value={f.id}>{f.name}</Option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        <Button
                            icon={<DownloadOutlined />}
                            onClick={downloadTemplate}
                            className="w-full h-10 border-green-500 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                            Tải file mẫu (.xlsx)
                        </Button>

                        <Dragger
                            name="file"
                            multiple={false}
                            accept=".csv,.xlsx,.xls"
                            beforeUpload={handleBeforeUpload}
                            showUploadList={false}
                            disabled={isAdmin && !selectedFacultyId}
                        >
                            <p className="text-4xl text-gray-300 mb-2"><InboxOutlined /></p>
                            <p className="text-gray-600 font-medium dark:text-gray-300">Kéo thả file vào đây hoặc bấm để chọn file</p>
                            <p className="text-gray-400 text-xs mt-1">Hỗ trợ: .csv, .xlsx, .xls</p>
                            {isAdmin && !selectedFacultyId && (
                                <p className="text-red-400 text-xs mt-2 font-medium">⚠ Hãy chọn Khoa trước khi upload file</p>
                            )}
                        </Dragger>
                    </div>
                )}

                {/* STEP 2: Processing */}
                {currentStep === 1 && (
                    <div className="py-10 text-center space-y-4">
                        <Spin size="large" />
                        <Title level={5} className="m-0 dark:text-gray-200">Đang phân tích cấu trúc file...</Title>
                        <Text className="text-slate-400">Vui lòng đợi trong giây lát, hệ thống đang đọc dữ liệu Excel.</Text>
                    </div>
                )}

                {/* STEP 3: Preview */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <Alert
                            message={
                                <div>
                                    Phát hiện <strong className="text-green-600">{parsedRows.length} dòng</strong> dữ liệu từ file <strong>{originalFile?.name}</strong>.
                                    {isAdmin && (
                                        <span> Dữ liệu sẽ được ghi nhận vào khoa: <strong>{faculties.find(f => f.id === selectedFacultyId)?.name}</strong>.</span>
                                    )}
                                </div>
                            }
                            type="success"
                            showIcon
                        />

                        {result ? (
                            <div className="space-y-3">
                                <Alert
                                    message={result.message}
                                    type={result.inserted > 0 ? 'success' : 'warning'}
                                    showIcon
                                />
                                <div className="flex gap-2">
                                    <Tag color="blue">Tổng số: {result.total} dòng</Tag>
                                    <Tag color="green">Thành công: {result.inserted}</Tag>
                                    <Tag color="orange">Trùng (Bỏ qua): {result.skipped}</Tag>
                                    <Tag color="red">Lỗi: {result.errors?.length || 0}</Tag>
                                </div>
                                {result.errors?.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 max-h-40 overflow-y-auto">
                                        {result.errors.map((err, idx) => (
                                            <p key={idx} className="text-red-500 dark:text-red-400 text-xs mb-1">⚠ {err}</p>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-end mt-4">
                                    <Button type="primary" onClick={handleClose} className="bg-blue-600 border-none text-white rounded-lg">
                                        Đóng lại
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bộ lọc trạng thái:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <Button size="small" type={filterType === 'all' ? 'primary' : 'default'} onClick={() => setFilterType('all')} className="rounded-full text-xs">
                                            Tất cả ({counts.all})
                                        </Button>
                                        <Button size="small" type={filterType === 'success' ? 'primary' : 'default'} onClick={() => setFilterType('success')} className={`rounded-full text-xs ${filterType === 'success' ? '!bg-green-600 !border-green-600' : ''}`}>
                                            🟢 Hợp lệ ({counts.success})
                                        </Button>
                                        <Button size="small" type={filterType === 'warning' ? 'primary' : 'default'} onClick={() => setFilterType('warning')} className={`rounded-full text-xs ${filterType === 'warning' ? '!bg-orange-500 !border-orange-500 text-white' : ''}`}>
                                            ⚠️ Cảnh báo ({counts.warning})
                                        </Button>
                                        <Button size="small" type={filterType === 'error' ? 'primary' : 'default'} onClick={() => setFilterType('error')} className={`rounded-full text-xs ${filterType === 'error' ? '!bg-red-600 !border-red-600 text-white' : ''}`}>
                                            🚫 Lỗi liên kết ({counts.error})
                                        </Button>
                                        <Button size="small" type={filterType === 'duplicate' ? 'primary' : 'default'} onClick={() => setFilterType('duplicate')} className={`rounded-full text-xs ${filterType === 'duplicate' ? '!bg-red-600 !border-red-600 text-white' : ''}`}>
                                            ⛔ Trùng lặp ({counts.duplicate})
                                        </Button>
                                    </div>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto border border-slate-200 dark:border-gray-700 rounded-xl">
                                    <Table
                                        columns={getPreviewColumns()}
                                        dataSource={getFilteredRows()}
                                        rowKey={(record, index) => index}
                                        pagination={{ pageSize: 10 }}
                                        size="middle"
                                        scroll={{ x: 'max-content' }}
                                    />
                                </div>

                                {counts.error + counts.duplicate > 0 && (
                                    <Alert
                                        message={`Lưu ý: Có ${counts.error + counts.duplicate} dòng bị lỗi liên kết hoặc trùng lặp sẽ tự động bị bỏ qua khi import.`}
                                        type="warning"
                                        showIcon
                                        className="mt-3"
                                    />
                                )}

                                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
                                    <Button icon={<ArrowLeftOutlined />} onClick={handleReset} disabled={uploading}>
                                        Tải lại file khác
                                    </Button>
                                    <Space>
                                        <Button onClick={handleClose} disabled={uploading}>
                                            Hủy
                                        </Button>
                                        <Button
                                            type="primary"
                                            icon={uploading ? <Spin size="small" /> : <CheckCircleOutlined />}
                                            onClick={handleConfirmImport}
                                            loading={uploading}
                                            disabled={counts.success + counts.warning === 0}
                                            className="bg-green-600 hover:bg-green-500 border-none text-white rounded-lg animate-pulse"
                                        >
                                            Xác nhận Import ({counts.success + counts.warning} dòng)
                                        </Button>
                                    </Space>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportModal;
