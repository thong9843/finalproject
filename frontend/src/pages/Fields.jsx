import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, App as AntApp } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CompassOutlined } from '@ant-design/icons';
import api from '../utils/api';
import Cookies from 'js-cookie';

const Fields = () => {
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
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        document.title = "Quản lý Lĩnh vực / Ngành nghề | VLU Enterprise Link Manager";
        fetchFields();
    }, []);

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await api.get('/structure/fields');
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách lĩnh vực');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        try {
            if (editingId) {
                await api.put(`/structure/fields/${editingId}`, values);
                message.success('Cập nhật thành công!');
            } else {
                await api.post('/structure/fields', values);
                message.success('Thêm mới thành công!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu!');
        }
    };

    const handleDelete = (id) => {
        modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Lĩnh vực này sẽ bị xóa khỏi hệ thống.',
            okButtonProps: { danger: true, className: '!bg-red-600 hover:!bg-red-500 text-white' },
            onOk: async () => {
                try {
                    await api.delete(`/structure/fields/${id}`);
                    message.success('Xóa thành công!');
                    fetchFields();
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
            title: 'Tên Lĩnh vực / Ngành nghề',
            dataIndex: 'name',
            key: 'name',
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
                        <CompassOutlined className="text-xl sm:text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Lĩnh vực / Ngành nghề</h1>
                        <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5">Quản lý danh mục các lĩnh vực hoạt động, ngành nghề của doanh nghiệp đối tác</p>
                    </div>
                </div>
                {!isLecturer && (
                    <Button 
                        size="large"
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                        className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium w-full sm:w-auto"
                    >
                        Thêm mới
                    </Button>
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
                title={editingId ? "Chỉnh sửa Lĩnh vực" : "Thêm mới Lĩnh vực"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Form.Item name="name" label="Tên Lĩnh vực / Ngành nghề" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Nhập tên..." size="large" className="rounded-lg" />
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

export default Fields;
