import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty } from 'antd';
import { TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ReportStudents = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/reports/students-by-enterprise');
            setData(res.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: false },
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    const doughnutData = {
        labels: byMajor.map(i => i.major),
        datasets: [{
            data: byMajor.map(i => i.count),
            backgroundColor: [
                '#DA251D', '#1890ff', '#52c41a', '#faad14', 
                '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16'
            ],
            borderWidth: 2,
            borderColor: '#fff',
        }],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 16 } },
        },
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Sinh viên thực tập theo công ty</h1>
                <p className="text-gray-400 text-sm">Biểu đồ thống kê phân bổ sinh viên tại các doanh nghiệp liên kết</p>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                        <Statistic title="Tổng sinh viên" value={overview.total || 0} prefix={<TeamOutlined className="text-blue-500" />} valueStyle={{ fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-green-50 to-white">
                        <Statistic title="Đang thực tập" value={overview.active || 0} prefix={<CheckCircleOutlined className="text-green-500" />} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-orange-50 to-white">
                        <Statistic title="Chờ phân công" value={overview.pending || 0} prefix={<ClockCircleOutlined className="text-orange-500" />} valueStyle={{ color: '#faad14', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
                        <Statistic title="GPA Trung bình" value={overview.avgGpa || 0} prefix={<TrophyOutlined className="text-purple-500" />} valueStyle={{ color: '#722ed1', fontWeight: 'bold' }} />
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[20, 20]}>
                <Col xs={24} lg={16}>
                    <Card title="Số lượng sinh viên thực tập tại từng công ty" className="rounded-xl shadow-sm h-full">
                        <div style={{ height: 400 }}>
                            {byEnterprise.length > 0 ? (
                                <Bar data={barChartData} options={barOptions} />
                            ) : (
                                <Empty description="Chưa có dữ liệu" className="mt-20" />
                            )}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Phân bổ theo ngành học" className="rounded-xl shadow-sm h-full">
                        <div style={{ height: 400 }}>
                            {byMajor.length > 0 ? (
                                <Doughnut data={doughnutData} options={doughnutOptions} />
                            ) : (
                                <Empty description="Chưa có dữ liệu" className="mt-20" />
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportStudents;
