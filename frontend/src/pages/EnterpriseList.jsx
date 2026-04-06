import React, { useEffect, useState } from 'react';
import { Table, Tag, Form, Input, Select, Button, Modal, message, Space, Drawer, Timeline } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

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
        'Tiềm năng': 'blue',
        'Đang đàm phán': 'orange',
        'Đang hợp tác': 'green',
        'Đã ngừng': 'red'
    };

    const columns = [
        { title: 'Tên Doanh nghiệp', dataIndex: 'name', key: 'name' },
        { title: 'Mã số thuế', dataIndex: 'tax_code', key: 'tax_code' },
        { title: 'Ngành nghề', dataIndex: 'industry', key: 'industry' },
        { title: 'Khoa', dataIndex: 'faculty_name', key: 'faculty_name' },
        { 
            title: 'Trạng thái', 
            dataIndex: 'status', 
            key: 'status',
            render: (text, record) => (
                <div className="flex flex-col gap-1">
                    <Tag color={statusColors[text]}>{text}</Tag>
                    {text === 'Đang hợp tác' && record.collaboration_date && (
                        <span className="text-xs text-gray-500">
                            Từ: {dayjs(record.collaboration_date).format('DD/MM/YYYY')}
                        </span>
                    )}
                </div>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<UnorderedListOutlined />} onClick={() => handleViewTimeline(record)} />
                    <Button type="primary" ghost icon={<EditOutlined />} onClick={() => {
                        setEditingId(record.id);
                        form.setFieldsValue(record);
                        setIsModalVisible(true);
                    }} />
                    <Button danger icon={<DeleteOutlined />} onClick={() => {
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
                        <Option value="Đang đàm phán">Đang đàm phán</Option>
                        <Option value="Đang hợp tác">Đang hợp tác</Option>
                        <Option value="Đã ngừng">Đã ngừng</Option>
                    </Select>
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
                            <Option value="Đang đàm phán">Đang đàm phán</Option>
                            <Option value="Đang hợp tác">Đang hợp tác</Option>
                            <Option value="Đã ngừng">Đã ngừng</Option>
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
        </div>
    );
};

export default EnterpriseList;
