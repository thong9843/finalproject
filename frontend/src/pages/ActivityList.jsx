import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Form, Select, Button, Modal, message, Input, DatePicker, Statistic, Spin, Empty, Tooltip } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, CheckOutlined, PauseCircleOutlined, TeamOutlined, BankOutlined, CalendarOutlined, UploadOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined, AppstoreOutlined, UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;

const ActivityList = () => {
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

    useEffect(() => {
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

    const handleSave = async (values) => {
        try {
            const formattedValues = {
                ...values,
                start_date: values.start_date?.format('YYYY-MM-DD'),
                end_date: values.end_date?.format('YYYY-MM-DD') || null,
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

    const handleDelete = async (id) => {
        try {
            await api.delete(`/activities/${id}`);
            message.success('Xóa thành công');
            fetchData();
            fetchStats();
        } catch (error) {
            message.error('Lỗi khi xóa');
        }
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
        'Đề xuất': { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', icon: <ClockCircleOutlined /> },
        'Phê duyệt nội bộ': { color: '#fa541c', bg: '#fff2e8', border: '#ffbb96', icon: <SyncOutlined spin /> },
        'Đã triển khai': { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', icon: <CheckOutlined /> },
        'Đã kết thúc': { color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff', icon: <PauseCircleOutlined /> },
    };

    const typeConfig = {
        'Tuyển dụng & Thực tập': { color: '#DA251D', bg: '#fff1f0' },
        'Hội thảo & Đào tạo': { color: '#1890ff', bg: '#e6f7ff' },
        'Tài trợ & Học bổng': { color: '#52c41a', bg: '#f6ffed' },
        'Tham quan doanh nghiệp': { color: '#13c2c2', bg: '#e6fffb' },
        'Kiểm định & Đánh giá': { color: '#722ed1', bg: '#f9f0ff' },
        'Ký kết MOU': { color: '#eb2f96', bg: '#fff0f6' },
        'Khác': { color: '#8c8c8c', bg: '#fafafa' },
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
        return matchSearch && matchType && matchStatus && matchEnterprise;
    });

    const handleExport = () => {
        if (!filteredData || filteredData.length === 0) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }
        const exportData = filteredData.map(item => ({
            'ID': item.id,
            'Tên hoạt động': item.title,
            'Doanh nghiệp': item.enterprise_name || '',
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 transition-colors">Hoạt động hợp tác</h1>
                    <p className="text-gray-400 text-sm">{data.length} hoạt động · {stats?.active || 0} đang diễn ra</p>
                </div>
                <div className="flex gap-3">
                    <Button icon={<UploadOutlined />} onClick={() => setShowImport(true)} className="h-10 rounded-lg">Import</Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport} className="h-10 rounded-lg">Xuất Excel</Button>
                    <Button type="primary" className="bg-vluRed h-10 px-5 rounded-lg" icon={<PlusOutlined />} onClick={() => {
                        setEditingId(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}>Thêm hoạt động</Button>
                </div>
            </div>

            {/* Search + Filter bar */}
            <div className="flex gap-3 mb-5 flex-wrap">
                <input
                    placeholder="Tìm theo tên, doanh nghiệp..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <Select allowClear placeholder="Doanh nghiệp" onChange={setFilterEnterprise} className="w-48" size="middle" showSearch optionFilterProp="children">
                    {enterprises.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                </Select>
                <Select allowClear placeholder="Loại hoạt động" onChange={setFilterType} className="w-52" size="middle">
                    {['Tuyển dụng & Thực tập', 'Hội thảo & Đào tạo', 'Tài trợ & Học bổng', 'Tham quan doanh nghiệp', 'Kiểm định & Đánh giá', 'Ký kết MOU', 'Khác'].map(t => (
                        <Option key={t} value={t}>{t}</Option>
                    ))}
                </Select>
                <Select allowClear placeholder="Trạng thái" onChange={setFilterStatus} className="w-44" size="middle">
                    {Object.keys(statusConfig).map(s => <Option key={s} value={s}>{s}</Option>)}
                </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100/50/30/10 rounded-2xl p-5 border border-green-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                            <SyncOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-700">{stats?.active || 0}</div>
                            <div className="text-xs text-green-600/70/70">Đang hoạt động</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50/30/10 rounded-2xl p-5 border border-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <CheckCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-700">{stats?.completed || 0}</div>
                            <div className="text-xs text-blue-600/70/70">Hoàn thành</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50/30/10 rounded-2xl p-5 border border-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                            <ClockCircleOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-700">{stats?.pending || 0}</div>
                            <div className="text-xs text-orange-600/70/70">Chờ triển khai</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50/30/10 rounded-2xl p-5 border border-purple-100 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            <TeamOutlined className="text-white text-lg" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-700">{stats?.totalStudents || 0}</div>
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                    filterType === type 
                                        ? 'ring-2 ring-offset-1 shadow-sm' 
                                        : 'hover:shadow-sm'
                                }`}
                                style={{ 
                                    color: tc.color, 
                                    backgroundColor: tc.bg, 
                                    borderColor: filterType === type ? tc.color : 'transparent',
                                    '--tw-ring-color': tc.color 
                                }}
                            >
                                {typeIcons[type] || '📋'} {type} <span className="font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex flex-wrap items-center gap-3 transition-colors">
                <Input
                    placeholder="Tìm kiếm hoạt động, doanh nghiệp..."
                    prefix={<SearchOutlined className="text-gray-300" />}
                    className="flex-1 min-w-[200px] rounded-lg"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
                <Select placeholder="Tất cả loại" allowClear onChange={v => setFilterType(v)} value={filterType} className="w-44 search-select-dark">
                    {activityTypes.map(act => (
                        <Option key={act.id} value={act.name}>{act.name}</Option>
                    ))}
                    <Option value="Khác">Khác</Option>
                </Select>
                <Select placeholder="Tất cả trạng thái" allowClear onChange={v => setFilterStatus(v)} value={filterStatus} className="w-44 search-select-dark">
                    <Option value="Đề xuất">Đề xuất</Option>
                    <Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Option>
                    <Option value="Đã triển khai">Đã triển khai</Option>
                    <Option value="Đã kết thúc">Đã kết thúc</Option>
                </Select>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden transition-colors">
                    <button onClick={() => setViewMode('grid')} className={`p-2 px-3 transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-800' : 'text-gray-400 hover:text-gray-600:text-gray-300'}`}>
                        <AppstoreOutlined />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 px-3 transition-colors ${viewMode === 'list' ? 'bg-white text-gray-800' : 'text-gray-400 hover:text-gray-600:text-gray-300'}`}>
                        <UnorderedListOutlined />
                    </button>
                </div>
            </div>

            {/* Activity Cards */}
            {loading ? (
                <div className="flex justify-center py-20"><Spin size="large" /></div>
            ) : filteredData.length > 0 ? (
                <Row gutter={[20, 20]}>
                    {filteredData.map(item => {
                        const sc = statusConfig[item.status] || { color: '#8c8c8c', bg: '#fafafa', icon: <ClockCircleOutlined /> };
                        const tc = typeConfig[item.type] || typeConfig['Khác'];
                        const tags = item.type ? item.type.split(' ').slice(0, 2) : [];

                        return (
                            <Col xs={24} sm={viewMode === 'list' ? 24 : 12} lg={viewMode === 'list' ? 24 : 8} key={item.id}>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col overflow-hidden group">
                                    {/* Card Header */}
                                    <div className="p-5 pb-3 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm" 
                                                     style={{ backgroundColor: tc.bg }}>
                                                    {typeIcons[item.type] || '📋'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-800 text-[15px] leading-snug line-clamp-2 mb-1 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs transition-colors">
                                                        <BankOutlined />
                                                        <span className="truncate">{item.enterprise_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Tag 
                                                className="rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 border-0 ml-2"
                                                style={{ color: sc.color, backgroundColor: sc.bg }}
                                            >
                                                {item.status}
                                            </Tag>
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
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ color: tc.color, backgroundColor: tc.bg }}>
                                                    {item.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-white/50 transition-colors">
                                        <Select
                                            size="small"
                                            value={item.status}
                                            onChange={(val) => handleUpdateStatus(item.id, val)}
                                            className="w-[140px]"
                                            bordered={false}
                                        >
                                            <Option value="Đề xuất">Đề xuất</Option>
                                            <Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Option>
                                            <Option value="Đã triển khai">Đã triển khai</Option>
                                            <Option value="Đã kết thúc">Đã kết thúc</Option>
                                        </Select>
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
                                                            collaboration_date: item.collaboration_date ? dayjs(item.collaboration_date) : null,
                                                        });
                                                        setIsModalVisible(true);
                                                    }}>
                                                    <EditOutlined style={{ fontSize: 13 }} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
                                                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50:bg-red-900/30 transition-all"
                                                    onClick={() => Modal.confirm({ title: 'Xác nhận xóa hoạt động này?', onOk: () => handleDelete(item.id) })}>
                                                    <DeleteOutlined style={{ fontSize: 13 }} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            ) : (
                <Empty description="Không tìm thấy hoạt động nào" className="mt-20" />
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
                                <Select showSearch placeholder="Chọn doanh nghiệp" optionFilterProp="children">
                                    {enterprises.map(e => (
                                        <Option key={e.id} value={e.id}>{e.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type_ids" label="Loại hình hoạt động">
                                <Select mode="multiple" placeholder="Chọn loại hình" showSearch>
                                    {activityTypes.map(act => (
                                        <Option key={act.id} value={act.id}>{act.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="target_ids" label="Đối tượng hướng tới">
                        <Select mode="multiple" placeholder="Chọn đối tượng" showSearch>
                            {targets.map(t => (
                                <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}>
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="end_date" label="Ngày kết thúc">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="collaboration_date" label="Ngày hợp tác">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
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
                templateColumns={['Tên hoạt động', 'enterprise_id', 'Loại hình IDs', 'Đối tượng IDs', 'Mô tả', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ngày hợp tác', 'Trạng thái']}
            />
        </div>
    );
};

export default ActivityList;
