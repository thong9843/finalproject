import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { BankOutlined, CheckCircleOutlined, AppstoreOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

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

    if (loading || !stats) {
        return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    }

    const { totals, charts } = stats;

    const pieData = {
        labels: charts.activityTypes.map(item => item.type),
        datasets: [
            {
                data: charts.activityTypes.map(item => item.count),
                backgroundColor: [
                    '#DA251D', '#ff7875', '#ff4d4f', '#ffa39e', '#cf1322', '#a8071a'
                ],
                borderWidth: 1,
            },
        ],
    };

    const barData = {
        labels: charts.enterpriseByFaculty.map(item => item.faculty),
        datasets: [
            {
                label: 'Số lượng doanh nghiệp',
                data: charts.enterpriseByFaculty.map(item => item.count),
                backgroundColor: '#DA251D',
            },
        ],
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Tổng quan hệ thống</h1>
            
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-l-4 border-vluRed">
                        <Statistic title="Tổng doanh nghiệp" value={totals.totalEnterprises} prefix={<BankOutlined className="text-vluRed" />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-l-4 border-green-500">
                        <Statistic title="Doanh nghiệp đang hợp tác" value={totals.collaboratingEnterprises} prefix={<CheckCircleOutlined className="text-green-500" />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-l-4 border-blue-500">
                        <Statistic title="Tổng hoạt động năm nay" value={totals.activitiesThisYear} prefix={<AppstoreOutlined className="text-blue-500" />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="shadow-sm border-l-4 border-purple-500">
                        <Statistic title="Tổng sinh viên tham gia" value={totals.totalStudents} prefix={<TeamOutlined className="text-purple-500" />} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title="Cơ cấu loại hình hoạt động" className="shadow-sm h-full item">
                        <div className="h-64 flex justify-center">
                            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Số lượng doanh nghiệp theo Khoa" className="shadow-sm h-full">
                        <div className="h-64">
                            <Bar data={barData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
