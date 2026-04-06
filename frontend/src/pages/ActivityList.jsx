import React, { useEffect, useState } from 'react';
import { Table, Tag, Form, Select, Button, Modal, message, Space, Input, DatePicker } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const ActivityList = () => {
    const [data, setData] = useState([]);
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
        fetchEnterprises();
    }, []);

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
                start_date: values.start_date.format('YYYY-MM-DD'),
            };
            await api.post('/activities', formattedValues);
            message.success('Thêm mới thành công');
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/activities/${id}/status`, { status });
            message.success('Cập nhật trạng thái thành công');
            fetchData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        }
    };

    const typeColors = {
        'Tuyển dụng việc làm': 'blue',
        'Tuyển dụng thực tập': 'cyan',
        'Tặng hoa 20/11': 'magenta',
        'Tham quan công ty': 'purple',
        'Workshop': 'orange',
        'Khác': 'default'
    };

    const columns = [
        { title: 'Tên Hoạt động', dataIndex: 'title', key: 'title' },
        { title: 'Loại', dataIndex: 'type', key: 'type', render: text => <Tag color={typeColors[text]}>{text}</Tag> },
        { title: 'Doanh nghiệp', dataIndex: 'enterprise_name', key: 'enterprise_name' },
        { title: 'Ngày bắt đầu', dataIndex: 'start_date', key: 'start_date', render: text => dayjs(text).format('DD/MM/YYYY') },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: text => <Tag color={text === 'Đã triển khai' ? 'green' : 'gold'}>{text}</Tag> },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {record.status === 'Tiềm năng' && (
                        <Button 
                            type="primary" 
                            ghost
                            icon={<CheckCircleOutlined />} 
                            onClick={() => handleUpdateStatus(record.id, 'Đã triển khai')}
                            className="border-green-500 text-green-500 hover:bg-green-50"
                        >
                            Chuyển đã triển khai
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Hoạt động</h1>
                <Button type="primary" className="bg-vluRed" icon={<PlusOutlined />} onClick={() => {
                    form.resetFields();
                    setIsModalVisible(true);
                }}>
                    Thêm mới
                </Button>
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
                title="Thêm mới hoạt động" 
                open={isModalVisible} 
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="title" label="Tên Hoạt động" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="enterprise_id" label="Doanh nghiệp liên kết" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                            {enterprises.map(e => (
                                <Option key={e.id} value={e.id}>{e.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="type" label="Loại hình" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Tuyển dụng việc làm">Tuyển dụng việc làm</Option>
                            <Option value="Tuyển dụng thực tập">Tuyển dụng thực tập</Option>
                            <Option value="Tặng hoa 20/11">Tặng hoa 20/11</Option>
                            <Option value="Tham quan công ty">Tham quan công ty</Option>
                            <Option value="Workshop">Workshop</Option>
                            <Option value="Khác">Khác</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}>
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái" initialValue="Tiềm năng">
                        <Select>
                            <Option value="Tiềm năng">Tiềm năng</Option>
                            <Option value="Đã triển khai">Đã triển khai</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item className="mb-0 text-right">
                        <Button onClick={() => setIsModalVisible(false)} className="mr-2">Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-vluRed">Lưu</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ActivityList;
