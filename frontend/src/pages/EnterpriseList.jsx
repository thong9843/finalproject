import React, { useEffect, useState } from 'react';
import { Table, Tag, Form, Input, Select, Button, Modal, message, Space, Drawer, Timeline } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;

const EnterpriseList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(undefined);

    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedEnterprise, setSelectedEnterprise] = useState(null);
    const [showImport, setShowImport] = useState(false);

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = statusFilter ? `/enterprises?status=${statusFilter}` : '/enterprises';
            const res = await api.get(url);
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu doanh nghiệp');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        try {
            if (editingId) {
                await api.put(`/enterprises/${editingId}`, values);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/enterprises', values);
                message.success('Thêm mới thành công');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/enterprises/${id}`);
            message.success('Xóa thành công');
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi xóa dữ liệu');
        }
    };

    const handleViewTimeline = async (record) => {
        try {
            const res = await api.get(`/enterprises/${record.id}`);
            setSelectedEnterprise(res.data);
            setIsDrawerVisible(true);
        } catch (error) {
            message.error('Lỗi khi tải thông tin chi tiết');
        }
    };

    const statusColors = {
        'Tiềm năng': 'magenta',
        'Liên hệ': 'cyan',
        'Đàm phán': 'orange',
        'Đề xuất': 'geekblue',
        'Đã ký hợp tác': 'purple',
        'Đang triển khai': 'green',
        'Đã hoàn thành': 'blue',
        'Đã tạm ngưng': 'red'
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }
        
        const exportData = data.map(item => ({
            'ID': item.id,
            'Tên Doanh nghiệp': item.name,
            'Mã số thuế': item.tax_code || '',
            'Ngành nghề': item.industry || '',
            'Địa chỉ': item.address || '',
            'Người liên hệ': item.contact || '',
            'SĐT liên hệ': item.phone || '',
            'Email': item.email || '',
            'Trạng thái': item.status || '',
            'Số lượng SV': item.student_count || 0,
            'Ngày hợp tác': item.collaboration_date ? dayjs(item.collaboration_date).format('DD/MM/YYYY') : '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DoanhNghiep");
        XLSX.writeFile(wb, `DanhSachDoanhNghiep_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const columns = [
        { title: 'Mã DN', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Tên Doanh nghiệp', dataIndex: 'name', key: 'name', fw: 'bold' },
        { title: 'Lĩnh vực', dataIndex: 'industry', key: 'industry' },
        { 
            title: 'Người liên hệ', 
            key: 'contact',
            render: (_, record) => (
                <div className="text-xs">
                    <div>{record.phone || 'N/A'}</div>
                    <div className="text-gray-400">{record.email || 'N/A'}</div>
                </div>
            )
        },
        { 
            title: 'Số lượng SV thực tập/làm', 
            dataIndex: 'student_count', 
            key: 'student_count',
            align: 'center',
            render: (count) => <Tag color={count > 0 ? 'blue' : 'default'}>{count} sinh viên</Tag>
        },
        { 
            title: 'Trạng thái', 
            dataIndex: 'status', 
            key: 'status',
            render: (text) => <Tag color={statusColors[text]}>{text}</Tag>
        },
        { 
            title: 'Ngày hợp tác', 
            dataIndex: 'collaboration_date', 
            key: 'collaboration_date',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '---'
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<UnorderedListOutlined />} onClick={() => handleViewTimeline(record)} />
                    <Button type="text" className="text-blue-500" icon={<EditOutlined />} onClick={() => {
                        setEditingId(record.id);
                        form.setFieldsValue(record);
                        setIsModalVisible(true);
                    }} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
                        Modal.confirm({
                            title: 'Bạn có chắc chắn muốn xóa?',
                            onOk: () => handleDelete(record.id)
                        });
                    }} />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Doanh nghiệp</h1>
                <div className="flex gap-4">
                    <Select
                        placeholder="Lọc theo trạng thái"
                        allowClear
                        onChange={setStatusFilter}
                        className="w-48"
                    >
                        <Option value="Tiềm năng">Tiềm năng</Option>
                        <Option value="Liên hệ">Liên hệ</Option>
                        <Option value="Đàm phán">Đàm phán</Option>
                        <Option value="Đề xuất">Đề xuất</Option>
                        <Option value="Đã ký hợp tác">Đã ký hợp tác</Option>
                        <Option value="Đang triển khai">Đang triển khai</Option>
                        <Option value="Đã hoàn thành">Đã hoàn thành</Option>
                        <Option value="Đã tạm ngưng">Đã tạm ngưng</Option>
                    </Select>
                    <Button icon={<UploadOutlined />} onClick={() => setShowImport(true)}>
                        Import
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport}>
                        Xuất Excel
                    </Button>
                    <Button type="primary" className="bg-vluRed" icon={<PlusOutlined />} onClick={() => {
                        setEditingId(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}>
                        Thêm mới
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                className="shadow-sm bg-white rounded-lg p-2"
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingId ? 'Chỉnh sửa doanh nghiệp' : 'Thêm mới doanh nghiệp'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="name" label="Tên Doanh nghiệp" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="tax_code" label="Mã số thuế" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="industry" label="Ngành nghề">
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Địa chỉ">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="phone" label="Số điện thoại">
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email">
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái" initialValue="Tiềm năng">
                        <Select>
                            <Option value="Tiềm năng">Tiềm năng</Option>
                            <Option value="Liên hệ">Liên hệ</Option>
                            <Option value="Đàm phán">Đàm phán</Option>
                            <Option value="Đề xuất">Đề xuất</Option>
                            <Option value="Đã ký hợp tác">Đã ký hợp tác</Option>
                            <Option value="Đang triển khai">Đang triển khai</Option>
                            <Option value="Đã hoàn thành">Đã hoàn thành</Option>
                            <Option value="Đã tạm ngưng">Đã tạm ngưng</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                        <Button onClick={() => setIsModalVisible(false)} className="mr-2">Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-vluRed">Lưu</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title={selectedEnterprise?.name || 'Chi tiết'}
                placement="right"
                width={500}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible}
            >
                {selectedEnterprise && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Timeline Hoạt động</h3>
                        {selectedEnterprise.activities?.length > 0 ? (
                            <Timeline>
                                {selectedEnterprise.activities.map(act => (
                                    <Timeline.Item
                                        key={act.id}
                                        color={act.status === 'Đã triển khai' ? 'green' : 'blue'}
                                    >
                                        <p className="font-medium">{act.title}</p>
                                        <p className="text-gray-500 text-sm">{dayjs(act.start_date).format('DD/MM/YYYY')} - {act.type}</p>
                                        <p className="text-gray-400 text-xs mt-1">Trạng thái: {act.status}</p>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        ) : (
                            <p className="text-gray-500">Chưa có hoạt động nào.</p>
                        )}
                    </div>
                )}
            </Drawer>

            <ImportModal
                open={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={fetchData}
                type="enterprises"
                templateColumns={['Tên doanh nghiệp', 'Mã số thuế', 'Lĩnh vực', 'Địa chỉ', 'Email', 'Số điện thoại', 'Trạng thái']}
            />
        </div>
    );
};

export default EnterpriseList;
