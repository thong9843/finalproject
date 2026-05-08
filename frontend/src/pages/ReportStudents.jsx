import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Segmented, DatePicker, Button, message } from 'antd';
import { TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, CalendarOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import * as XLSX from 'xlsx';

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
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('year');
    const [customRange, setCustomRange] = useState(null);

    const dateRange = useMemo(() => {
        if (period === 'custom' && customRange) {
            return customRange;
        }
        return getDateRange(period);
    }, [period, customRange]);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            const [from, to] = dateRange;
            if (from) params.date_from = from.format('YYYY-MM-DD');
            if (to) params.date_to = to.format('YYYY-MM-DD');
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Sinh viên thực tập theo công ty</h1>
                    <p className="text-gray-400 text-sm">Biểu đồ thống kê phân bổ sinh viên tại các doanh nghiệp liên kết</p>
                </div>
                <Button icon={<DownloadOutlined />} onClick={handleExport} type="primary" className="bg-vluRed h-10 px-5 rounded-lg">Xuất Báo Cáo</Button>
            </div>

            {/* Period Selector */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
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
                    className="bg-white dark:bg-gray-800 shadow-sm"
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

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                        <Statistic title={<span className="">Tổng sinh viên</span>} value={overview.total || 0} prefix={<TeamOutlined className="text-blue-500" />} valueStyle={{ fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-green-50 to-white">
                        <Statistic title={<span className="">Đang thực tập</span>} value={overview.active || 0} prefix={<CheckCircleOutlined className="text-green-500" />} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-orange-50 to-white">
                        <Statistic title={<span className="">Chờ phân công</span>} value={overview.pending || 0} prefix={<ClockCircleOutlined className="text-orange-500" />} valueStyle={{ color: '#faad14', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
                        <Statistic title={<span className="">GPA Trung bình</span>} value={overview.avgGpa || 0} prefix={<TrophyOutlined className="text-purple-500" />} valueStyle={{ color: '#722ed1', fontWeight: 'bold' }} />
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[20, 20]}>
                <Col xs={24} lg={16}>
                    <Card title={<span className="">Số lượng sinh viên thực tập tại từng công ty</span>} className="rounded-xl shadow-sm h-full">
                        <div style={{ height: 400 }}>
                            {byEnterprise.length > 0 ? (
                                <Bar data={barChartData} options={barOptions} />
                            ) : (
                                <Empty description="Chưa có dữ liệu trong khoảng thời gian này" className="mt-20" />
                            )}
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
        </div>
    );
};

export default ReportStudents;
