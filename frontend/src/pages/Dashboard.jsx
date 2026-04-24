import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, List, Tag, Typography } from 'antd';
import { 
    BankOutlined, 
    CheckCircleOutlined, 
    AppstoreOutlined, 
    TeamOutlined,
    CalendarOutlined,
    RightOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
    LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement 
} from 'chart.js';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement);

const { Title: AntTitle, Text } = Typography;

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/stats/dashboard');
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

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
            shadow: 'shadow-red-200'
        },
        {
            title: 'Đang hợp tác',
            value: totals.collaboratingEnterprises,
            icon: <CheckCircleOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
            shadow: 'shadow-emerald-200'
        },
        {
            title: 'Hoạt động năm nay',
            value: totals.activitiesThisYear,
            icon: <AppstoreOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            shadow: 'shadow-blue-200'
        },
        {
            title: 'Sinh viên tham gia',
            value: totals.totalStudents,
            icon: <TeamOutlined className="text-4xl text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />,
            bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            shadow: 'shadow-purple-200'
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
            backgroundColor: ['#DA251D', '#ff7875', '#ffa39e', '#cf1322', '#a8071a', '#1890ff', '#faad14'],
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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <AntTitle level={2} className="!mb-1 !text-gray-800">Tổng quan hệ thống</AntTitle>
                <Text type="secondary">Theo dõi các chỉ số quan trọng và hoạt động hợp tác doanh nghiệp</Text>
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
                    <Card title={<span className="font-semibold text-gray-700">Quy mô doanh nghiệp</span>} className="shadow-sm rounded-xl h-full border-gray-100 hover:shadow-md transition-shadow">
                        <div className="h-64 flex justify-center relative">
                            <Doughnut data={scaleData} options={doughnutOptions} />
                            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-gray-400 text-xs m-0">Tổng</p>
                                <p className="text-2xl font-bold text-gray-700 m-0">{totals.totalEnterprises}</p>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<span className="font-semibold text-gray-700">Trạng thái hợp tác</span>} className="shadow-sm rounded-xl h-full border-gray-100 hover:shadow-md transition-shadow">
                        <div className="h-64">
                            <Bar data={statusData} options={barOptions} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title={<span className="font-semibold text-gray-700">Loại hình hoạt động</span>} className="shadow-sm rounded-xl h-full border-gray-100 hover:shadow-md transition-shadow">
                        <div className="h-64 flex justify-center relative">
                            <Doughnut data={actTypeData} options={doughnutOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Row 3: Fields & Upcoming */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={14}>
                    <Card title={<span className="font-semibold text-gray-700">Doanh nghiệp theo lĩnh vực</span>} className="shadow-sm rounded-xl h-full border-gray-100 hover:shadow-md transition-shadow">
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
                                <span className="font-semibold text-gray-700">Hoạt động sắp diễn ra</span>
                            </div>
                        } 
                        className="shadow-sm rounded-xl h-full border-gray-100 hover:shadow-md transition-shadow"
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
                                        <List.Item className="py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg group cursor-pointer">
                                            <div className="flex items-start gap-4 w-full">
                                                <div className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg ${isToday ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                                                    <span className={`text-xs font-medium uppercase ${isToday ? 'text-red-500' : 'text-gray-500'}`}>{date.format('MMM')}</span>
                                                    <span className={`text-xl font-bold ${isToday ? 'text-red-600' : 'text-gray-700'}`}>{date.format('DD')}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-4 group-hover:text-vluRed transition-colors" title={item.title}>
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