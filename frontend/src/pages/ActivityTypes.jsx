import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space , App as AntApp } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import Cookies from 'js-cookie';

const { Option } = Select;

const ActivityTypes = () => {
    const userCookie = Cookies.get('user');
    let user = null;
    try {
        if (userCookie) user = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }
    const isLecturer = user?.role === 'LECTURER';

    const [data, setData] = useState([]);
    const { modal } = AntApp.useApp();
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        document.title = "Quản lý Loại hình Hoạt động | VLU Enterprise Link Manager";
        fetchActivityTypes();
        fetchFaculties();
    }, []);

    const fetchActivityTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/structure/activity-types');
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách loại hoạt động');
        } finally {
            setLoading(false);
        }
    };

    const fetchFaculties = async () => {
        try {
            const res = await api.get('/structure/departments');
            setFaculties(res.data || []);
        } catch (e) {
            console.log(e);
        }
    };

    const handleSave = async (values) => {
        try {
            if (editingId) {
                await api.put(`/structure/activity-types/${editingId}`, values);
                message.success('Cập nhật thành công!');
            } else {
                await api.post('/structure/activity-types', values);
                message.success('Thêm mới thành công!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchActivityTypes();
        } catch (error) {
            message.error('Lỗi khi lưu dữ liệu!');
        }
    };

    const handleDelete = (id) => {
        modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Loại hoạt động này sẽ bị xóa khỏi hệ thống.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                try {
                    await api.delete(`/structure/activity-types/${id}`);
                    message.success('Xóa thành công!');
                    fetchActivityTypes();
                } catch (error) {
                    message.error('Lỗi khi xóa!');
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
            title: 'Tên loại hoạt động',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Khoa áp dụng (Trống = Chung)',
            dataIndex: 'faculty_name',
            key: 'faculty_name',
            render: (text) => text || <span className="text-gray-400 italic">Dùng chung toàn trường</span>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold m-0 text-slate-800 dark:text-gray-100">Quản lý Loại Hình Hoạt Động</h2>
                        <p className="text-sm text-slate-500 m-0">Định nghĩa danh mục Loại hình hợp tác đặc thù theo từng Khoa</p>
                    </div>
                    {!isLecturer && (
                        <Button 
                            size="large"
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                            className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium"
                        >
                            Thêm mới
                        </Button>
                    )}
                </div>
                <div className="p-0">
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
            </div>

            <Modal
                title={editingId ? "Chỉnh sửa Loại Hoạt động" : "Thêm mới Loại Hoạt động"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Form.Item name="name" label="Tên Loại Hoạt động" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Nhập tên..." size="large" className="rounded-lg" />
                    </Form.Item>
                    <Form.Item name="faculty_id" label="Khoa áp dụng đặc thù (Bỏ trống nếu là loại chung)">
                        <Select allowClear placeholder="Chọn Khoa..." size="large" className="rounded-lg">
                            {/* faculties data would be populated here if we fetch it properly. Currently static fallback for UI. */}
                            {faculties.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                        </Select>
                    </Form.Item>
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

export default ActivityTypes;
