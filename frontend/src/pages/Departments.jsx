import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, App as AntApp } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../utils/api';
import Cookies from 'js-cookie';

const { Option } = Select;

const Departments = () => {
    const userCookie = Cookies.get('user');
    let user = null;
    try {
        if (userCookie) user = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    const isAdmin = user?.role === 'ADMIN';
    const isLecturer = user?.role === 'LECTURER';

    const [data, setData] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const { modal } = AntApp.useApp();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        document.title = "Quản lý Bộ môn phân loại | VLU Enterprise Link Manager";
        fetchDepartments();
        if (isAdmin) {
            fetchFaculties();
        }
    }, [isAdmin]);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/structure/departments');
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách bộ môn');
        } finally {
            setLoading(false);
        }
    };

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/structure/faculties');
            setFaculties(res.data || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách khoa:', error);
        }
    };

    const handleSave = async (values) => {
        try {
            const payload = { ...values };
            if (!isAdmin) {
                payload.faculty_id = user?.faculty_id;
            }

            if (editingId) {
                await api.put(`/structure/departments/${editingId}`, payload);
                message.success('Cập nhật thành công!');
            } else {
                await api.post('/structure/departments', payload);
                message.success('Thêm mới thành công!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchDepartments();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu!');
        }
    };

    const handleDelete = (id) => {
        modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Bộ môn này sẽ bị xóa khỏi hệ thống.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                try {
                    await api.delete(`/structure/departments/${id}`);
                    message.success('Xóa thành công!');
                    fetchDepartments();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Lỗi khi xóa!');
                }
            }
        });
    };

    const openEditModal = (record) => {
        setEditingId(record.id);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Tên Bộ môn',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Khoa trực thuộc',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            render: (text) => text || <span className="text-gray-400 italic">Không xác định</span>
        },
        ...(!isLecturer ? [{
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEditModal(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            )
        }] : [])
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <ApartmentOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Bộ môn phân loại</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Quản lý các bộ môn trực thuộc khoa để phân loại hoạt động và doanh nghiệp</p>
                    </div>
                </div>
                {!isLecturer && (
                    <div className="flex gap-2 w-full sm:w-auto header-actions">
                        <Button 
                            size="large"
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                            className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium flex-1 sm:flex-initial"
                        >
                            Thêm mới
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={data} 
                    loading={loading} 
                    rowKey="id" 
                    scroll={{ x: 'max-content' }}
                    pagination={false}
                    className="m-0 border-none"
                />
            </div>

            <Modal
                title={editingId ? "Chỉnh sửa Bộ môn" : "Thêm mới Bộ môn"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Form.Item name="name" label="Tên Bộ môn" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Nhập tên bộ môn..." size="large" className="rounded-lg" />
                    </Form.Item>
                    {isAdmin && (
                        <Form.Item name="faculty_id" label="Khoa trực thuộc" rules={[{ required: true, message: 'Vui lòng chọn Khoa!' }]}>
                            <Select placeholder="Chọn Khoa..." size="large" className="rounded-lg">
                                {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                            </Select>
                        </Form.Item>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700 mt-6">
                        <Button onClick={() => setIsModalOpen(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium">
                            {editingId ? "Cập nhật" : "Lưu"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Departments;
