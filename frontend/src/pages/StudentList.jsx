import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Tag, Card, Row, Col, Statistic, Form, Input, Select, Button, Modal, message, Space, DatePicker, InputNumber, Popover, Badge, Divider, Switch, App as AntApp, Spin, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SyncOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, UploadOutlined, DownloadOutlined, FilterOutlined, SortAscendingOutlined, ClearOutlined, CalendarOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';

const { Option } = Select;

const StudentList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userCookie = Cookies.get('user');
    let user = null;
    try { if (userCookie) user = JSON.parse(userCookie); } catch (e) { console.error(e); }
    const [data, setData] = useState([]);
    const { modal } = AntApp.useApp();
    const [stats, setStats] = useState(null);
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [sortOption, setSortOption] = useState(null);
    const [dateRange, setDateRange] = useState(null);
    const [filterEnterprise, setFilterEnterprise] = useState(null);
    const [filterMajor, setFilterMajor] = useState(null);
    const [filterGpa, setFilterGpa] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const [faculties, setFaculties] = useState([]);
    const [filterFaculty, setFilterFaculty] = useState(undefined);
    const [showDeleted, setShowDeleted] = useState(false);

    useEffect(() => {
        document.title = "Quản lý Sinh viên | VLU Enterprise Link Manager";
        fetchStats();
        fetchEnterprises();
        if (user?.role === 'ADMIN') fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/structure/faculties');
            setFaculties(res.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (location.state?.openModalWithData) {
            const { actionType, data } = location.state.openModalWithData;
            if (actionType === 'create_student') {
                setEditingId(null);
                form.resetFields();
                form.setFieldsValue({
                    student_code: data.student_code,
                    name: data.name,
                    major: data.major,
                    class: data.class,
                    gpa: data.gpa,
                    status: data.status || 'Chờ phân công',
                    start_date: data.start_date ? dayjs(data.start_date) : null,
                    end_date: data.end_date ? dayjs(data.end_date) : null,
                    ...data
                });
                setIsModalVisible(true);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, form, navigate]);

    useEffect(() => {
        fetchData();
    }, [showDeleted, filterFaculty]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/students?is_deleted=${showDeleted ? 1 : 0}`;
            if (filterFaculty) url += `&faculty_id=${filterFaculty}`;
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu sinh viên');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/students/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchEnterprises = async () => {
        try {
            const res = await api.get('/enterprises');
            setEnterprises(res.data);
        } catch (error) {
            console.error('Error fetching enterprises:', error);
        }
    };

    const handleSave = async (values) => {
        try {
            const formattedValues = {
                ...values,
                start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
            };
            if (editingId) {
                await api.put(`/students/${editingId}`, formattedValues);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/students', formattedValues);
                message.success('Thêm mới thành công');
            }
            setIsModalVisible(false);
            setEditingId(null);
            fetchData();
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/students/${id}`);
            message.success('Xóa thành công');
            fetchData();
            fetchStats();
            setSelectedRowKeys(prev => prev.filter(key => key !== id));
        } catch (error) {
            message.error('Lỗi khi xóa dữ liệu');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/students/${id}/restore`);
            message.success('Khôi phục sinh viên thành công');
            fetchData();
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi khôi phục sinh viên');
        }
    };

    const handleBulkDelete = () => {
        modal.confirm({
            title: `Xác nhận xóa ${selectedRowKeys.length} sinh viên?`,
            content: 'Hành động này không thể hoàn tác.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedRowKeys.map(id => api.delete(`/students/${id}`)));
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} sinh viên`);
                    setSelectedRowKeys([]);
                    fetchData();
                    fetchStats();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa hàng loạt');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleBulkUpdateStatus = (status) => {
        modal.confirm({
            title: `Xác nhận chuyển ${selectedRowKeys.length} sinh viên sang "${status}"?`,
            okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedRowKeys.map(id => {
                        const student = data.find(item => item.id === id);
                        if (!student) return Promise.resolve();
                        const payload = {
                            ...student,
                            status,
                            class: student.class,
                            start_date: student.start_date ? dayjs(student.start_date).format('YYYY-MM-DD') : null,
                            end_date: student.end_date ? dayjs(student.end_date).format('YYYY-MM-DD') : null
                        };
                        return api.put(`/students/${id}`, payload);
                    }));
                    message.success(`Cập nhật trạng thái thành công cho ${selectedRowKeys.length} sinh viên`);
                    setSelectedRowKeys([]);
                    fetchData();
                    fetchStats();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi cập nhật hàng loạt');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const removeAccents = (str) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const filterOptionIgnoreCase = (input, option) => 
        removeAccents(option?.children || '').includes(removeAccents(input));

    const handleExport = () => {
        const exportData = data.map(item => ({
            'Mã Sinh Viên': item.student_code,
            'Họ và Tên': item.name,
            'Lớp': item.class,
            'Khoa': item.faculty,
            'Hoạt động tham gia': item.activity_title,
            'Trạng thái': item.status,
            'Nơi thực tập/Làm việc': item.enterprise_name,
            'Thời gian làm việc (tháng)': item.duration_months
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        const columnWidths = [
            { wch: 15 }, // Mã SV
            { wch: 25 }, // Tên
            { wch: 15 }, // Lớp
            { wch: 25 }, // Khoa
            { wch: 40 }, // Hoạt động
            { wch: 20 }, // Trạng thái
            { wch: 30 }, // Nơi
            { wch: 25 }  // Thời gian
        ];
        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách Sinh viên");
        XLSX.writeFile(wb, `Danh_Sach_Sinh_Vien_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const openEditModal = (record) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
            faculty_id: record.faculty_id,
            start_date: record.start_date ? dayjs(record.start_date) : null,
            end_date: record.end_date ? dayjs(record.end_date) : null,
        });
        setIsModalVisible(true);
    };

    const statusConfig = {
        'Đang thực tập': { color: 'processing', icon: <SyncOutlined spin /> },
        'Hoàn thành': { color: 'success', icon: <CheckCircleOutlined /> },
        'Chờ phân công': { color: 'warning', icon: <ClockCircleOutlined /> },
    };

    const tabs = [
        { key: 'all', label: 'Tất cả' },
        { key: 'Đang thực tập', label: 'Đang thực tập' },
        { key: 'Chờ phân công', label: 'Chờ phân công' },
        { key: 'Hoàn thành', label: 'Hoàn thành' },
    ];

    // Unique values for filter dropdowns
    const uniqueMajors = [...new Set(data.map(item => item.major).filter(Boolean))];

    // Client-side filtering + sorting
    const filteredData = data.filter(item => {
        const q = searchText.toLowerCase();
        const matchSearch = !searchText ||
            item.student_code?.toLowerCase().includes(q) ||
            item.name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q);
        const matchTab = activeTab === 'all' || item.status === activeTab;
        const matchEnterprise = !filterEnterprise || item.enterprise_id === filterEnterprise;
        const matchMajor = !filterMajor || item.major === filterMajor;
        
        let matchGpa = true;
        if (filterGpa) {
            const gpa = parseFloat(item.gpa) || 0;
            if (filterGpa === 'excellent') matchGpa = gpa >= 8.0;
            else if (filterGpa === 'good') matchGpa = gpa >= 7.0 && gpa < 8.0;
            else if (filterGpa === 'average') matchGpa = gpa >= 5.0 && gpa < 7.0;
            else if (filterGpa === 'poor') matchGpa = gpa < 5.0;
        }

        let matchDateRange = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
            const startDate = dayjs(item.start_date);
            matchDateRange = item.start_date && startDate.isAfter(dateRange[0].startOf('day').subtract(1, 'ms')) && startDate.isBefore(dateRange[1].endOf('day').add(1, 'ms'));
        }
        return matchSearch && matchTab && matchEnterprise && matchMajor && matchGpa && matchDateRange;
    }).sort((a, b) => {
        if (!sortOption) return 0;
        switch (sortOption) {
            case 'name_asc': return (a.name || '').localeCompare(b.name || '', 'vi');
            case 'name_desc': return (b.name || '').localeCompare(a.name || '', 'vi');
            case 'code_asc': return (a.student_code || '').localeCompare(b.student_code || '');
            case 'code_desc': return (b.student_code || '').localeCompare(a.student_code || '');
            case 'gpa_desc': return (b.gpa || 0) - (a.gpa || 0);
            case 'gpa_asc': return (a.gpa || 0) - (b.gpa || 0);
            case 'created_newest': return new Date(b.created_at) - new Date(a.created_at);
            case 'created_oldest': return new Date(a.created_at) - new Date(b.created_at);
            default: return 0;
        }
    });

    const activeFilterCount = [sortOption, dateRange, filterEnterprise, filterMajor, filterGpa, showDeleted ? true : null, filterFaculty].filter(v => v !== null && v !== undefined).length;

    const sortOptions = [
        { value: 'name_asc', label: '🔤 Tên (A → Z)' },
        { value: 'name_desc', label: '🔤 Tên (Z → A)' },
        { value: 'code_asc', label: '🆔 MSSV (A → Z)' },
        { value: 'code_desc', label: '🆔 MSSV (Z → A)' },
        { value: 'gpa_desc', label: '🏆 GPA (Cao → Thấp)' },
        { value: 'gpa_asc', label: '🏆 GPA (Thấp → Cao)' },
        { value: 'created_newest', label: '📅 Mới nhất' },
        { value: 'created_oldest', label: '📅 Cũ nhất' },
    ];

    const filterContent = (
        <div className="flex flex-col gap-3 w-72 p-1">
            <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><SortAscendingOutlined /> Sắp xếp</div>
                <Select allowClear placeholder="Chọn cách sắp xếp..." onChange={setSortOption} value={sortOption} className="w-full" options={sortOptions} />
            </div>
            <Divider className="my-0" />
            <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CalendarOutlined /> Khoảng thời gian thực tập</div>
                <DatePicker.RangePicker
                    className="w-full"
                    format="DD/MM/YYYY"
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder={['Từ ngày', 'Đến ngày']}
                    allowClear
                />
            </div>
            <Divider className="my-0" />
            <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><FilterOutlined /> Bộ lọc</div>
                <div className="flex flex-col gap-2">
                    {user?.role === 'ADMIN' && (
                        <Select allowClear placeholder="Lọc theo khoa" onChange={setFilterFaculty} value={filterFaculty} className="w-full">
                            {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                        </Select>
                    )}
                    <Select allowClear placeholder="Doanh nghiệp thực tập" onChange={setFilterEnterprise} value={filterEnterprise} className="w-full" showSearch filterOption={filterOptionIgnoreCase}>
                        {enterprises.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Ngành học" onChange={setFilterMajor} value={filterMajor} className="w-full" showSearch filterOption={filterOptionIgnoreCase}>
                        {uniqueMajors.map(m => <Option key={m} value={m}>{m}</Option>)}
                    </Select>
                    <Select allowClear placeholder="Mức GPA" onChange={setFilterGpa} value={filterGpa} className="w-full">
                        <Option value="excellent">Giỏi / Xuất sắc (≥ 8.0)</Option>
                        <Option value="good">Khá (7.0 - 7.9)</Option>
                        <Option value="average">Trung bình (5.0 - 6.9)</Option>
                        <Option value="poor">Yếu (&lt; 5.0)</Option>
                    </Select>
                </div>
            </div>
            <Divider className="my-0" />
            <div className="flex justify-between items-center py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><DeleteOutlined /> Hiển thị đã xóa</span>
                <Switch size="small" checked={showDeleted} onChange={setShowDeleted} />
            </div>
            <Button icon={<ClearOutlined />} type="default" block onClick={() => {
                setSortOption(null); setDateRange(null); setFilterEnterprise(null); setFilterMajor(null); setFilterGpa(null); setShowDeleted(false); setFilterFaculty(undefined);
            }}>Xóa tất cả bộ lọc</Button>
        </div>
    );

    const columns = [
        { 
            title: 'MSSV', 
            dataIndex: 'student_code', 
            key: 'student_code', 
            width: 100,
            fixed: 'left',
            render: (text) => <span className="font-semibold text-gray-700 dark:text-gray-200">{text}</span>
        },
        { 
            title: 'Họ tên', 
            key: 'name',
            width: 200,
            fixed: 'left',
            render: (_, record) => (
                <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{record.name}</div>
                    <div className="text-xs text-gray-400">{record.email}</div>
                </div>
            )
        },
        { title: 'Ngành học', dataIndex: 'major', key: 'major', ellipsis: true },
        { title: 'Lớp', dataIndex: 'class', key: 'class', width: 110 },
        ...(user?.role === 'ADMIN' ? [{
            title: 'Khoa',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            width: 160,
            render: (text) => text ? <Tag color="orange">{text}</Tag> : <span className="text-slate-300 italic">Chưa phân khoa</span>
        }] : []),
        { 
            title: 'Doanh nghiệp', 
            dataIndex: 'enterprise_name', 
            key: 'enterprise_name',
            render: (text) => text || <span className="text-gray-300">Chưa phân công</span>
        },
        { 
            title: 'GPA', 
            dataIndex: 'gpa', 
            key: 'gpa', 
            width: 70,
            align: 'center',
            render: (gpa) => gpa ? <span className="font-bold text-blue-600">{gpa}</span> : '---'
        },
        { 
            title: 'Trạng thái', 
            dataIndex: 'status', 
            key: 'status',
            width: 140,
            render: (status, record) => {
                if (record.is_deleted === 1) {
                    return <Tag color="red" className="rounded-full px-3 py-0.5">Đã xóa</Tag>;
                }
                const config = statusConfig[status] || { color: 'default' };
                return <Tag icon={config.icon} color={config.color} className="rounded-full px-3 py-0.5">{status}</Tag>;
            }
        },
        { 
            title: 'Thời gian', 
            key: 'duration',
            width: 200,
            render: (_, record) => (
                <span className="text-xs text-gray-500">
                    {record.start_date ? dayjs(record.start_date).format('DD/MM/YYYY') : '---'} — {record.end_date ? dayjs(record.end_date).format('DD/MM/YYYY') : '---'}
                </span>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 90,
            fixed: 'right',
            align: 'center',
            render: (_, record) => {
                const isDeleted = record.is_deleted === 1;
                if (isDeleted) {
                    return (
                        <Space>
                            <Button 
                                type="primary" 
                                size="small" 
                                className="bg-green-600 hover:bg-green-500 text-white border-0 rounded-md" 
                                onClick={() => handleRestore(record.id)}
                            >
                                Khôi phục
                            </Button>
                        </Space>
                    );
                }
                return (
                    <Space>
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => {
                            modal.confirm({ title: 'Xác nhận xóa sinh viên này?', okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' }, onOk: () => handleDelete(record.id) });
                        }} />
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <TeamOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Quản lý sinh viên</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">{data.length} sinh viên · {stats?.active || 0} đang thực tập</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto header-actions">
                    <Button 
                        size="middle"
                        icon={<UploadOutlined />} 
                        onClick={() => setShowImport(true)} 
                        className="border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg shadow-sm font-medium hover:border-purple-700 flex-1 sm:flex-initial"
                    >
                        Import
                    </Button>
                    <Button 
                        size="middle"
                        icon={<DownloadOutlined />} 
                        onClick={handleExport}
                        className="border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg shadow-sm font-medium hover:border-emerald-700 flex-1 sm:flex-initial"
                    >
                        Xuất Excel
                    </Button>
                    <Button 
                        size="middle"
                        type="primary" 
                        className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium flex-1 sm:flex-initial"
                        icon={<PlusOutlined />} 
                        onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}
                    >
                        Thêm sinh viên
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Green Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl p-4 sm:p-5 border-l-4 border-l-emerald-500 border-t border-r border-b border-slate-100 dark:border-emerald-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <SyncOutlined className="text-5xl sm:text-6xl text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <SyncOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 leading-none mb-1">{stats?.active || 0}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-emerald-600/80 uppercase tracking-wider">Đang thực tập</div>
                        </div>
                    </div>
                </div>

                {/* Orange Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 rounded-2xl p-4 sm:p-5 border-l-4 border-l-orange-500 border-t border-r border-b border-slate-100 dark:border-orange-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <ClockCircleOutlined className="text-5xl sm:text-6xl text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <ClockCircleOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-orange-800 dark:text-orange-400 leading-none mb-1">{stats?.pending || 0}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-orange-600/80 uppercase tracking-wider">Chờ phân công</div>
                        </div>
                    </div>
                </div>

                {/* Blue Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl p-4 sm:p-5 border-l-4 border-l-blue-500 border-t border-r border-b border-slate-100 dark:border-blue-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <CheckCircleOutlined className="text-5xl sm:text-6xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <CheckCircleOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-800 dark:text-blue-400 leading-none mb-1">{stats?.completed || 0}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-blue-600/80 uppercase tracking-wider">Đã hoàn thành</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs + Search + Filter Popover */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-slate-100 dark:bg-gray-800/50 rounded-lg p-1 border border-transparent">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                ${activeTab === tab.key 
                                    ? 'bg-white dark:bg-gray-700 shadow-sm dark:shadow-none text-vluRed dark:text-red-400' 
                                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-2 sm:mt-0 w-full sm:w-auto">
                    <Input 
                        placeholder="Tìm kiếm sinh viên..." 
                        prefix={<SearchOutlined className="text-gray-300" />}
                        className="w-full sm:w-64 rounded-lg"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                    <Popover content={filterContent} title="Bộ lọc & Sắp xếp" trigger="click" placement="bottomRight">
                        <Button icon={<FilterOutlined />} className="h-8 rounded-lg text-gray-600">
                            Bộ lọc {activeFilterCount > 0 && <Badge count={activeFilterCount} size="small" offset={[2, -2]} style={{ backgroundColor: '#1677ff' }} />}
                        </Button>
                    </Popover>
                </div>
            </div>

            {/* Floating Action Bar for Bulk Selection */}
            {selectedRowKeys.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in-up md:animate-fade-in-up-centered">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">
                            {selectedRowKeys.length}
                        </span>
                        <span className="text-slate-700 dark:text-gray-200 text-sm font-semibold hidden xs:inline">Sinh viên đã chọn</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <Select
                            placeholder="Đổi trạng thái..."
                            onChange={handleBulkUpdateStatus}
                            className="w-36 sm:w-40"
                            size="middle"
                        >
                            <Option value="Đang thực tập">Đang thực tập</Option>
                            <Option value="Hoàn thành">Hoàn thành</Option>
                            <Option value="Chờ phân công">Chờ phân công</Option>
                        </Select>
                        <Button 
                            type="primary"
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={handleBulkDelete}
                            className="flex items-center justify-center font-medium"
                        >
                            Xóa
                        </Button>
                        <Button 
                            type="text" 
                            onClick={() => setSelectedRowKeys([])}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <Table 
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    columns={columns} 
                    dataSource={filteredData} 
                    rowKey="id" 
                    loading={loading}
                    rowClassName={(record) => record.is_deleted === 1 ? 'opacity-65 bg-red-50/20 dark:bg-red-955/10' : ''}
                    scroll={{ x: 'max-content' }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    className="student-table"
                    size="middle"
                />
            </div>

            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
                {!loading && filteredData.length > 0 && (
                    <div className="bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-200 dark:border-gray-700 mb-2 flex items-center justify-between">
                        <Checkbox
                            checked={filteredData.length > 0 && selectedRowKeys.length === filteredData.length}
                            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredData.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRowKeys(filteredData.map(std => std.id));
                                } else {
                                    setSelectedRowKeys([]);
                                }
                            }}
                        >
                            Chọn tất cả ({filteredData.length} sinh viên)
                        </Checkbox>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-10"><Spin size="large" /></div>
                ) : filteredData.length === 0 ? (
                    <Card className="text-center py-6 text-gray-400">Không có dữ liệu</Card>
                ) : (
                    filteredData.map(record => {
                        const isChecked = selectedRowKeys.includes(record.id);
                        return (
                            <Card
                                key={record.id}
                                className={`shadow-sm border rounded-xl bg-white dark:bg-gray-800 transition-colors ${
                                    isChecked 
                                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50/5 dark:bg-blue-955/5' 
                                        : 'border-slate-200 dark:border-gray-700'
                                } ${record.is_deleted === 1 ? 'opacity-65 bg-red-50/10' : ''}`}
                                title={
                                    <div className="flex items-center justify-between gap-3 w-full">
                                        <span className="font-semibold text-slate-800 dark:text-gray-100 truncate">
                                            {record.name}
                                        </span>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-xs text-gray-400">{record.student_code}</span>
                                            {record.is_deleted !== 1 && (
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedRowKeys([...selectedRowKeys, record.id]);
                                                        } else {
                                                            setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.id));
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                }
                            >
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-400 font-medium">Lớp:</span>{' '}
                                    <span className="text-slate-700 dark:text-gray-300 font-semibold">{record.class}</span>
                                    <span className="text-gray-400 font-medium ml-4">GPA:</span>{' '}
                                    <span className="font-bold text-blue-600">{record.gpa || '---'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-medium">Ngành:</span>{' '}
                                    <span className="text-slate-700 dark:text-gray-300">{record.major}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-medium">Nơi thực tập:</span>{' '}
                                    <span className="text-slate-700 dark:text-gray-300 font-semibold">{record.enterprise_name || 'Chưa phân công'}</span>
                                </div>
                                {user?.role === 'ADMIN' && record.faculty_name && (
                                    <div>
                                        <span className="text-gray-400 font-medium">Khoa:</span>{' '}
                                        <Tag color="orange">{record.faculty_name}</Tag>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                    <div>
                                        {record.is_deleted === 1 ? (
                                            <Tag color="red">Đã xóa</Tag>
                                        ) : (
                                            <Tag color={statusConfig[record.status]?.color || 'default'}>{record.status}</Tag>
                                        )}
                                    </div>
                                    <Space>
                                        {record.is_deleted !== 1 ? (
                                            <>
                                                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => {
                                                    modal.confirm({ title: 'Xác nhận xóa sinh viên này?', okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' }, onOk: () => handleDelete(record.id) });
                                                }} />
                                            </>
                                        ) : (
                                            <Button type="primary" size="small" className="bg-green-600 hover:bg-green-500 text-white border-0 rounded-md" onClick={() => handleRestore(record.id)}>Khôi phục</Button>
                                        )}
                                    </Space>
                                </div>
                            </div>
                        </Card>
                    );
                }))}
            </div>

            {/* Modal Form */}
            <Modal 
                title={editingId ? 'Chỉnh sửa thông tin sinh viên' : 'Thêm sinh viên mới'} 
                open={isModalVisible} 
                onCancel={() => { setIsModalVisible(false); setEditingId(null); }}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    {user?.role === 'ADMIN' && (
                        <Form.Item name="faculty_id" label="Khoa quản lý" rules={[{ required: true, message: 'Vui lòng chọn khoa!' }]}>
                            <Select placeholder="Chọn khoa...">
                                {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                            </Select>
                        </Form.Item>
                    )}
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="student_code" label="MSSV" rules={[{ required: true }]}>
                                <Input placeholder="VD: 207CT50111" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
                                <Input placeholder="VD: Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="email" label="Email">
                                <Input placeholder="VD: sv@student.edu.vn" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="major" label="Ngành học">
                                <Input placeholder="VD: Kỹ thuật Phần mềm" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="class" label="Lớp">
                                <Input placeholder="VD: K26-IT1" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="gpa" label="GPA">
                                <InputNumber min={0} max={4} step={0.1} className="w-full" placeholder="VD: 3.5" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="advisor" label="Giảng viên hướng dẫn">
                                <Input placeholder="VD: TS. Nguyễn Văn Hùng" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="enterprise_id" label="Công ty thực tập">
                                <Select allowClear showSearch placeholder="Chọn công ty" filterOption={filterOptionIgnoreCase}>
                                    {enterprises.map(e => (
                                        <Option key={e.id} value={e.id}>{e.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="position" label="Vị trí thực tập">
                                <Input placeholder="VD: Frontend Developer" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Trạng thái" initialValue="Chờ phân công">
                                <Select>
                                    <Option value="Đang thực tập">Đang thực tập</Option>
                                    <Option value="Hoàn thành">Hoàn thành</Option>
                                    <Option value="Chờ phân công">Chờ phân công</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="start_date" label="Ngày bắt đầu">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_date" label="Ngày kết thúc">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                        <Button onClick={() => { setIsModalVisible(false); setEditingId(null); }} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium" size="large">
                            {editingId ? 'Cập nhật' : 'Thêm sinh viên'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <ImportModal
                open={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={() => { fetchData(); fetchStats(); }}
                type="students"
                templateColumns={['MSSV', 'Họ tên', 'Email', 'Lớp', 'Ngành học', 'Giảng viên HD', 'enterprise_id', 'Vị trí', 'Trạng thái', 'GPA', 'Ngày bắt đầu', 'Ngày kết thúc']}
            />
        </div>
    );
};

export default StudentList;
