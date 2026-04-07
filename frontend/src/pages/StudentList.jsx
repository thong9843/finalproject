import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Row, Col, Statistic, Form, Input, Select, Button, Modal, message, Space, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SyncOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;

const StudentList = () => {
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [showImport, setShowImport] = useState(false);

    useEffect(() => {
        fetchData();
        fetchStats();
        fetchEnterprises();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/students';
            const params = [];
            if (activeTab !== 'all') params.push(`status=${activeTab}`);
            if (searchText) params.push(`search=${searchText}`);
            if (params.length > 0) url += '?' + params.join('&');

            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu sinh viên');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/students/stats');
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

    const handleSearch = () => {
        fetchData();
    };

    const handleSave = async (values) => {
        try {
            const formattedValues = {
                ...values,
                start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
            };
            if (editingId) {
                await api.put(`/students/${editingId}`, formattedValues);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/students', formattedValues);
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
            await api.delete(`/students/${id}`);
            message.success('Xóa thành công');
            fetchData();
            fetchStats();
        } catch (error) {
            message.error('Lỗi khi xóa dữ liệu');
        }
    };

    const handleExport = () => {
        const exportData = data.map(item => ({
            'Mã Sinh Viên': item.student_code,
            'Họ và Tên': item.name,
            'Lớp': item.class,
            'Khoa': item.faculty,
            'Hoạt động tham gia': item.activity_title,
            'Trạng thái': item.status,
            'Nơi thực tập/Làm việc': item.enterprise_name,
            'Thời gian làm việc (tháng)': item.duration_months
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        const columnWidths = [
            { wch: 15 }, // Mã SV
            { wch: 25 }, // Tên
            { wch: 15 }, // Lớp
            { wch: 25 }, // Khoa
            { wch: 40 }, // Hoạt động
            { wch: 20 }, // Trạng thái
            { wch: 30 }, // Nơi
            { wch: 25 }  // Thời gian
        ];
        ws['!cols'] = columnWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách Sinh viên");
        XLSX.writeFile(wb, `Danh_Sach_Sinh_Vien_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const openEditModal = (record) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
            start_date: record.start_date ? dayjs(record.start_date) : null,
            end_date: record.end_date ? dayjs(record.end_date) : null,
        });
        setIsModalVisible(true);
    };

    const statusConfig = {
        'Đang thực tập': { color: 'processing', icon: <SyncOutlined spin /> },
        'Hoàn thành': { color: 'success', icon: <CheckCircleOutlined /> },
        'Chờ phân công': { color: 'warning', icon: <ClockCircleOutlined /> },
    };

    const tabs = [
        { key: 'all', label: 'Tất cả' },
        { key: 'Đang thực tập', label: 'Đang thực tập' },
        { key: 'Chờ phân công', label: 'Chờ phân công' },
        { key: 'Hoàn thành', label: 'Hoàn thành' },
    ];

    const columns = [
        { 
            title: 'MSSV', 
            dataIndex: 'student_code', 
            key: 'student_code', 
            width: 100,
            render: (text) => <span className="font-semibold text-gray-700">{text}</span>
        },
        { 
            title: 'Họ tên', 
            key: 'name',
            width: 200,
            render: (_, record) => (
                <div>
                    <div className="font-semibold text-gray-800">{record.name}</div>
                    <div className="text-xs text-gray-400">{record.email}</div>
                </div>
            )
        },
        { title: 'Ngành học', dataIndex: 'major', key: 'major', ellipsis: true },
        { title: 'Lớp', dataIndex: 'class', key: 'class', width: 110 },
        { 
            title: 'Doanh nghiệp', 
            dataIndex: 'enterprise_name', 
            key: 'enterprise_name',
            render: (text) => text || <span className="text-gray-300">Chưa phân công</span>
        },
        { 
            title: 'GPA', 
            dataIndex: 'gpa', 
            key: 'gpa', 
            width: 70,
            align: 'center',
            render: (gpa) => gpa ? <span className="font-bold text-blue-600">{gpa}</span> : '---'
        },
        { 
            title: 'Trạng thái', 
            dataIndex: 'status', 
            key: 'status',
            width: 140,
            render: (status) => {
                const config = statusConfig[status] || { color: 'default' };
                return <Tag icon={config.icon} color={config.color} className="rounded-full px-3 py-0.5">{status}</Tag>;
            }
        },
        { 
            title: 'Thời gian', 
            key: 'duration',
            width: 200,
            render: (_, record) => (
                <span className="text-xs text-gray-500">
                    {record.start_date ? dayjs(record.start_date).format('DD/MM/YYYY') : '---'} — {record.end_date ? dayjs(record.end_date).format('DD/MM/YYYY') : '---'}
                </span>
            )
        },
        {
            title: '',
            key: 'action',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => {
                        Modal.confirm({ title: 'Xác nhận xóa sinh viên này?', onOk: () => handleDelete(record.id) });
                    }} />
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý sinh viên</h1>
                    <p className="text-gray-400 text-sm">{data.length} sinh viên · {stats?.active || 0} đang thực tập</p>
                </div>
                <div className="flex gap-3">
                    <Button icon={<DownloadOutlined />} className="h-10 rounded-lg text-green-600 border-green-600 hover:bg-green-50" onClick={handleExport}>
                        Xuất Excel
                    </Button>
                    <Button icon={<UploadOutlined />} onClick={() => setShowImport(true)} className="h-10 rounded-lg">
                        Import
                    </Button>
                    <Button 
                        type="primary" 
                        className="bg-vluRed h-10 px-6 rounded-lg"
                        icon={<PlusOutlined />} 
                        onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}
                    >
                        Thêm sinh viên
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
                        <Statistic 
                            title={<span className="text-gray-500">Đang thực tập</span>}
                            value={stats?.active || 0} 
                            prefix={<SyncOutlined className="text-green-500" />}
                            valueStyle={{ color: '#3f8600', fontWeight: 'bold', fontSize: '2rem' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-white">
                        <Statistic 
                            title={<span className="text-gray-500">Chờ phân công</span>}
                            value={stats?.pending || 0} 
                            prefix={<ClockCircleOutlined className="text-orange-500" />}
                            valueStyle={{ color: '#faad14', fontWeight: 'bold', fontSize: '2rem' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
                        <Statistic 
                            title={<span className="text-gray-500">Đã hoàn thành</span>}
                            value={stats?.completed || 0} 
                            prefix={<CheckCircleOutlined className="text-blue-500" />}
                            valueStyle={{ color: '#1890ff', fontWeight: 'bold', fontSize: '2rem' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filter Tabs + Search */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                                ${activeTab === tab.key 
                                    ? 'bg-white shadow-sm text-vluRed' 
                                    : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <Input 
                    placeholder="Tìm kiếm sinh viên..." 
                    prefix={<SearchOutlined className="text-gray-300" />}
                    className="w-64 rounded-lg"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    onPressEnter={handleSearch}
                    allowClear
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={data} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    className="student-table"
                    size="middle"
                />
            </div>

            {/* Modal Form */}
            <Modal 
                title={editingId ? 'Chỉnh sửa thông tin sinh viên' : 'Thêm sinh viên mới'} 
                open={isModalVisible} 
                onCancel={() => { setIsModalVisible(false); setEditingId(null); }}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="student_code" label="MSSV" rules={[{ required: true }]}>
                                <Input placeholder="VD: 207CT50111" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
                                <Input placeholder="VD: Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="email" label="Email">
                                <Input placeholder="VD: sv@student.edu.vn" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="major" label="Ngành học">
                                <Input placeholder="VD: Kỹ thuật Phần mềm" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="class" label="Lớp">
                                <Input placeholder="VD: K26-IT1" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="gpa" label="GPA">
                                <InputNumber min={0} max={4} step={0.1} className="w-full" placeholder="VD: 3.5" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="advisor" label="Giảng viên hướng dẫn">
                                <Input placeholder="VD: TS. Nguyễn Văn Hùng" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="enterprise_id" label="Công ty thực tập">
                                <Select allowClear showSearch placeholder="Chọn công ty" optionFilterProp="children">
                                    {enterprises.map(e => (
                                        <Option key={e.id} value={e.id}>{e.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="position" label="Vị trí thực tập">
                                <Input placeholder="VD: Frontend Developer" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Trạng thái" initialValue="Chờ phân công">
                                <Select>
                                    <Option value="Đang thực tập">Đang thực tập</Option>
                                    <Option value="Hoàn thành">Hoàn thành</Option>
                                    <Option value="Chờ phân công">Chờ phân công</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="start_date" label="Ngày bắt đầu">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_date" label="Ngày kết thúc">
                                <DatePicker className="w-full" format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                        <Button onClick={() => { setIsModalVisible(false); setEditingId(null); }} size="large">Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-vluRed h-11 px-8 rounded-lg" size="large">
                            {editingId ? 'Cập nhật' : 'Thêm sinh viên'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            <ImportModal
                open={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={() => { fetchData(); fetchStats(); }}
                type="students"
                templateColumns={['MSSV', 'Họ tên', 'Email', 'Lớp', 'Ngành học', 'Giảng viên HD', 'enterprise_id', 'Vị trí', 'Trạng thái', 'GPA', 'Ngày bắt đầu', 'Ngày kết thúc']}
            />
        </div>
    );
};

export default StudentList;
