import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Form, Select, Button, Modal, message, Input, DatePicker, TimePicker, Statistic, Spin, Empty, Tooltip, Drawer, Descriptions, Popover, Badge, Divider, Pagination, Checkbox, Switch, Space, App as AntApp } from 'antd';
import {
    ClockCircleOutlined, SyncOutlined, CheckOutlined, PauseCircleOutlined,
    UploadOutlined, DownloadOutlined, PlusOutlined, CheckCircleOutlined,
    TeamOutlined, SearchOutlined, SortAscendingOutlined, CalendarOutlined,
    FilterOutlined, ClearOutlined, AppstoreOutlined, UnorderedListOutlined,
    DeleteOutlined, BankOutlined, EditOutlined
} from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';

const { Option } = Select;

const ActivityList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { modal } = AntApp.useApp();
    const userCookie = Cookies.get('user');
    let user = null;
    try {
        if (userCookie) user = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    const isLecturer = user?.role === 'LECTURER';

    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [activityTypes, setActivityTypes] = useState([]);
    const [targets, setTargets] = useState([]);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);
    const [filterEnterprise, setFilterEnterprise] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [editingId, setEditingId] = useState(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [sortOption, setSortOption] = useState(null);
    const [dateRange, setDateRange] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [selectedActivities, setSelectedActivities] = useState([]);

    // Faculty states for admin filtering
    const [faculties, setFaculties] = useState([]);
    const [filterFaculty, setFilterFaculty] = useState(undefined);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterType, filterStatus, filterEnterprise, dateRange, sortOption]);

    const [showDeleted, setShowDeleted] = useState(false);

    useEffect(() => {
        document.title = "Hoạt động Hợp tác | VLU Enterprise Link Manager";
        fetchStats();
        fetchEnterprises();
        fetchActivityTypes();
        fetchTargets();
        if (user?.role === 'ADMIN') fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/structure/faculties');
            setFaculties(res.data || []);
        } catch (e) {
            console.error('Failed to fetch faculties:', e);
        }
    };

    useEffect(() => {
        if (location.state?.openModalWithData) {
            const { actionType, data } = location.state.openModalWithData;
            if (actionType === 'create_activity') {
                setEditingId(null);
                form.resetFields();
                form.setFieldsValue({
                    title: data.title,
                    person_in_charge: data.person_in_charge,
                    status: data.status || 'Đề xuất',
                    start_date: data.start_date ? dayjs(data.start_date) : dayjs(),
                    end_date: data.end_date ? dayjs(data.end_date) : null,
                    start_time: data.start_time ? dayjs(`1970-01-01 ${data.start_time}`) : null,
                    end_time: data.end_time ? dayjs(`1970-01-01 ${data.end_time}`) : null,
                    collaboration_date: data.collaboration_date ? dayjs(data.collaboration_date) : null,
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

    const fetchActivityTypes = async () => {
        try {
            const res = await api.get('/structure/act-types');
            setActivityTypes(res.data || []);
        } catch (e) { console.log(e); }
    };

    const fetchTargets = async () => {
        try {
            const res = await api.get('/structure/targets');
            setTargets(res.data || []);
        } catch (e) { console.log(e); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/activities?is_deleted=${showDeleted ? 1 : 0}`;
            if (filterFaculty) url += `&faculty_id=${filterFaculty}`;
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu hoạt động');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/activities/stats');
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

    const submitSave = async (values) => {
        try {
            const formattedValues = {
                ...values,
                start_date: values.start_date?.format('YYYY-MM-DD'),
                end_date: values.end_date?.format('YYYY-MM-DD') || null,
                start_time: values.start_time?.format('HH:mm:ss') || null,
                end_time: values.end_time?.format('HH:mm:ss') || null,
                collaboration_date: values.collaboration_date?.format('YYYY-MM-DD') || null,
                type_ids: values.type_ids || [],
                target_ids: values.target_ids || [],
            };
            if (editingId) {
                await api.put(`/activities/${editingId}`, formattedValues);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/activities', formattedValues);
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

    const handleSave = async (values) => {
        // Validate dates and times
        if (values.start_date && values.end_date) {
            if (values.end_date.isBefore(values.start_date, 'day')) {
                message.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
                return;
            }
            if (values.start_date.isSame(values.end_date, 'day') && values.start_time && values.end_time) {
                if (values.end_time.isBefore(values.start_time, 'second') || values.end_time.isSame(values.start_time, 'second')) {
                    message.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu khi trong cùng một ngày');
                    return;
                }
            }
        }

        // Check overlap
        const sDate = values.start_date.format('YYYY-MM-DD');
        const eDate = values.end_date ? values.end_date.format('YYYY-MM-DD') : sDate;
        const sTime = values.start_time ? values.start_time.format('HH:mm:ss') : '00:00:00';
        const eTime = values.end_time ? values.end_time.format('HH:mm:ss') : '23:59:59';
        const newStart = dayjs(`${sDate} ${sTime}`);
        const newEnd = dayjs(`${eDate} ${eTime}`);

        const isOverlap = data.some(act => {
            if (act.id === editingId) return false;

            if (!act.start_date) return false;
            const actSDate = dayjs(act.start_date).format('YYYY-MM-DD');
            const actEDate = act.end_date ? dayjs(act.end_date).format('YYYY-MM-DD') : actSDate;
            const actSTime = act.start_time || '00:00:00';
            const actETime = act.end_time || '23:59:59';

            const actStart = dayjs(`${actSDate} ${actSTime}`);
            const actEnd = dayjs(`${actEDate} ${actETime}`);

            return newStart.isBefore(actEnd) && newEnd.isAfter(actStart);
        });

        if (isOverlap) {
            modal.confirm({
                title: 'Cảnh báo trùng lặp thời gian',
                content: 'Thời gian của hoạt động này đang bị trùng với một hoạt động khác. Bạn có chắc chắn muốn tiếp tục lưu?',
                okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
                onOk: () => submitSave(values),
            });
            return;
        }

        submitSave(values);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/activities/${id}`);
            message.success('Xóa thành công');
            fetchData();
            fetchStats();
            setSelectedActivities(prev => prev.filter(aid => aid !== id));
        } catch (error) {
            message.error('Lỗi khi xóa');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.post(`/activities/${id}/restore`);
            message.success('Khôi phục hoạt động thành công');
            fetchData();
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi khôi phục hoạt động');
        }
    };

    const handleBulkDelete = () => {
        modal.confirm({
            title: `Xác nhận xóa ${selectedActivities.length} hoạt động?`,
            content: 'Hành động này không thể hoàn tác.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedActivities.map(id => api.delete(`/activities/${id}`)));
                    message.success(`Đã xóa thành công ${selectedActivities.length} hoạt động`);
                    setSelectedActivities([]);
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
            title: `Xác nhận chuyển ${selectedActivities.length} hoạt động sang "${status}"?`,
            okButtonProps: { className: '!bg-blue-600 hover:!bg-blue-500 text-white' },
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedActivities.map(id => api.put(`/activities/${id}/status`, { status })));
                    message.success(`Cập nhật trạng thái thành công cho ${selectedActivities.length} hoạt động`);
                    setSelectedActivities([]);
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

    const handleToggleActivity = (id) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/activities/${id}/status`, { status });
            message.success('Cập nhật trạng thái thành công');
            fetchData();
            fetchStats();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    const statusConfig = {
        'Đề xuất': { colorClass: 'text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30', icon: <ClockCircleOutlined /> },
        'Phê duyệt nội bộ': { colorClass: 'text-orange-600 bg-orange-50 dark:text-orange-500 dark:bg-orange-900/40', icon: <SyncOutlined spin /> },
        'Đã triển khai': { colorClass: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30', icon: <CheckOutlined /> },
        'Đã kết thúc': { colorClass: 'text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30', icon: <PauseCircleOutlined /> },
    };

    const typeConfig = {
        'Tuyển dụng & Thực tập': { colorClass: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30', ringClass: 'ring-red-500 dark:ring-red-400' },
        'Hội thảo & Đào tạo': { colorClass: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30', ringClass: 'ring-blue-500 dark:ring-blue-400' },
        'Tài trợ & Học bổng': { colorClass: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30', ringClass: 'ring-green-500 dark:ring-green-400' },
        'Tham quan doanh nghiệp': { colorClass: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/30', ringClass: 'ring-cyan-500 dark:ring-cyan-400' },
        'Kiểm định & Đánh giá': { colorClass: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30', ringClass: 'ring-purple-500 dark:ring-purple-400' },
        'Ký kết MOU': { colorClass: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/30', ringClass: 'ring-pink-500 dark:ring-pink-400' },
        'Khác': { colorClass: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800', ringClass: 'ring-gray-500 dark:ring-gray-400' },
    };

    const typeIcons = {
        'Tuyển dụng & Thực tập': '💼',
        'Hội thảo & Đào tạo': '🎓',
        'Tài trợ & Học bổng': '🏆',
        'Tham quan doanh nghiệp': '🏢',
        'Kiểm định & Đánh giá': '📊',
        'Ký kết MOU': '📝',
        'Khác': '📋',
    };

    // Count activities by type (using type_names from API)
    const typeCounts = {};
    data.forEach(item => {
        const names = item.type_names ? item.type_names.split(', ') : ['Khác'];
        names.forEach(n => { typeCounts[n] = (typeCounts[n] || 0) + 1; });
    });

    // Filtered data
    const filteredData = data.filter(item => {
        const matchSearch = !searchText ||
            item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.enterprise_name?.toLowerCase().includes(searchText.toLowerCase());
        const matchType = !filterType || (item.type_names && item.type_names.includes(filterType));
        const matchStatus = !filterStatus || item.status === filterStatus;
        const matchEnterprise = !filterEnterprise || item.enterprise_id === filterEnterprise;
        // Date range filter
        let matchDateRange = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
            const startDate = dayjs(item.start_date);
            matchDateRange = startDate.isAfter(dateRange[0].startOf('day').subtract(1, 'ms')) && startDate.isBefore(dateRange[1].endOf('day').add(1, 'ms'));
        }
        return matchSearch && matchType && matchStatus && matchEnterprise && matchDateRange;
    }).sort((a, b) => {
        if (!sortOption) return 0;
        switch (sortOption) {
            case 'title_asc': return (a.title || '').localeCompare(b.title || '', 'vi');
            case 'title_desc': return (b.title || '').localeCompare(a.title || '', 'vi');
            case 'date_newest': return new Date(b.start_date) - new Date(a.start_date);
            case 'date_oldest': return new Date(a.start_date) - new Date(b.start_date);
            case 'students_desc': return (b.student_count || 0) - (a.student_count || 0);
            case 'students_asc': return (a.student_count || 0) - (b.student_count || 0);
            default: return 0;
        }
    });

    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const activeCount = filteredData.filter(item => item.status === 'Đã triển khai').length;
    const completedCount = filteredData.filter(item => item.status === 'Đã kết thúc').length;
    const pendingCount = filteredData.filter(item => item.status === 'Đề xuất' || item.status === 'Phê duyệt nội bộ').length;
    const totalStudents = filteredData.reduce((sum, item) => sum + (item.student_count || 0), 0);

    const handleExport = () => {
        if (!filteredData || filteredData.length === 0) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }
        const exportData = filteredData.map(item => ({
            'Mã hoạt động': item.id,
            'Mã doanh nghiệp (ID)': item.enterprise_id || '',
            'Tên doanh nghiệp': item.enterprise_name || '',
            'Tên hoạt động': item.title,
            'Loại hình': item.type_names || '',
            'Đối tượng': item.target_names || '',
            'Ngày bắt đầu': item.start_date ? dayjs(item.start_date).format('DD/MM/YYYY') : '',
            'Ngày kết thúc': item.end_date ? dayjs(item.end_date).format('DD/MM/YYYY') : '',
            'Ngày hợp tác': item.collaboration_date ? dayjs(item.collaboration_date).format('DD/MM/YYYY') : '',
            'Mô tả': item.detail || '',
            'Trạng thái': item.status || '',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'HoatDong');
        XLSX.writeFile(wb, `DanhSachHoatDong_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <AppstoreOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Hoạt động hợp tác</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">{data.length} hoạt động · {stats?.active || 0} đang diễn ra</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {!isLecturer && (
                        <Button
                            size="middle"
                            icon={<UploadOutlined />}
                            onClick={() => setShowImport(true)}
                            className="border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg shadow-sm font-medium hover:border-purple-700"
                        >
                            Import
                        </Button>
                    )}
                    <Button
                        size="middle"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        className="border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg shadow-sm font-medium hover:border-emerald-700"
                    >
                        Xuất Excel
                    </Button>
                    {!isLecturer && (
                        <Button
                            size="middle"
                            type="primary"
                            className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingId(null);
                                form.resetFields();
                                setIsModalVisible(true);
                            }}
                        >
                            Thêm hoạt động
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Green Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl p-3.5 sm:p-5 border-l-4 border-l-emerald-500 border-t border-r border-b border-slate-100 dark:border-emerald-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <SyncOutlined className="text-4xl sm:text-6xl text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
                        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <SyncOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 leading-none mb-1">{activeCount}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-emerald-600/80 uppercase tracking-wider">Đang hoạt động</div>
                        </div>
                    </div>
                </div>

                {/* Blue Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl p-3.5 sm:p-5 border-l-4 border-l-blue-500 border-t border-r border-b border-slate-100 dark:border-blue-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <CheckCircleOutlined className="text-4xl sm:text-6xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
                        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <CheckCircleOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-blue-800 dark:text-blue-400 leading-none mb-1">{completedCount}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-blue-600/80 uppercase tracking-wider">Hoàn thành</div>
                        </div>
                    </div>
                </div>

                {/* Orange Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 rounded-2xl p-3.5 sm:p-5 border-l-4 border-l-orange-500 border-t border-r border-b border-slate-100 dark:border-orange-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <ClockCircleOutlined className="text-4xl sm:text-6xl text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
                        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <ClockCircleOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-orange-800 dark:text-orange-400 leading-none mb-1">{pendingCount}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-orange-600/80 uppercase tracking-wider">Chờ triển khai</div>
                        </div>
                    </div>
                </div>

                {/* Purple Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl p-3.5 sm:p-5 border-l-4 border-l-purple-500 border-t border-r border-b border-slate-100 dark:border-purple-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <TeamOutlined className="text-4xl sm:text-6xl text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
                        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <TeamOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <div>
                            <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-purple-800 dark:text-purple-400 leading-none mb-1">{totalStudents}</div>
                            <div className="text-[10px] sm:text-xs font-semibold text-purple-600/80 uppercase tracking-wider">Sinh viên tham gia</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Type tags */}
            <div className="mb-5">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phân loại hoạt động</div>
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(typeCounts).map(([type, count]) => {
                        const tc = typeConfig[type] || typeConfig['Khác'];
                        return (
                            <button
                                key={type}
                                onClick={() => setFilterType(filterType === type ? null : type)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${tc.colorClass} ${filterType === type
                                    ? `ring-2 ring-offset-1 dark:ring-offset-gray-900 shadow-sm dark:shadow-none ${tc.ringClass} border-current`
                                    : 'hover:shadow-sm dark:hover:shadow-none border-transparent'
                                    }`}
                            >
                                {typeIcons[type] || '📋'} {type} <span className="font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3 transition-colors">
                <Input
                    placeholder="Tìm kiếm hoạt động, doanh nghiệp..."
                    prefix={<SearchOutlined className="text-gray-300" />}
                    className="flex-1 min-w-[200px] rounded-lg h-10"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />

                <Popover
                    title="Bộ lọc & Sắp xếp"
                    trigger="click"
                    placement="bottomLeft"
                    content={
                        <div className="flex flex-col gap-3 w-72 p-1">
                            <div>
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><SortAscendingOutlined /> Sắp xếp</div>
                                <Select allowClear placeholder="Chọn cách sắp xếp..." onChange={setSortOption} value={sortOption} className="w-full" options={[
                                    { value: 'title_asc', label: '🔤 Tên (A → Z)' },
                                    { value: 'title_desc', label: '🔤 Tên (Z → A)' },
                                    { value: 'date_newest', label: '📅 Ngày BĐ (Mới → Cũ)' },
                                    { value: 'date_oldest', label: '📅 Ngày BĐ (Cũ → Mới)' },
                                    { value: 'students_desc', label: '👥 SV nhiều → ít' },
                                    { value: 'students_asc', label: '👥 SV ít → nhiều' },
                                ]} />
                            </div>
                            <Divider className="my-0" />
                            <div>
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CalendarOutlined /> Khoảng thời gian</div>
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
                                    <Select allowClear placeholder="Doanh nghiệp" onChange={setFilterEnterprise} value={filterEnterprise} className="w-full" showSearch optionFilterProp="children">
                                        {enterprises.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                                    </Select>
                                    <Select allowClear placeholder="Loại hoạt động" onChange={setFilterType} value={filterType} className="w-full">
                                        {['Tuyển dụng & Thực tập', 'Hội thảo & Đào tạo', 'Tài trợ & Học bổng', 'Tham quan doanh nghiệp', 'Kiểm định & Đánh giá', 'Ký kết MOU', 'Khác'].map(t => (
                                            <Option key={t} value={t}>{t}</Option>
                                        ))}
                                    </Select>
                                    <Select allowClear placeholder="Trạng thái" onChange={setFilterStatus} value={filterStatus} className="w-full">
                                        {Object.keys(statusConfig).map(s => <Option key={s} value={s}>{s}</Option>)}
                                    </Select>
                                </div>
                            </div>
                            <Divider className="my-0" />
                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><DeleteOutlined /> Hiển thị đã xóa</span>
                                <Switch size="small" checked={showDeleted} onChange={setShowDeleted} />
                            </div>
                            <Button icon={<ClearOutlined />} type="default" block onClick={() => {
                                setFilterEnterprise(null); setFilterType(null); setFilterStatus(null); setSortOption(null); setDateRange(null); setShowDeleted(false); setFilterFaculty(undefined);
                            }}>Xóa tất cả bộ lọc</Button>
                        </div>
                    }
                >
                    <Button icon={<FilterOutlined />} className="h-10 rounded-lg text-gray-600">
                        Bộ lọc {(() => { const c = [filterEnterprise, filterType, filterStatus, sortOption, dateRange, showDeleted ? true : null].filter(v => v !== null && v !== undefined).length; return c > 0 ? <Badge count={c} size="small" offset={[2, -2]} style={{ backgroundColor: '#1677ff' }} /> : null; })()}
                    </Button>
                </Popover>

                <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors h-10">
                    <button onClick={() => setViewMode('grid')} className={`p-2 px-3 transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                        <AppstoreOutlined />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 px-3 transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>
                        <UnorderedListOutlined />
                    </button>
                </div>
            </div>

            {/* Floating Action Bar for Bulk Selection */}
            {!isLecturer && selectedActivities.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-slate-200 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in-up md:animate-fade-in-up-centered">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">
                            {selectedActivities.length}
                        </span>
                        <span className="text-slate-700 dark:text-gray-200 text-sm font-semibold hidden xs:inline">Hoạt động đã chọn</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <Select
                            placeholder="Đổi trạng thái..."
                            onChange={handleBulkUpdateStatus}
                            className="w-36 sm:w-44"
                            size="middle"
                        >
                            <Option value="Đề xuất">Đề xuất</Option>
                            <Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Option>
                            <Option value="Đã triển khai">Đã triển khai</Option>
                            <Option value="Đã kết thúc">Đã kết thúc</Option>
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
                            onClick={() => setSelectedActivities([])}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            )}

            {/* Mobile-only Select All Panel */}
            {!isLecturer && !loading && paginatedData.length > 0 && (
                <div className="block md:hidden bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-200 dark:border-gray-700 mb-4 flex items-center justify-between">
                    <Checkbox
                        checked={paginatedData.length > 0 && paginatedData.every(item => selectedActivities.includes(item.id))}
                        indeterminate={paginatedData.some(item => selectedActivities.includes(item.id)) && !paginatedData.every(item => selectedActivities.includes(item.id))}
                        onChange={(e) => {
                            if (e.target.checked) {
                                const toAdd = paginatedData.filter(item => item.is_deleted !== 1).map(item => item.id);
                                setSelectedActivities(prev => [...new Set([...prev, ...toAdd])]);
                            } else {
                                const toRemove = paginatedData.map(item => item.id);
                                setSelectedActivities(prev => prev.filter(id => !toRemove.includes(id)));
                            }
                        }}
                    >
                        Chọn tất cả trang này ({paginatedData.length} hoạt động)
                    </Checkbox>
                </div>
            )}

            {/* Activity Cards */}
            {loading ? (
                <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : filteredData.length > 0 ? (
                <Row gutter={[20, 20]}>
                    {paginatedData.map(item => {
                        const sc = statusConfig[item.status] || { colorClass: 'text-gray-500 bg-gray-50', icon: <ClockCircleOutlined /> };
                        const firstType = item.type ? item.type.split(',')[0].trim() : 'Khác';
                        const tc = typeConfig[firstType] || typeConfig['Khác'];
                        const isChecked = selectedActivities.includes(item.id);

                        return (
                            <Col xs={24} sm={viewMode === 'list' ? 24 : 12} lg={viewMode === 'list' ? 24 : 8} key={item.id}>
                                <div className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-md dark:shadow-none transition-all h-full flex flex-col overflow-hidden group cursor-pointer relative ${
                                    isChecked 
                                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50/5 dark:bg-blue-955/5' 
                                        : 'border-gray-100 dark:border-gray-700 dark:hover:border-gray-500'
                                } ${item.is_deleted === 1 ? 'opacity-65 border-red-200 dark:border-red-950/30' : ''}`}
                                    onClick={(e) => {
                                        if (e.target.closest('.action-buttons') || e.target.closest('.ant-checkbox-wrapper')) return;
                                        setSelectedActivity(item);
                                        setIsDrawerVisible(true);
                                    }}
                                >
                                    {/* Card Header */}
                                    <div className="p-5 pb-3 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm dark:shadow-none ${tc.colorClass}`}>
                                                    {typeIcons[firstType] || '📋'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px] leading-snug line-clamp-2 mb-1 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs transition-colors">
                                                        <BankOutlined />
                                                        <span className="truncate">{item.enterprise_name}</span>
                                                    </div>
                                                    {user?.role === 'ADMIN' && item.faculty_name && (
                                                        <div className="mt-1">
                                                            <Tag color="orange" className="text-[10px] px-1.5 py-0">{item.faculty_name}</Tag>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2 mt-1">
                                                {item.is_deleted === 1 && <Tag color="red" className="m-0 mr-1 flex-shrink-0">Đã xóa</Tag>}
                                                <div
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 border-0 ${sc.colorClass}`}
                                                >
                                                    {item.status}
                                                </div>
                                                {!isLecturer && item.is_deleted !== 1 && (
                                                    <Checkbox
                                                        checked={selectedActivities.includes(item.id)}
                                                        onChange={() => handleToggleActivity(item.id)}
                                                        className="scale-110 ml-1"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {item.description && (
                                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3 ml-[52px] transition-colors">
                                                {item.description}
                                            </p>
                                        )}

                                        {/* Meta info */}
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 ml-[52px] transition-colors">
                                            <span className="flex items-center gap-1">
                                                <CalendarOutlined />
                                                {dayjs(item.start_date).format('DD/MM/YYYY')} — {item.end_date ? dayjs(item.end_date).format('DD/MM/YYYY') : 'Chưa rõ'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TeamOutlined />
                                                {item.student_count || 0} sinh viên
                                            </span>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-1.5 ml-[52px] flex-wrap">
                                            {item.type ? (
                                                item.type.split(',').map(t => {
                                                    const trimmed = t.trim();
                                                    const tagConf = typeConfig[trimmed] || typeConfig['Khác'];
                                                    return (
                                                        <span key={trimmed} className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap ${tagConf.colorClass}`}>
                                                            {trimmed}
                                                        </span>
                                                    );
                                                })
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-white dark:bg-gray-800/50 transition-colors action-buttons">
                                        {item.is_deleted === 1 ? (
                                            <Button
                                                type="primary"
                                                size="small"
                                                className="bg-green-600 hover:bg-green-500 text-white border-0 rounded-md animate-fade-in"
                                                onClick={() => handleRestore(item.id)}
                                            >
                                                Khôi phục
                                            </Button>
                                        ) : (
                                            <>
                                                <Select
                                                    size="small"
                                                    value={item.status}
                                                    onChange={(val) => handleUpdateStatus(item.id, val)}
                                                    className="w-[140px]"
                                                    variant="borderless"
                                                    disabled={isLecturer}
                                                >
                                                    <Option value="Đề xuất">Đề xuất</Option>
                                                    <Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Option>
                                                    <Option value="Đã triển khai">Đã triển khai</Option>
                                                    <Option value="Đã kết thúc">Đã kết thúc</Option>
                                                </Select>
                                                {!isLecturer && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Tooltip title="Chỉnh sửa">
                                                            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50:bg-blue-900/30 transition-all"
                                                                onClick={() => {
                                                                    setEditingId(item.id);
                                                                    form.setFieldsValue({
                                                                        ...item,
                                                                        type_ids: item.type_ids ? item.type_ids.split(',').map(Number) : [],
                                                                        target_ids: item.target_ids ? item.target_ids.split(',').map(Number) : [],
                                                                        start_date: item.start_date ? dayjs(item.start_date) : null,
                                                                        end_date: item.end_date ? dayjs(item.end_date) : null,
                                                                        start_time: item.start_time ? dayjs(`1970-01-01 ${item.start_time}`) : null,
                                                                        end_time: item.end_time ? dayjs(`1970-01-01 ${item.end_time}`) : null,
                                                                        collaboration_date: item.collaboration_date ? dayjs(item.collaboration_date) : null,
                                                                        faculty_id: item.faculty_id,
                                                                    });
                                                                    setIsModalVisible(true);
                                                                }}>
                                                                <EditOutlined style={{ fontSize: 13 }} />
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip title="Xóa">
                                                            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50:bg-red-900/30 transition-all"
                                                                onClick={() => modal.confirm({ title: 'Xác nhận xóa hoạt động này?', okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' }, onOk: () => handleDelete(item.id) })}>
                                                                <DeleteOutlined style={{ fontSize: 13 }} />
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            ) : (
                <Empty description="Không tìm thấy hoạt động nào" className="mt-20" />
            )}

            {filteredData.length > 0 && (
                <div className="flex justify-center mt-8 pb-4">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredData.length}
                        onChange={(page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }}
                        showSizeChanger
                        pageSizeOptions={['12', '24', '48', '96']}
                    />
                </div>
            )}

            {/* Modal Form */}
            <Modal
                title={editingId ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động hợp tác mới'}
                open={isModalVisible}
                onCancel={() => { setIsModalVisible(false); setEditingId(null); }}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    <Form.Item name="title" label="Tên Hoạt động" rules={[{ required: true }]}>
                        <Input placeholder="VD: Thực tập sinh Marketing 2024" />
                    </Form.Item>
                    {user?.role === 'ADMIN' && (
                        <Form.Item name="faculty_id" label="Khoa quản lý" rules={[{ required: true, message: 'Vui lòng chọn khoa!' }]}>
                            <Select placeholder="Chọn khoa...">
                                {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                            </Select>
                        </Form.Item>
                    )}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="enterprise_id" label="Doanh nghiệp liên kết" rules={[{ required: true }]}>
                                <Select showSearch placeholder="Chọn doanh nghiệp" filterOption={filterOptionIgnoreCase}>
                                    {enterprises.map(e => (
                                        <Option key={e.id} value={e.id}>{e.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type_ids" label="Loại hình hoạt động">
                                <Select mode="multiple" placeholder="Chọn loại hình" showSearch filterOption={filterOptionIgnoreCase}>
                                    {activityTypes.map(act => (
                                        <Option key={act.id} value={act.id}>{act.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="target_ids" label="Đối tượng hướng tới">
                        <Select mode="multiple" placeholder="Chọn đối tượng" showSearch filterOption={filterOptionIgnoreCase}>
                            {targets.map(t => (
                                <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}>
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_date" label="Ngày kết thúc">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="start_time" label="Giờ bắt đầu">
                                <TimePicker className="w-full" format="HH:mm" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_time" label="Giờ kết thúc">
                                <TimePicker className="w-full" format="HH:mm" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="collaboration_date" label="Ngày hợp tác">
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="detail" label="Mô tả nội dung hoạt động">
                        <Input.TextArea rows={3} placeholder="Nhập tóm tắt nội dung..." />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái" initialValue="Đề xuất">
                        <Select>
                            <Option value="Đề xuất">Đề xuất</Option>
                            <Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Option>
                            <Option value="Đã triển khai">Đã triển khai</Option>
                            <Option value="Đã kết thúc">Đã kết thúc</Option>
                        </Select>
                    </Form.Item>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <Button onClick={() => { setIsModalVisible(false); setEditingId(null); }} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium" size="large">
                            {editingId ? 'Cập nhật' : 'Lưu hoạt động'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <ImportModal
                open={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={() => { fetchData(); fetchStats(); }}
                type="activities"
                templateColumns={['Tên hoạt động', 'Mã doanh nghiệp (ID)', 'Loại hình', 'Đối tượng', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ngày hợp tác', 'Mô tả', 'Trạng thái']}
            />

            <Drawer
                title={<span className="font-bold flex items-center gap-2"><UnorderedListOutlined /> Chi tiết Hoạt động</span>}
                placement="right" style={{ width: 600 }}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible} className="bg-slate-50 dark:bg-gray-800/50"
            >
                {selectedActivity && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 m-0 leading-tight">{selectedActivity.title}</h2>
                                <Tag color={statusConfig[selectedActivity.status]?.color} className="m-0 flex-shrink-0">
                                    {selectedActivity.status}
                                </Tag>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 mb-6">
                                <BankOutlined className="text-blue-500" />
                                <span className="font-medium text-slate-700 dark:text-gray-200">{selectedActivity.enterprise_name}</span>
                            </div>

                            <Descriptions column={1} layout="horizontal" size="small" bordered className="bg-white dark:bg-gray-800">
                                <Descriptions.Item label="Loại hình">
                                    {selectedActivity.type_names ? selectedActivity.type_names.split(', ').map(t => <Tag key={t} color="blue">{t}</Tag>) : '---'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Đối tượng">
                                    {selectedActivity.target_names ? selectedActivity.target_names.split(', ').map(t => <Tag key={t} color="cyan">{t}</Tag>) : '---'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày bắt đầu">{selectedActivity.start_date ? dayjs(selectedActivity.start_date).format('DD/MM/YYYY') : '---'}</Descriptions.Item>
                                <Descriptions.Item label="Ngày kết thúc">{selectedActivity.end_date ? dayjs(selectedActivity.end_date).format('DD/MM/YYYY') : '---'}</Descriptions.Item>
                                <Descriptions.Item label="Ngày hợp tác">{selectedActivity.collaboration_date ? dayjs(selectedActivity.collaboration_date).format('DD/MM/YYYY') : '---'}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        {selectedActivity.detail && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 border-b pb-2">Mô tả nội dung</h3>
                                <div className="text-slate-600 whitespace-pre-wrap">{selectedActivity.detail}</div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-3 border-b pb-2">Thống kê</h3>
                            <div className="flex items-center gap-3">
                                <TeamOutlined className="text-2xl text-purple-500" />
                                <div>
                                    <div className="text-2xl font-bold text-slate-800 dark:text-gray-100">{selectedActivity.student_count || 0}</div>
                                    <div className="text-sm text-gray-500">Sinh viên tham gia</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default ActivityList;
