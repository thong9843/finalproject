import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Spin, Empty, Button, message, Segmented, DatePicker, Space } from 'antd';
import { AppstoreOutlined, BankOutlined, CheckCircleOutlined, SyncOutlined, DownloadOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <BarChartOutlined className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Thống kê hoạt động hợp tác</h1>
                        <p className="text-sm text-slate-500 m-0 mt-0.5">Báo cáo và phân tích các hoạt động hợp tác với doanh nghiệp</p>
                    </div>
                </div>
                <Button 
                    size="large"
                    icon={<DownloadOutlined />} 
                    onClick={handleExport} 
                    className="border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg shadow-sm font-medium hover:border-emerald-700"
                >
                    Xuất Báo Cáo
                </Button>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Red Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 rounded-2xl p-5 border-l-4 border-l-vluRed border border-slate-100 dark:border-red-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <AppstoreOutlined className="text-6xl text-vluRed dark:text-red-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-vluRed to-red-600 rounded-xl flex items-center justify-center shadow-md shadow-red-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <AppstoreOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-red-800 dark:text-red-400 leading-none mb-1">{overview.total || 0}</div>
                            <div className="text-xs font-semibold text-red-600/80 uppercase tracking-wider">Tổng hoạt động</div>
                        </div>
                    </div>
                </div>

                {/* Green Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl p-5 border-l-4 border-l-emerald-500 border border-slate-100 dark:border-emerald-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <SyncOutlined className="text-6xl text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <SyncOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 leading-none mb-1">{overview.active || 0}</div>
                            <div className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider">Đang hoạt động</div>
                        </div>
                    </div>
                </div>

                {/* Blue Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl p-5 border-l-4 border-l-blue-500 border border-slate-100 dark:border-blue-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <CheckCircleOutlined className="text-6xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <CheckCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-blue-800 dark:text-blue-400 leading-none mb-1">{overview.completed || 0}</div>
                            <div className="text-xs font-semibold text-blue-600/80 uppercase tracking-wider">Hoàn thành</div>
                        </div>
                    </div>
                </div>

                {/* Purple Card */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl p-5 border-l-4 border-l-purple-500 border border-slate-100 dark:border-purple-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default">
                    <div className="absolute -right-2 -bottom-2 opacity-10 transition-transform duration-500 group-hover:scale-110">
                        <BankOutlined className="text-6xl text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex items-center gap-3.5 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                            <BankOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-extrabold text-purple-800 dark:text-purple-400 leading-none mb-1">{overview.enterprises || 0}</div>
                            <div className="text-xs font-semibold text-purple-600/80 uppercase tracking-wider">DN hợp tác</div>
                        </div>
                    </div>
                </div>
            </div>

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
