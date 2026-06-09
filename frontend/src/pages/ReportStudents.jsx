import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Segmented, DatePicker, Button, message, Table, Input, Progress, Select, Tag } from 'antd';
import { TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, CalendarOutlined, DownloadOutlined, BarChartOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';
import { useTheme } from '../context/ThemeContext';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const { RangePicker } = DatePicker;

const periodOptions = [
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Quý này', value: 'quarter' },
    { label: 'Năm nay', value: 'year' },
    { label: 'Tất cả', value: 'all' },
    { label: 'Tùy chỉnh', value: 'custom' },
];

const getDateRange = (period) => {
    const now = dayjs();
    switch (period) {
        case 'week':
            return [now.startOf('isoWeek'), now.endOf('isoWeek')];
        case 'month':
            return [now.startOf('month'), now.endOf('month')];
        case 'quarter':
            return [now.startOf('quarter'), now.endOf('quarter')];
        case 'year':
            return [now.startOf('year'), now.endOf('year')];
        case 'all':
            return [null, null];
        default:
            return [null, null];
    }
};

const ReportStudents = () => {
    const { isDark } = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('year');
    const [customRange, setCustomRange] = useState(null);
    const [enterpriseSearch, setEnterpriseSearch] = useState('');

    const [faculties, setFaculties] = useState([]);
    const [filterFaculty, setFilterFaculty] = useState(undefined);

    const userCookie = Cookies.get('user');
    const user = useMemo(() => {
        try {
            return userCookie ? JSON.parse(userCookie) : null;
        } catch (e) {
            return null;
        }
    }, [userCookie]);

    const isAdmin = user && user.role === 'ADMIN';

    useEffect(() => {
        document.title = "Báo cáo Sinh viên thực tập | VLU Enterprise Link Manager";
        if (isAdmin) {
            const fetchFaculties = async () => {
                try {
                    const res = await api.get('/structure/faculties');
                    setFaculties(res.data || []);
                } catch (e) {
                    console.error('Error fetching faculties:', e);
                }
            };
            fetchFaculties();
        }
    }, [isAdmin]);

    const dateRange = useMemo(() => {
        if (period === 'custom' && customRange) {
            return customRange;
        }
        return getDateRange(period);
    }, [period, customRange]);

    useEffect(() => {
        fetchData();
    }, [dateRange, filterFaculty]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            const [from, to] = dateRange;
            if (from) params.date_from = from.format('YYYY-MM-DD');
            if (to) params.date_to = to.format('YYYY-MM-DD');
            if (filterFaculty) params.faculty_id = filterFaculty;
            const res = await api.get('/reports/students-by-enterprise', { params });
            setData(res.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPeriodLabel = () => {
        const [from, to] = dateRange;
        if (!from && !to) return 'Tất cả thời gian';
        if (from && to) return `${from.format('DD/MM/YYYY')} — ${to.format('DD/MM/YYYY')}`;
        return '';
    };

    const handleExport = () => {
        if (!data) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }
        const wb = XLSX.utils.book_new();

        const overviewSheet = XLSX.utils.json_to_sheet([
            { 'Chỉ số': 'Khoảng thời gian', 'Giá trị': getPeriodLabel() },
            { 'Chỉ số': 'Tổng sinh viên', 'Giá trị': data.overview.total || 0 },
            { 'Chỉ số': 'Đang thực tập', 'Giá trị': data.overview.active || 0 },
            { 'Chỉ số': 'Chờ phân công', 'Giá trị': data.overview.pending || 0 },
            { 'Chỉ số': 'GPA Trung bình', 'Giá trị': data.overview.avgGpa || 0 },
        ]);
        XLSX.utils.book_append_sheet(wb, overviewSheet, "Tổng quan");

        const enterpriseSheet = XLSX.utils.json_to_sheet(data.byEnterprise.map(item => ({
            'Doanh nghiệp': item.enterprise,
            'Tổng số': item.total,
            'Đang thực tập': item.active,
            'Hoàn thành': item.completed,
            'Chờ phân công': item.pending,
        })));
        XLSX.utils.book_append_sheet(wb, enterpriseSheet, "Theo DN");

        const majorSheet = XLSX.utils.json_to_sheet(data.byMajor.map(item => ({
            'Ngành học': item.major,
            'Số lượng': item.count,
        })));
        XLSX.utils.book_append_sheet(wb, majorSheet, "Theo Ngành");

        XLSX.writeFile(wb, `BaoCaoSinhVien_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const filteredEnterprises = useMemo(() => {
        if (!data || !data.byEnterprise) return [];
        return data.byEnterprise.filter(item => 
            item.enterprise.toLowerCase().includes(enterpriseSearch.toLowerCase())
        );
    }, [data, enterpriseSearch]);

    const chartWidth = useMemo(() => {
        const list = data?.byEnterprise || [];
        if (list.length === 0) return '100%';
        const estimatedWidth = list.length * 60; // 60px per company
        return estimatedWidth > 800 ? `${estimatedWidth}px` : '100%';
    }, [data]);

    if (loading) return <div className="flex justify-center items-center h-96"><Spin size="large" /></div>;
    if (!data) return <Empty description="Không có dữ liệu" />;

    const { byEnterprise, byMajor, overview } = data;

    const barChartData = {
        labels: byEnterprise.map(i => i.enterprise),
        datasets: [
            {
                label: 'Đang thực tập',
                data: byEnterprise.map(i => i.active),
                backgroundColor: '#52c41a',
                borderRadius: 6,
                barPercentage: 0.6,
            },
            {
                label: 'Hoàn thành',
                data: byEnterprise.map(i => i.completed),
                backgroundColor: '#1890ff',
                borderRadius: 6,
                barPercentage: 0.6,
            },
            {
                label: 'Chờ phân công',
                data: byEnterprise.map(i => i.pending),
                backgroundColor: '#faad14',
                borderRadius: 6,
                barPercentage: 0.6,
            },
        ],
    };

    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.6)';

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top',
                labels: { color: textColor, font: { family: 'inherit' } }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                titleColor: isDark ? '#f3f4f6' : '#1f2937',
                bodyColor: isDark ? '#d1d5db' : '#4b5563',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
            }
        },
        scales: {
            x: { 
                grid: { display: false },
                ticks: { color: textColor }
            },
            y: { 
                beginAtZero: true, 
                grid: { color: gridColor, borderDash: [4, 4] },
                ticks: { color: textColor, stepSize: 1 } 
            },
        },
    };

    const doughnutData = {
        labels: byMajor.map(i => i.major),
        datasets: [{
            data: byMajor.map(i => i.count),
            backgroundColor: [
                '#ef4444', '#3b82f6', '#10b981', '#f59e0b', 
                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
            ],
            borderWidth: isDark ? 0 : 2,
            borderColor: '#fff',
        }],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'right', 
                labels: { 
                    boxWidth: 12, 
                    padding: 16,
                    color: textColor,
                    font: { family: 'inherit', size: 11 }
                } 
            },
            tooltip: {
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                titleColor: isDark ? '#f3f4f6' : '#1f2937',
                bodyColor: isDark ? '#d1d5db' : '#4b5563',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
            }
        },
        cutout: '60%'
    };



    const enterpriseColumns = [
        {
            title: 'Doanh nghiệp',
            dataIndex: 'enterprise',
            key: 'enterprise',
            sorter: (a, b) => a.enterprise.localeCompare(b.enterprise, 'vi'),
            render: (text) => <span className="font-semibold text-gray-700 dark:text-gray-200">{text}</span>
        },
        {
            title: 'Tổng số SV',
            dataIndex: 'total',
            key: 'total',
            sorter: (a, b) => a.total - b.total,
            align: 'center',
            render: (text) => <span className="font-bold">{text}</span>
        },
        {
            title: 'Đang thực tập',
            dataIndex: 'active',
            key: 'active',
            sorter: (a, b) => a.active - b.active,
            align: 'center',
            render: (text) => <Tag color="processing" className="m-0">{text}</Tag>
        },
        {
            title: 'Hoàn thành',
            dataIndex: 'completed',
            key: 'completed',
            sorter: (a, b) => a.completed - b.completed,
            align: 'center',
            render: (text) => <Tag color="success" className="m-0">{text}</Tag>
        },
        {
            title: 'Chờ phân công',
            dataIndex: 'pending',
            key: 'pending',
            sorter: (a, b) => a.pending - b.pending,
            align: 'center',
            render: (text) => <Tag color="warning" className="m-0">{text}</Tag>
        },
        {
            title: 'Tỉ lệ %',
            key: 'ratio',
            sorter: (a, b) => a.total - b.total,
            width: 150,
            render: (_, record) => {
                const totalAll = overview.total || 1;
                const percent = Math.round((record.total / totalAll) * 100);
                return <Progress percent={percent} size="small" strokeColor="#1890ff" />;
            }
        }
    ];

    const majorColumns = [
        {
            title: 'Ngành học',
            dataIndex: 'major',
            key: 'major',
            render: (text) => <span className="font-medium text-gray-700 dark:text-gray-200">{text}</span>
        },
        {
            title: 'Số lượng',
            dataIndex: 'count',
            key: 'count',
            align: 'center',
            render: (text) => <span className="font-bold">{text}</span>
        },
        {
            title: 'Tỷ lệ %',
            key: 'percentage',
            render: (_, record) => {
                const totalAll = overview.total || 1;
                const percent = Math.round((record.count / totalAll) * 100);
                return <Progress percent={percent} size="small" status="active" strokeColor="#52c41a" />;
            }
        }
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <BarChartOutlined className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Thống kê sinh viên thực tập</h1>
                        <p className="text-sm text-slate-500 m-0 mt-0.5">Biểu đồ thống kê phân bổ sinh viên tại các doanh nghiệp liên kết</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto header-actions">
                    <Button 
                        size="large"
                        icon={<DownloadOutlined />} 
                        onClick={handleExport} 
                        className="border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg shadow-sm font-medium hover:border-emerald-700 flex-1 sm:flex-initial"
                    >
                        Xuất Báo Cáo
                    </Button>
                </div>
            </div>

            {/* Period & Faculty Selector */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
                        <CalendarOutlined className="text-lg" />
                        <span className="text-sm font-medium">Khoảng thời gian:</span>
                    </div>
                    <div className="w-full sm:w-auto overflow-x-auto whitespace-nowrap pb-2 sm:pb-0 scrollbar-none">
                        <Segmented
                            options={periodOptions}
                            value={period}
                            onChange={(val) => {
                                setPeriod(val);
                                if (val !== 'custom') setCustomRange(null);
                            }}
                            className="bg-white dark:bg-gray-800 shadow-sm inline-block sm:inline-flex"
                        />
                    </div>
                    {period === 'custom' && (
                        <RangePicker
                            format="DD/MM/YYYY"
                            value={customRange}
                            onChange={setCustomRange}
                            placeholder={['Từ ngày', 'Đến ngày']}
                            className="rounded-lg w-full sm:w-auto flex-shrink-0"
                            allowClear={false}
                        />
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0">
                    {isAdmin ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Khoa/Ngành:</span>
                            <Select
                                placeholder="Tất cả các khoa"
                                allowClear
                                style={{ width: 220 }}
                                onChange={(val) => setFilterFaculty(val || undefined)}
                                value={filterFaculty}
                                className="rounded-lg"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                options={[
                                    { value: '', label: 'Tất cả các khoa' },
                                    ...faculties.map(f => ({ value: f.id, label: f.name }))
                                ]}
                            />
                        </div>
                    ) : (
                        user?.faculty_name && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bộ phận:</span>
                                <Tag color="red" className="m-0 font-medium px-3 py-1 rounded-full border-0 bg-red-50 text-vluRed dark:bg-red-950/20 dark:text-red-400">
                                    {user.faculty_name}
                                </Tag>
                            </div>
                        )
                    )}
                    {dateRange[0] && dateRange[1] && (
                        <span className="text-xs text-gray-400 sm:ml-auto">
                            📅 {getPeriodLabel()}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Blue Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl p-5 border-l-4 border-l-blue-500 border border-slate-100 dark:border-blue-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <TeamOutlined className="text-6xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <TeamOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-blue-800 dark:text-blue-400 leading-none mb-1">{overview.total || 0}</div>
                            <div className="text-xs font-semibold text-blue-600/80 uppercase tracking-wider">Tổng sinh viên</div>
                        </div>
                    </div>
                </div>

                {/* Green Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl p-5 border-l-4 border-l-emerald-500 border border-slate-100 dark:border-emerald-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <CheckCircleOutlined className="text-6xl text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <CheckCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 leading-none mb-1">{overview.active || 0}</div>
                            <div className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider">Đang thực tập</div>
                        </div>
                    </div>
                </div>

                {/* Orange Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10 rounded-2xl p-5 border-l-4 border-l-orange-500 border border-slate-100 dark:border-orange-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <ClockCircleOutlined className="text-6xl text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <ClockCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-orange-800 dark:text-orange-400 leading-none mb-1">{overview.pending || 0}</div>
                            <div className="text-xs font-semibold text-orange-600/80 uppercase tracking-wider">Chờ phân công</div>
                        </div>
                    </div>
                </div>

                {/* Purple Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl p-5 border-l-4 border-l-purple-500 border border-slate-100 dark:border-purple-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <TrophyOutlined className="text-6xl text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <TrophyOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-purple-800 dark:text-purple-400 leading-none mb-1">{overview.avgGpa || 0}</div>
                            <div className="text-xs font-semibold text-purple-600/80 uppercase tracking-wider">GPA Trung bình</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <Row gutter={[20, 20]}>
                <Col xs={24} lg={16}>
                    <Card title={<span className="">Số lượng sinh viên thực tập tại từng công ty</span>} className="rounded-xl shadow-sm h-full">
                        <div className="w-full overflow-x-auto scrollbar-thin pb-2">
                            <div style={{ height: 400, width: chartWidth }}>
                                {byEnterprise.length > 0 ? (
                                    <Bar data={barChartData} options={barOptions} />
                                ) : (
                                    <Empty description="Chưa có dữ liệu trong khoảng thời gian này" className="mt-20" />
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<span className="">Phân bổ theo ngành học</span>} className="rounded-xl shadow-sm h-full">
                        <div style={{ height: 400 }}>
                            {byMajor.length > 0 ? (
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            ) : (
                                <Empty description="Chưa có dữ liệu trong khoảng thời gian này" className="mt-20" />
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Detailed Tables Section */}
            <Row gutter={[20, 20]} className="mt-6 mb-8">
                <Col xs={24} lg={16}>
                    <Card 
                        title={
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 py-1">
                                <span className="font-bold text-gray-700 dark:text-gray-200 text-base">Chi tiết phân bổ theo doanh nghiệp</span>
                                <Input
                                    placeholder="Tìm kiếm doanh nghiệp..."
                                    prefix={<SearchOutlined className="text-gray-300" />}
                                    className="w-full sm:w-64 rounded-lg"
                                    value={enterpriseSearch}
                                    onChange={e => setEnterpriseSearch(e.target.value)}
                                    allowClear
                                />
                            </div>
                        }
                        className="rounded-xl shadow-sm border border-gray-150 dark:border-gray-700"
                    >
                        <Table
                            columns={enterpriseColumns}
                            dataSource={filteredEnterprises}
                            rowKey="enterprise"
                            size="middle"
                            pagination={{
                                pageSize: 5,
                                showSizeChanger: true,
                                pageSizeOptions: ['5', '10', '20'],
                                showTotal: (total) => `Tổng số ${total} doanh nghiệp`,
                            }}
                            className="student-report-table"
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card 
                        title={<span className="font-bold text-gray-700 dark:text-gray-200 text-base">Chi tiết phân bổ theo ngành học</span>}
                        className="rounded-xl shadow-sm border border-gray-150 dark:border-gray-700 h-full"
                    >
                        <Table
                            columns={majorColumns}
                            dataSource={byMajor}
                            rowKey="major"
                            size="middle"
                            pagination={false}
                            className="student-report-table"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportStudents;
