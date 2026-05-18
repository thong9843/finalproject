import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, App as AntApp } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingUser, setEditingUser] = useState(null);
    const { modal } = AntApp.useApp();

    useEffect(() => {
        fetchData();
        fetchDepartments();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách người dùng: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/structure/departments');
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleAdd = () => {
        setEditingUser(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            ...record,
            password: '', // Do not show password when editing
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            message.success('Xóa người dùng thành công');
            fetchData();
        } catch (error) {
            message.error('Lỗi khi xóa người dùng: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, values);
                message.success('Cập nhật người dùng thành công');
            } else {
                await api.post('/users', values);
                message.success('Thêm người dùng thành công');
            }
            setIsModalVisible(false);
            fetchData();
        } catch (error) {
            if (error.response) {
                message.error('Lỗi: ' + error.response.data.message);
            }
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'blue';
                if (role === 'ADMIN') color = 'red';
                if (role === 'FACULTY_MANAGER') color = 'purple';
                return <Tag color={color}>{role}</Tag>;
            }
        },
        {
            title: 'Khoa / Đơn vị',
            dataIndex: 'faculty_id',
            key: 'faculty_id',
            render: (facultyId) => {
                if (!facultyId) return <span className="text-gray-400">Không có</span>;
                const dept = departments.find(d => d.id === facultyId);
                return dept ? dept.name : facultyId;
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined className="text-blue-500" />} 
                        onClick={() => handleEdit(record)}
                        size="small"
                    />
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        size="small"
                        onClick={() => {
                            modal.confirm({ 
                                title: 'Bạn có chắc chắn muốn xóa người dùng này?', 
                                okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' }, 
                                onOk: () => handleDelete(record.id) 
                            });
                        }} 
                    />
                </Space>
            ),
            width: 120,
            align: 'center'
        },
    ];

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Quản lý người dùng</h1>
                    <p className="text-gray-500 dark:text-gray-400">Quản lý tài khoản và phân quyền người dùng trong hệ thống</p>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAdd}
                    className="bg-vluRed h-10 px-6 rounded-lg hover:bg-vluRedHover"
                >
                    Thêm người dùng
                </Button>
            </div>

            <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
                className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-lg"
                rowClassName="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            />

            <Modal
                title={editingUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Lưu"
                cancelText="Hủy"
                okButtonProps={{ className: 'bg-vluRed hover:bg-vluRedHover' }}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input placeholder="Nhập họ tên đầy đủ" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input placeholder="Nhập địa chỉ email" disabled={!!editingUser} />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password placeholder={editingUser ? "Để trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu"} />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                        initialValue="LECTURER"
                    >
                        <Select placeholder="Chọn vai trò">
                            <Option value="ADMIN">Quản trị viên (ADMIN)</Option>
                            <Option value="FACULTY_MANAGER">Quản lý khoa (FACULTY_MANAGER)</Option>
                            <Option value="LECTURER">Giảng viên (LECTURER)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
                    >
                        {({ getFieldValue }) => 
                            getFieldValue('role') !== 'ADMIN' ? (
                                <Form.Item
                                    name="faculty_id"
                                    label="Khoa / Đơn vị quản lý"
                                    rules={[{ required: true, message: 'Vui lòng chọn khoa/đơn vị' }]}
                                >
                                    <Select 
                                        placeholder="Chọn khoa/đơn vị" 
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {departments.map(dept => (
                                            <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserList;
