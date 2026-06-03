import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Popconfirm, App as AntApp, Badge, Card, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ClearOutlined, FilterOutlined, UserOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingUser, setEditingUser] = useState(null);
    const { modal } = AntApp.useApp();

    // Search and filter states
    const [searchText, setSearchText] = useState('');
    const [filterRole, setFilterRole] = useState(undefined);
    const [filterFaculty, setFilterFaculty] = useState(undefined);
    const [filterTags, setFilterTags] = useState([]);

    useEffect(() => {
        document.title = "Quản lý Người dùng | VLU Enterprise Link Manager";
        fetchData();
        fetchFaculties();
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

    const fetchFaculties = async () => {
        try {
            const { data } = await api.get('/structure/faculties');
            setFaculties(data);
        } catch (error) {
            console.error('Error fetching faculties:', error);
        }
    };

    const handleAdd = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({
            role: 'LECTURER',
            tags: []
        });
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            ...record,
            password: '', // Do not show password when editing
            tags: record.tags ? record.tags.split(',') : []
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

    // Harvest unique tags
    const allUniqueTags = Array.from(
        new Set(
            users
                .map(u => u.tags)
                .filter(Boolean)
                .flatMap(tagsStr => tagsStr.split(','))
                .map(t => t.trim())
                .filter(Boolean)
        )
    );

    const handleClearFilters = () => {
        setSearchText('');
        setFilterRole(undefined);
        setFilterFaculty(undefined);
        setFilterTags([]);
    };

    // Client-side filtering logic
    const filteredUsers = users.filter(user => {
        const searchLower = searchText.toLowerCase();
        const matchesSearch = !searchText || 
            (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower));

        const matchesRole = !filterRole || user.role === filterRole;
        const matchesFaculty = !filterFaculty || user.faculty_id === filterFaculty;

        let matchesTags = true;
        if (filterTags && filterTags.length > 0) {
            if (!user.tags) {
                matchesTags = false;
            } else {
                const userTagsList = user.tags.split(',').map(t => t.trim());
                matchesTags = filterTags.every(t => userTagsList.includes(t));
            }
        }

        return matchesSearch && matchesRole && matchesFaculty && matchesTags;
    });

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
            fixed: 'left',
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            width: 180,
            fixed: 'left',
            render: (text) => <span className="font-semibold text-gray-800 dark:text-gray-100">{text}</span>
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
                return <Tag color={color} className="font-medium rounded-md">{role}</Tag>;
            }
        },
        {
            title: 'Khoa / Đơn vị',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            render: (facultyName, record) => {
                if (record.role === 'ADMIN') return <span className="text-gray-400">Tất cả khoa</span>;
                if (facultyName) return <Tag color="cyan" className="rounded-md px-2 py-0.5 border-none font-medium">{facultyName}</Tag>;
                if (!record.faculty_id) return <span className="text-gray-400">Không có</span>;
                const fac = faculties.find(f => f.id === record.faculty_id);
                return fac ? <Tag color="cyan" className="rounded-md px-2 py-0.5 border-none font-medium">{fac.name}</Tag> : record.faculty_id;
            }
        },
        {
            title: 'Tags / Nhãn',
            dataIndex: 'tags',
            key: 'tags',
            render: (tagsStr) => {
                if (!tagsStr) return null;
                const tagsList = tagsStr.split(',').filter(Boolean);
                return (
                    <Space size={[0, 4]} wrap>
                        {tagsList.map(tag => (
                            <Tag 
                                key={tag} 
                                color="gold" 
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                            >
                                {tag}
                            </Tag>
                        ))}
                    </Space>
                );
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
            fixed: 'right',
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
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <UserOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Quản lý người dùng</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Phân quyền và quản lý tài khoản người dùng hệ thống</p>
                    </div>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleAdd}
                    size="large"
                    className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium w-full sm:w-auto"
                >
                    Thêm người dùng
                </Button>
            </div>

            {/* Search and Filters Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-6 border border-slate-200 dark:border-gray-700 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm transition-all duration-300">
                <div className="flex flex-1 flex-wrap gap-2.5 items-center w-full">
                    <Input
                        placeholder="Tìm theo họ tên, email..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                        className="w-full sm:w-64 rounded-lg shadow-sm hover:border-blue-400 focus:border-blue-500"
                        size="middle"
                    />
                    <Select
                        placeholder="Lọc theo vai trò"
                        allowClear
                        value={filterRole}
                        onChange={setFilterRole}
                        className="w-full sm:w-44 shadow-sm"
                        size="middle"
                    >
                        <Option value="ADMIN">ADMIN</Option>
                        <Option value="FACULTY_MANAGER">FACULTY_MANAGER</Option>
                        <Option value="LECTURER">LECTURER</Option>
                    </Select>
                    <Select
                        placeholder="Lọc theo khoa/đơn vị"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        value={filterFaculty}
                        onChange={setFilterFaculty}
                        className="w-full sm:w-60 shadow-sm"
                        size="middle"
                    >
                        {faculties.map(fac => (
                            <Option key={fac.id} value={fac.id}>{fac.name}</Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="Lọc theo nhãn (Tags)"
                        allowClear
                        mode="multiple"
                        maxTagCount="responsive"
                        value={filterTags}
                        onChange={setFilterTags}
                        className="w-full sm:w-60 shadow-sm"
                        size="middle"
                    >
                        {allUniqueTags.map(tag => (
                            <Option key={tag} value={tag}>{tag}</Option>
                        ))}
                    </Select>
                    {(searchText || filterRole || filterFaculty || filterTags.length > 0) && (
                        <Button 
                            icon={<ClearOutlined />} 
                            onClick={handleClearFilters}
                            type="text"
                            danger
                            className="flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-955/20"
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </div>
                {/* Active Filter Count Badge */}
                {(searchText || filterRole || filterFaculty || filterTags.length > 0) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full border dark:border-gray-600 shadow-sm flex items-center gap-1.5 font-medium animate-pulse">
                        <FilterOutlined className="text-blue-500" />
                        Tìm thấy {filteredUsers.length} kết quả
                    </div>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <Table 
                    columns={columns} 
                    dataSource={filteredUsers} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    className="shadow-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
                    scroll={{ x: 'max-content' }}
                    rowClassName="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                />
            </div>

            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center p-10"><Spin size="large" /></div>
                ) : filteredUsers.length === 0 ? (
                    <Card className="text-center py-6 text-gray-400">Không có dữ liệu</Card>
                ) : (
                    filteredUsers.map(record => (
                        <Card
                            key={record.id}
                            className="shadow-sm border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                            title={
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-semibold text-slate-800 dark:text-gray-100 truncate max-w-[180px]">
                                        {record.full_name}
                                    </span>
                                    <span className="text-xs text-gray-400">ID: {record.id}</span>
                                </div>
                            }
                        >
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-400 font-medium">Email:</span>{' '}
                                    <span className="text-slate-700 dark:text-gray-300 font-semibold">{record.email}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-medium">Vai trò:</span>{' '}
                                    {(() => {
                                        let color = 'blue';
                                        if (record.role === 'ADMIN') color = 'red';
                                        if (record.role === 'FACULTY_MANAGER') color = 'purple';
                                        return <Tag color={color} className="m-0 text-xs font-medium rounded-md">{record.role}</Tag>;
                                    })()}
                                </div>
                                <div>
                                    <span className="text-gray-400 font-medium">Khoa / Đơn vị:</span>{' '}
                                    {record.role === 'ADMIN' ? (
                                        <span className="text-gray-400 italic">Tất cả khoa</span>
                                    ) : record.faculty_name ? (
                                        <Tag color="cyan" className="m-0 text-xs rounded-md">{record.faculty_name}</Tag>
                                    ) : (
                                        <span className="text-gray-400">Không có</span>
                                    )}
                                </div>
                                {record.tags && (
                                    <div>
                                        <span className="text-gray-400 font-medium">Nhãn dán:</span>{' '}
                                        <div className="inline-flex flex-wrap gap-1 mt-0.5">
                                            {record.tags.split(',').filter(Boolean).map(tag => (
                                                <Tag key={tag} color="gold" className="m-0 text-xs px-2 py-0.5 rounded-full font-medium">
                                                    {tag}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                    <Button 
                                        type="text" 
                                        icon={<EditOutlined className="text-blue-500" />} 
                                        onClick={() => handleEdit(record)} 
                                    />
                                    <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => {
                                            modal.confirm({ 
                                                title: 'Bạn có chắc chắn muốn xóa người dùng này?', 
                                                okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' }, 
                                                onOk: () => handleDelete(record.id) 
                                            });
                                        }} 
                                    />
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                title={editingUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Lưu"
                cancelText="Hủy"
                okButtonProps={{ className: 'bg-vluRed hover:bg-vluRedHover border-none text-white shadow-sm font-medium' }}
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
                                        {faculties.map(fac => (
                                            <Option key={fac.id} value={fac.id}>{fac.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item
                        name="tags"
                        label="Nhãn dán (Tags)"
                    >
                        <Select
                            mode="tags"
                            placeholder="Nhập nhãn phân loại (nhấn Enter để thêm)"
                            tokenSeparators={[',']}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            {allUniqueTags.map(tag => (
                                <Option key={tag} value={tag}>{tag}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserList;
