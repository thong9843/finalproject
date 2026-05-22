import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Button, message, Segmented, DatePicker, Space } from 'antd';
import { AppstoreOutlined, BankOutlined, CheckCircleOutlined, SyncOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler);

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

const ReportActivities = () => {
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
        document.title = "Báo cáo Hoạt động | VLU Enterprise Link Manager";
    }, []);

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
            const res = await api.get('/reports/activities-by-enterprise', { params });
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

    if (loading) return <div className="flex justify-center items-center h-96"><Spin size="large" /></div>;
    if (!data) return <Empty description="Không có dữ liệu" />;

    const { byType, byEnterprise, byStatus, byMonth, overview } = data;

    // Biểu đồ cột: Hoạt động theo công ty
    const barData = {
        labels: byEnterprise.map(i => i.enterprise),
        datasets: [
            {
                label: 'Đang hoạt động',
                data: byEnterprise.map(i => i.active),
                backgroundColor: '#52c41a',
                borderRadius: 6,
                barPercentage: 0.5,
            },
            {
                label: 'Hoàn thành',
                data: byEnterprise.map(i => i.completed),
                backgroundColor: '#1890ff',
                borderRadius: 6,
                barPercentage: 0.5,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    // Biểu đồ tròn: Cơ cấu loại hình hoạt động
    const typeColors = ['#DA251D', '#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];
    const pieData = {
        labels: byType.map(i => i.type),
        datasets: [{
            data: byType.map(i => i.count),
            backgroundColor: typeColors.slice(0, byType.length),
            borderWidth: 2,
            borderColor: '#fff',
        }],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
        },
    };

    // Biểu đồ đường: Hoạt động theo tháng
    const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const monthData = new Array(12).fill(0);
    byMonth.forEach(item => { monthData[item.month - 1] = item.count; });

    const lineData = {
        labels: monthLabels,
        datasets: [{
            label: 'Số hoạt động',
            data: monthData,
            borderColor: '#DA251D',
            backgroundColor: 'rgba(218, 37, 29, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#DA251D',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
        }],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    const handleExport = () => {
        if (!data) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }

        const wb = XLSX.utils.book_new();

        // Sheet 1: Tổng quan
        const overviewSheet = XLSX.utils.json_to_sheet([
            { 'Chỉ số': 'Khoảng thời gian', 'Giá trị': getPeriodLabel() },
            { 'Chỉ số': 'Tổng hoạt động', 'Giá trị': overview.total || 0 },
            { 'Chỉ số': 'Đang hoạt động', 'Giá trị': overview.active || 0 },
            { 'Chỉ số': 'Hoàn thành', 'Giá trị': overview.completed || 0 },
            { 'Chỉ số': 'Doanh nghiệp hợp tác', 'Giá trị': overview.enterprises || 0 },
        ]);
        XLSX.utils.book_append_sheet(wb, overviewSheet, "Tổng quan");

        // Sheet 2: Theo doanh nghiệp
        const enterpriseSheet = XLSX.utils.json_to_sheet(byEnterprise.map(item => ({
            'Doanh nghiệp': item.enterprise,
            'Tổng số': item.count,
            'Đang hoạt động': item.active,
            'Hoàn thành': item.completed
        })));
        XLSX.utils.book_append_sheet(wb, enterpriseSheet, "Theo Doanh Nghiệp");

        // Sheet 3: Theo loại hình
        const typeSheet = XLSX.utils.json_to_sheet(byType.map(item => ({
            'Loại hình': item.type,
            'Số lượng': item.count
        })));
        XLSX.utils.book_append_sheet(wb, typeSheet, "Theo Loại Hình");

        // Sheet 4: Theo tháng
        const monthSheet = XLSX.utils.json_to_sheet(byMonth.map(item => ({
            'Tháng': item.month,
            'Số lượng': item.count
        })));
        XLSX.utils.book_append_sheet(wb, monthSheet, "Theo Tháng");

        XLSX.writeFile(wb, `BaoCaoHoatDong_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hoạt động hợp tác theo công ty</h1>
                    <p className="text-gray-400 text-sm">Phân tích chi tiết các hoạt động hợp tác với doanh nghiệp liên kết</p>
                </div>
                <Button icon={<DownloadOutlined />} onClick={handleExport} type="primary" className="bg-vluRed h-10 px-5 rounded-lg">Xuất Báo Cáo</Button>
            </div>

            {/* Period Selector */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
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

            {/* Stats */}
            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm dark:shadow-none bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10">
                        <Statistic title={<span className="text-gray-500 dark:text-gray-400">Tổng hoạt động</span>} value={overview.total || 0} prefix={<AppstoreOutlined className="text-vluRed dark:text-red-400" />} valueStyle={{ fontWeight: 'bold', color: 'inherit' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-green-100 dark:border-green-900/50 shadow-sm dark:shadow-none bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10">
                        <Statistic title={<span className="text-gray-500 dark:text-gray-400">Đang hoạt động</span>} value={overview.active || 0} prefix={<SyncOutlined className="text-green-500 dark:text-green-400" />} valueStyle={{ color: '#3f8600', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm dark:shadow-none bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10">
                        <Statistic title={<span className="text-gray-500 dark:text-gray-400">Hoàn thành</span>} value={overview.completed || 0} prefix={<CheckCircleOutlined className="text-blue-500 dark:text-blue-400" />} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card className="rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm dark:shadow-none bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10">
                        <Statistic title={<span className="text-gray-500 dark:text-gray-400">Doanh nghiệp hợp tác</span>} value={overview.enterprises || 0} prefix={<BankOutlined className="text-purple-500 dark:text-purple-400" />} valueStyle={{ color: '#722ed1', fontWeight: 'bold' }} />
                    </Card>
                </Col>
            </Row>

            {/* Row 1: Bar + Pie */}
            <Row gutter={[20, 20]} className="mb-6">
                <Col xs={24} lg={14}>
                    <Card title={<span className="">Hoạt động hợp tác theo từng công ty</span>} className="rounded-xl shadow-sm h-full">
                        <div style={{ height: 350 }}>
                            {byEnterprise.length > 0 ? (
                                <Bar data={barData} options={barOptions} />
                            ) : (
                                <Empty description="Chưa có dữ liệu trong khoảng thời gian này" className="mt-20" />
                            )}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title={<span className="">Cơ cấu loại hình hoạt động</span>} className="rounded-xl shadow-sm h-full">
                        <div style={{ height: 350 }}>
                            {byType.length > 0 ? (
                                <Pie data={pieData} options={pieOptions} />
                            ) : (
                                <Empty description="Chưa có dữ liệu trong khoảng thời gian này" className="mt-20" />
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Row 2: Line chart */}
            <Row gutter={[20, 20]}>
                <Col xs={24}>
                    <Card title={<span className="">{period === 'all' ? 'Xu hướng hoạt động theo tháng' : `Xu hướng hoạt động theo tháng (${getPeriodLabel()})`}</span>} className="rounded-xl shadow-sm">
                        <div style={{ height: 300 }}>
                            <Line data={lineData} options={lineOptions} />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportActivities;
