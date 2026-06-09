import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Spin, List, Tag, Typography, Segmented, DatePicker, Select } from 'antd';
import {
    BankOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
    TeamOutlined,
    CalendarOutlined,
    RightOutlined,
    DashboardOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
    LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement
} from 'chart.js';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import Cookies from 'js-cookie';
import { useTheme } from '../context/ThemeContext';

dayjs.locale('vi');
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement);

const { Title: AntTitle, Text } = Typography;
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

const Dashboard = () => {
    const { isDark } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('year');
    const [customRange, setCustomRange] = useState(null);
    
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
        document.title = "Tổng quan | VLU Enterprise Link Manager";
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
        const fetchStats = async () => {
            setLoading(true);
            try {
                const params = {};
                const [from, to] = dateRange;
                if (from) params.date_from = from.format('YYYY-MM-DD');
                if (to) params.date_to = to.format('YYYY-MM-DD');
                if (filterFaculty) params.faculty_id = filterFaculty;
                const { data } = await api.get('/stats/dashboard', { params });
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dateRange, filterFaculty]);

    const getPeriodLabel = () => {
        const [from, to] = dateRange;
        if (!from && !to) return 'Tất cả thời gian';
        if (from && to) return `${from.format('DD/MM/YYYY')} — ${to.format('DD/MM/YYYY')}`;
        return '';
    };

    const getPeriodTitle = () => {
        switch (period) {
            case 'week': return 'tuần này';
            case 'month': return 'tháng này';
            case 'quarter': return 'quý này';
            case 'year': return 'năm nay';
            case 'all': return 'tất cả';
            case 'custom': return getPeriodLabel();
            default: return '';
        }
    };

    if (loading || !stats) {
        return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    }

    const { totals, charts, upcomingActivities } = stats;

    // KPI Cards Configuration
    const kpiCards = [
        {
            title: 'Tổng doanh nghiệp',
            value: totals.totalEnterprises,
            icon: <BankOutlined />,
            bg: 'from-red-50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10',
            borderL: 'border-l-red-500',
            borderTheme: 'border-red-900/30',
            iconBoxBg: 'from-red-500 to-rose-600',
            textTitle: 'text-red-650/80',
            textValue: 'text-red-800 dark:text-red-400',
            bgIconColor: 'text-red-600 dark:text-red-400',
            shadowColor: 'shadow-red-200'
        },
        {
            title: 'Đang hợp tác',
            value: totals.collaboratingEnterprises,
            icon: <CheckCircleOutlined />,
            bg: 'from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10',
            borderL: 'border-l-emerald-500',
            borderTheme: 'border-emerald-900/30',
            iconBoxBg: 'from-emerald-500 to-teal-600',
            textTitle: 'text-emerald-600/80',
            textValue: 'text-emerald-800 dark:text-emerald-400',
            bgIconColor: 'text-emerald-600 dark:text-emerald-400',
            shadowColor: 'shadow-emerald-200'
        },
        {
            title: `Hoạt động (${getPeriodTitle()})`,
            value: totals.activitiesCount,
            icon: <AppstoreOutlined />,
            bg: 'from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10',
            borderL: 'border-l-blue-500',
            borderTheme: 'border-blue-900/30',
            iconBoxBg: 'from-blue-500 to-indigo-650',
            textTitle: 'text-blue-600/80',
            textValue: 'text-blue-800 dark:text-blue-400',
            bgIconColor: 'text-blue-600 dark:text-blue-400',
            shadowColor: 'shadow-blue-200'
        },
        {
            title: 'Sinh viên tham gia',
            value: totals.totalStudents,
            icon: <TeamOutlined />,
            bg: 'from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10',
            borderL: 'border-l-purple-500',
            borderTheme: 'border-purple-900/30',
            iconBoxBg: 'from-purple-500 to-violet-650',
            textTitle: 'text-purple-600/80',
            textValue: 'text-purple-800 dark:text-purple-400',
            bgIconColor: 'text-purple-600 dark:text-purple-400',
            shadowColor: 'shadow-purple-200'
        }
    ];

    const textColor = isDark ? '#f3f4f6' : '#374151';
    const gridColor = isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.6)';

    // Chart Options
    const doughnutOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'bottom', 
                labels: { 
                    usePointStyle: true, 
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
        cutout: '72%'
    };

    const barOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                titleColor: isDark ? '#f3f4f6' : '#1f2937',
                bodyColor: isDark ? '#d1d5db' : '#4b5563',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                grid: { color: gridColor, borderDash: [4, 4] },
                ticks: { color: textColor, stepSize: 1 }
            },
            x: { 
                grid: { display: false },
                ticks: { color: textColor }
            }
        }
    };

    const horizontalBarOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
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
                beginAtZero: true, 
                grid: { color: gridColor, borderDash: [4, 4] },
                ticks: { color: textColor, stepSize: 1 }
            },
            y: { 
                grid: { display: false },
                ticks: { color: textColor }
            }
        }
    };

    // Chart Data
    const scaleData = {
        labels: charts.enterpriseByScale?.map(item => item.scale) || [],
        datasets: [{
            data: charts.enterpriseByScale?.map(item => item.count) || [],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 6
        }]
    };

    const actTypeData = {
        labels: charts.activityTypes?.map(item => item.type) || [],
        datasets: [{
            data: charts.activityTypes?.map(item => item.count) || [],
            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'],
            borderWidth: 0,
            hoverOffset: 6
        }]
    };

    const statusData = {
        labels: charts.enterpriseByStatus?.map(item => item.status) || [],
        datasets: [{
            label: 'Số lượng',
            data: charts.enterpriseByStatus?.map(item => item.count) || [],
            backgroundColor: charts.enterpriseByStatus?.map(item => {
                if (item.status === 'Đang triển khai' || item.status === 'Đang hợp tác') return '#10b981';
                if (item.status === 'Đã ký kết') return '#3b82f6';
                if (item.status === 'Đề xuất' || item.status === 'Chờ ký') return '#f59e0b';
                return '#ef4444';
            }) || '#3b82f6',
            borderRadius: 6,
            barThickness: 24
        }]
    };

    const fieldsData = {
        labels: charts.enterpriseByFields?.map(item => item.field) || [],
        datasets: [{
            label: 'Doanh nghiệp',
            data: charts.enterpriseByFields?.map(item => item.count) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderRadius: 4,
            barThickness: 16
        }]
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <DashboardOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Tổng quan hệ thống</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Theo dõi các chỉ số quan trọng và hoạt động hợp tác doanh nghiệp</p>
                    </div>
                </div>
            </div>

            {/* Period & Faculty Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-8 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
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
                            className="bg-gray-50 dark:bg-gray-800/50 inline-block sm:inline-flex"
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
                        <span className="text-xs text-gray-400 ml-auto">
                            📅 {getPeriodLabel()}
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} className="mb-8">
                {kpiCards.map((kpi, idx) => (
                    <Col xs={12} sm={12} xl={6} key={idx}>
                        <div className={`group relative overflow-hidden bg-gradient-to-br ${kpi.bg} rounded-2xl p-5 border-l-4 ${kpi.borderL} border border-slate-100 dark:${kpi.borderTheme} transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default`}>
                            <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                                {React.cloneElement(kpi.icon, { className: `text-6xl ${kpi.bgIconColor}` })}
                            </div>
                            <div className="flex items-center gap-3.5 relative z-10">
                                <div className={`w-12 h-12 bg-gradient-to-br ${kpi.iconBoxBg} rounded-xl flex items-center justify-center shadow-md ${kpi.shadowColor} dark:shadow-none group-hover:scale-105 transition-transform duration-300`}>
                                    {React.cloneElement(kpi.icon, { className: 'text-white text-lg' })}
                                </div>
                                <div>
                                    <div className={`text-2xl sm:text-3xl font-extrabold ${kpi.textValue} leading-none mb-1`}>{kpi.value}</div>
                                    <div className={`text-xs font-semibold ${kpi.textTitle} uppercase tracking-wider`}>{kpi.title}</div>
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            {/* Row 2: Charts */}
            <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} lg={8}>
                    <Card title={<span className="font-semibold text-gray-700 dark:text-gray-200">Quy mô doanh nghiệp</span>} className="shadow-sm rounded-xl h-full border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="h-64 flex justify-center relative">
                            <Doughnut data={scaleData} options={doughnutOptions} />
                            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-gray-400 text-xs m-0">Tổng</p>
                                <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 m-0">{totals.totalEnterprises}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<span className="font-semibold text-gray-700 dark:text-gray-200">Trạng thái hợp tác</span>} className="shadow-sm rounded-xl h-full border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="h-64">
                            <Bar data={statusData} options={barOptions} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<span className="font-semibold text-gray-700 dark:text-gray-200">{`Loại hình hoạt động (${getPeriodTitle()})`}</span>} className="shadow-sm rounded-xl h-full border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="h-64 flex justify-center relative">
                            <Doughnut data={actTypeData} options={doughnutOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Row 3: Fields & Upcoming */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={14}>
                    <Card title={<span className="font-semibold text-gray-700 dark:text-gray-200">Doanh nghiệp theo lĩnh vực</span>} className="shadow-sm rounded-xl h-full border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="h-[350px]">
                            <Bar data={fieldsData} options={horizontalBarOptions} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <CalendarOutlined className="text-vluRed" />
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Hoạt động sắp diễn ra</span>
                            </div>
                        }
                        className="shadow-sm rounded-xl h-full border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                        styles={{ body: { padding: '0 24px' } }}
                    >
                        {upcomingActivities && upcomingActivities.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={upcomingActivities}
                                renderItem={item => {
                                    const date = dayjs(item.start_date);
                                    const isToday = date.isSame(dayjs(), 'day');
                                    return (
                                        <List.Item className="py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:bg-gray-800/50 transition-colors px-2 -mx-2 rounded-lg group cursor-pointer">
                                            <div className="flex items-start gap-4 w-full">
                                                <div className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg ${isToday ? 'bg-red-50 border border-red-200' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
                                                    <span className={`text-xs font-medium uppercase ${isToday ? 'text-red-500' : 'text-gray-500'}`}>{date.format('MMM')}</span>
                                                    <span className={`text-xl font-bold ${isToday ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}`}>{date.format('DD')}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate pr-4 group-hover:text-vluRed transition-colors" title={item.title}>
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <BankOutlined />
                                                        <span className="truncate">{item.enterprise_name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <Tag color={item.status === 'Đề xuất' ? 'orange' : 'blue'} className="m-0 border-0">
                                                        {item.status}
                                                    </Tag>
                                                </div>
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        ) : (
                            <div className="h-[350px] flex flex-col items-center justify-center text-gray-400">
                                <CalendarOutlined className="text-4xl mb-3 opacity-50" />
                                <p>Không có hoạt động nào sắp diễn ra</p>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;