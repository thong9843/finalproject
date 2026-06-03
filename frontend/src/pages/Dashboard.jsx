import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Spin, List, Tag, Typography, Segmented, DatePicker } from 'antd';
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
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('year');
    const [customRange, setCustomRange] = useState(null);

    useEffect(() => {
        document.title = "Tổng quan | VLU Enterprise Link Manager";
    }, []);

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
                const { data } = await api.get('/stats/dashboard', { params });
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dateRange]);

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
            icon: <BankOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-red-500 to-red-600',
            shadow: 'shadow-red-200 dark:shadow-none'
        },
        {
            title: 'Đang hợp tác',
            value: totals.collaboratingEnterprises,
            icon: <CheckCircleOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
            shadow: 'shadow-emerald-200 dark:shadow-none'
        },
        {
            title: `Hoạt động (${getPeriodTitle()})`,
            value: totals.activitiesCount,
            icon: <AppstoreOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            shadow: 'shadow-blue-200 dark:shadow-none'
        },
        {
            title: 'Sinh viên tham gia',
            value: totals.totalStudents,
            icon: <TeamOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            shadow: 'shadow-purple-200 dark:shadow-none'
        }
    ];

    // Chart Options
    const doughnutOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        },
        cutout: '70%'
    };

    const barOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
            x: { grid: { display: false } }
        }
    };

    const horizontalBarOptions = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { beginAtZero: true, grid: { borderDash: [4, 4] } },
            y: { grid: { display: false } }
        }
    };

    // Chart Data
    const scaleData = {
        labels: charts.enterpriseByScale?.map(item => item.scale) || [],
        datasets: [{
            data: charts.enterpriseByScale?.map(item => item.count) || [],
            backgroundColor: ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const actTypeData = {
        labels: charts.activityTypes?.map(item => item.type) || [],
        datasets: [{
            data: charts.activityTypes?.map(item => item.count) || [],
            backgroundColor: ['#DA251D', '#7ce228ff', '#ffa39e', '#13b3cfff', '#a80772ff', '#18ff4a71', '#faad14'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const statusData = {
        labels: charts.enterpriseByStatus?.map(item => item.status) || [],
        datasets: [{
            label: 'Số lượng',
            data: charts.enterpriseByStatus?.map(item => item.count) || [],
            backgroundColor: 'rgba(218, 37, 29, 0.8)',
            borderRadius: 6,
            barThickness: 24
        }]
    };

    const fieldsData = {
        labels: charts.enterpriseByFields?.map(item => item.field) || [],
        datasets: [{
            label: 'Doanh nghiệp',
            data: charts.enterpriseByFields?.map(item => item.count) || [],
            backgroundColor: 'rgba(24, 144, 255, 0.7)',
            borderRadius: 4,
            barThickness: 16
        }]
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <DashboardOutlined className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Tổng quan hệ thống</h1>
                        <p className="text-sm text-slate-500 m-0 mt-0.5">Theo dõi các chỉ số quan trọng và hoạt động hợp tác doanh nghiệp</p>
                    </div>
                </div>
            </div>

            {/* Period Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-8 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <CalendarOutlined className="text-lg" />
                    <span className="text-sm font-medium">Khoảng thời gian:</span>
                </div>
                <Segmented
                    options={periodOptions}
                    value={period}
                    onChange={(val) => {
                        setPeriod(val);
                        if (val !== 'custom') setCustomRange(null);
                    }}
                    className="bg-gray-50 dark:bg-gray-800/50"
                />
                {period === 'custom' && (
                    <RangePicker
                        format="DD/MM/YYYY"
                        value={customRange}
                        onChange={setCustomRange}
                        placeholder={['Từ ngày', 'Đến ngày']}
                        className="rounded-lg"
                        allowClear={false}
                    />
                )}
                {dateRange[0] && dateRange[1] && (
                    <span className="text-xs text-gray-400 ml-auto">
                        📅 {getPeriodLabel()}
                    </span>
                )}
            </div>

            {/* KPI Cards */}
            <Row gutter={[24, 24]} className="mb-8">
                {kpiCards.map((kpi, idx) => (
                    <Col xs={24} sm={12} xl={6} key={idx}>
                        <div className={`group relative overflow-hidden rounded-2xl ${kpi.bg} p-6 shadow-lg ${kpi.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default`}>
                            <div className="absolute -right-4 -top-4 opacity-20 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                                {React.cloneElement(kpi.icon, { className: 'text-8xl' })}
                            </div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <p className="text-white/80 text-sm font-medium mb-1">{kpi.title}</p>
                                    <h3 className="text-4xl font-bold text-white m-0">{kpi.value}</h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    {kpi.icon}
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
                        bodyStyle={{ padding: '0 24px' }}
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