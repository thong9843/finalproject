import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Form, Select, Button, Modal, message, Input, DatePicker, TimePicker, Statistic, Spin, Empty, Tooltip, Drawer, Descriptions, Popover, Badge, Divider, Pagination, Checkbox, Space , App as AntApp } from 'antd';
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterType, filterStatus, filterEnterprise, dateRange, sortOption]);

    useEffect(() => {
        document.title = "Hoạt động Hợp tác | VLU Enterprise Link Manager";
        fetchData();
        fetchStats();
        fetchEnterprises();
        fetchActivityTypes();
        fetchTargets();
    }, []);

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
            const res = await api.get('/activities');
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors">Hoạt động hợp tác</h1>
                    <p className="text-gray-400 text-sm">{data.length} hoạt động · {stats?.active || 0} đang diễn ra</p>
                </div>
                <div className="flex gap-3">
                    {!isLecturer && <Button icon={<UploadOutlined />} onClick={() => setShowImport(true)} className="h-10 rounded-lg">Import</Button>}
                    <Button icon={<DownloadOutlined />} onClick={handleExport} className="h-10 rounded-lg">Xuất Excel</Button>
                    {!isLecturer && <Button type="primary" className="bg-vluRed h-10 px-5 rounded-lg" icon={<PlusOutlined />} onClick={() => {
                        setEditingId(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}>Thêm hoạt động</Button>}
                </div>
            </div>



            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-2xl p-5 border border-green-100 dark:border-green-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                            <SyncOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-700">{activeCount}</div>
                            <div className="text-xs text-green-600/70/70">Đang hoạt động</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <CheckCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-700">{completedCount}</div>
                            <div className="text-xs text-blue-600/70/70">Hoàn thành</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                            <ClockCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-700">{pendingCount}</div>
                            <div className="text-xs text-orange-600/70/70">Chờ triển khai</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            <TeamOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-700">{totalStudents}</div>
                            <div className="text-xs text-purple-600/70/70">Sinh viên tham gia</div>
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
                            <Button icon={<ClearOutlined />} type="default" block onClick={() => {
                                setFilterEnterprise(null); setFilterType(null); setFilterStatus(null); setSortOption(null); setDateRange(null);
                            }}>Xóa tất cả bộ lọc</Button>
                        </div>
                    }
                >
                    <Button icon={<FilterOutlined />} className="h-10 rounded-lg text-gray-600">
                        Bộ lọc {(() => { const c = [filterEnterprise, filterType, filterStatus, sortOption, dateRange].filter(v => v !== null && v !== undefined).length; return c > 0 ? <Badge count={c} size="small" offset={[2, -2]} style={{ backgroundColor: '#1677ff' }} /> : null; })()}
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

            {/* Action Bar for Bulk Selection */}
            {!isLecturer && selectedActivities.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mb-4 flex justify-between items-center animate-fade-in">
                    <span className="text-blue-700 dark:text-blue-400 font-medium ml-2">Đã chọn {selectedActivities.length} hoạt động</span>
                    <Space>
                        <Select
                            placeholder="Đổi trạng thái..."
                            onChange={handleBulkUpdateStatus}
                            className="w-44"
                            size="small"
                        >
                            <Option value="Đề xuất">Đề xuất</Option>
                            <Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Option>
                            <Option value="Đã triển khai">Đã triển khai</Option>
                            <Option value="Đã kết thúc">Đã kết thúc</Option>
                        </Select>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                            Xóa đã chọn
                        </Button>
                    </Space>
                </div>
            )}

            {/* Activity Cards */}
            {loading ? (
                <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : filteredData.length > 0 ? (
                <Row gutter={[20, 20]}>
                    {paginatedData.map(item => {
                        const sc = statusConfig[item.status] || { colorClass: 'text-gray-500 bg-gray-50', icon: <ClockCircleOutlined /> };
                        const tc = typeConfig[item.type] || typeConfig['Khác'];

                        return (
                            <Col xs={24} sm={viewMode === 'list' ? 24 : 12} lg={viewMode === 'list' ? 24 : 8} key={item.id}>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md dark:shadow-none dark:hover:border-gray-500 transition-all h-full flex flex-col overflow-hidden group cursor-pointer relative"
                                    onClick={(e) => {
                                        if (e.target.closest('.action-buttons') || e.target.closest('.ant-checkbox-wrapper')) return;
                                        setSelectedActivity(item);
                                        setIsDrawerVisible(true);
                                    }}
                                >
                                    {!isLecturer && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <Checkbox 
                                                checked={selectedActivities.includes(item.id)} 
                                                onChange={() => handleToggleActivity(item.id)}
                                                className="scale-110"
                                            />
                                        </div>
                                    )}
                                    {/* Card Header */}
                                    <div className="p-5 pb-3 flex-1">
                                        <div className="flex justify-between items-start mb-3 pr-6">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm dark:shadow-none ${tc.colorClass}`}>
                                                    {typeIcons[item.type] || '📋'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px] leading-snug line-clamp-2 mb-1 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs transition-colors">
                                                        <BankOutlined />
                                                        <span className="truncate">{item.enterprise_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 border-0 ml-2 ${sc.colorClass}`}
                                            >
                                                {item.status}
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
                                            {item.type && (
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${tc.colorClass}`}>
                                                    {item.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-white dark:bg-gray-800/50 transition-colors action-buttons">
                                        <Select
                                            size="small"
                                            value={item.status}
                                            onChange={(val) => handleUpdateStatus(item.id, val)}
                                            className="w-[140px]"
                                            bordered={false}
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
                        <Button onClick={() => { setIsModalVisible(false); setEditingId(null); }} size="large">Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-vluRed h-11 px-8 rounded-lg" size="large">
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
                placement="right" width={600}
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
