import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Form, Input, Select, DatePicker, TimePicker, Button, Space, Typography, Spin, Tag, List, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const CalendarView = () => {
    const [activities, setActivities] = useState([]);
    const [enterprises, setEnterprises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => dayjs());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [form] = Form.useForm();
    
    // Quick task list editor
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await api.get('/activities');
            setActivities(res.data);
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải danh sách sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const fetchEnterprises = async () => {
        try {
            const res = await api.get('/enterprises');
            setEnterprises(res.data);
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải danh sách doanh nghiệp');
        }
    };

    useEffect(() => {
        document.title = "Lịch Hoạt động | VLU Enterprise Link Manager";
        fetchActivities();
        fetchEnterprises();
    }, []);

    const getListData = (value) => {
        let listData = [];
        const dateStr = value.format('YYYY-MM-DD');
        activities.forEach(ac => {
            const start = dayjs(ac.start_date).format('YYYY-MM-DD');
            const end = ac.end_date ? dayjs(ac.end_date).format('YYYY-MM-DD') : start;
            if (dateStr >= start && dateStr <= end) {
                let badgeStatus = 'success';
                if (ac.type === 'Hội thảo/Workshop') badgeStatus = 'processing';
                if (ac.type === 'Tuyển dụng') badgeStatus = 'error';
                if (ac.type === 'Đào tạo') badgeStatus = 'warning';
                
                listData.push({
                    type: badgeStatus,
                    content: ac.title,
                    id: ac.id,
                    activity: ac
                });
            }
        });
        return listData;
    };

    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul className="m-0 p-0 list-none">
                {listData.map((item) => (
                    <li key={item.id} onClick={(e) => { e.stopPropagation(); openEditModal(item.activity); }} className="cursor-pointer truncate text-xs mb-1 hover:bg-gray-100:bg-gray-700 p-1 rounded transition-colors text-slate-800 dark:text-gray-100">
                        <Badge status={item.type} text={<span className="">{item.content}</span>} />
                    </li>
                ))}
            </ul>
        );
    };

    const cellRender = (current, info) => {
        if (info.type === 'date') return dateCellRender(current);
        return info.originNode;
    };

    const openAddModal = () => {
        setEditingActivity(null);
        setTasks([]);
        form.resetFields();
        form.setFieldsValue({
            start_date: selectedDate,
            end_date: selectedDate,
            status: 'Tiềm năng'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (activity) => {
        setEditingActivity(activity);
        
        let initialTasks = [];
        try {
            if (activity.tasks) {
                initialTasks = typeof activity.tasks === 'string' ? JSON.parse(activity.tasks) : activity.tasks;
            }
        } catch(e) {}
        setTasks(initialTasks || []);

        form.setFieldsValue({
            title: activity.title,
            type: activity.type,
            enterprise_id: activity.enterprise_id,
            description: activity.description,
            start_date: activity.start_date ? dayjs(activity.start_date) : null,
            end_date: activity.end_date ? dayjs(activity.end_date) : null,
            start_time: activity.start_time ? dayjs(activity.start_time, 'HH:mm:ss') : null,
            end_time: activity.end_time ? dayjs(activity.end_time, 'HH:mm:ss') : null,
            person_in_charge: activity.person_in_charge,
            status: activity.status
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
                start_time: values.start_time ? values.start_time.format('HH:mm:ss') : null,
                end_time: values.end_time ? values.end_time.format('HH:mm:ss') : null,
                tasks: tasks
            };
            
            if (editingActivity) {
                await api.put(`/activities/${editingActivity.id}`, payload);
                message.success('Cập nhật sự kiện thành công');
            } else {
                await api.post(`/activities`, payload);
                message.success('Thêm sự kiện thành công');
            }

            setIsModalOpen(false);
            fetchActivities();
        } catch (error) {
            console.error('Validation Failed / API Error:', error);
            if (error.response?.data?.error) {
                message.error(error.response.data.error);
            }
        }
    };

    const handleDelete = async () => {
        if (!editingActivity) return;
        try {
            await api.delete(`/activities/${editingActivity.id}`);
            message.success('Xóa sự kiện thành công');
            setIsModalOpen(false);
            fetchActivities();
        } catch (error) {
            console.error('Lỗi khi xóa sự kiện:', error);
            message.error('Lỗi khi xóa sự kiện');
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const addTask = () => {
        if (taskInput.trim()) {
            setTasks([...tasks, taskInput.trim()]);
            setTaskInput('');
        }
    };

    const removeTask = (index) => {
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);
    };

    const handleExport = () => {
        if (!activities || activities.length === 0) {
            message.warning('Không có dữ liệu để xuất');
            return;
        }
        
        const exportData = activities.map(item => ({
            'ID': item.id,
            'Tên sự kiện': item.title,
            'Loại hình': item.type || '',
            'Ngày bắt đầu': item.start_date ? dayjs(item.start_date).format('DD/MM/YYYY') : '',
            'Ngày kết thúc': item.end_date ? dayjs(item.end_date).format('DD/MM/YYYY') : '',
            'Giờ bắt đầu': item.start_time || '',
            'Giờ kết thúc': item.end_time || '',
            'Người phụ trách': item.person_in_charge || '',
            'Trạng thái': item.status || '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LichSuKien");
        XLSX.writeFile(wb, `LichSuKien_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 text-vluRed dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <CalendarOutlined className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Lịch hoạt động</h1>
                        <p className="text-sm text-slate-500 m-0 mt-0.5">Xem lịch trình các hoạt động hợp tác doanh nghiệp trực quan</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        size="large"
                        icon={<DownloadOutlined />} 
                        onClick={handleExport}
                        className="border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg shadow-sm font-medium hover:border-emerald-700"
                    >
                        Xuất Excel
                    </Button>
                    <Button 
                        size="large"
                        type="primary" 
                        icon={<PlusOutlined />} 
                        className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium" 
                        onClick={openAddModal}
                    >
                        Thêm sự kiện
                    </Button>
                </div>
            </div>
            <Spin spinning={loading}>
                <div className="border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <Calendar 
                        cellRender={cellRender} 
                        value={selectedDate}
                        onChange={setSelectedDate}
                    />
                </div>
            </Spin>

            <Modal
                title={editingActivity ? `Chi tiết sự kiện: ${editingActivity.title}` : 'Thêm sự kiện mới'}
                open={isModalOpen}
                onCancel={handleCancel}
                width={700}
                destroyOnClose
                footer={[
                    editingActivity && (
                        <Popconfirm
                            key="delete"
                            title="Xóa sự kiện"
                            description="Bạn có chắc chắn muốn xóa sự kiện này không?"
                            onConfirm={handleDelete}
                            okText="Có"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger icon={<DeleteOutlined />} className="text-red-500 border-red-500 float-left">
                                Xóa
                            </Button>
                        </Popconfirm>
                    ),
                    <Button key="cancel" onClick={handleCancel} className="rounded-lg">Hủy</Button>,
                    <Button key="save" type="primary" className="bg-vluRed hover:bg-vluRedHover border-none text-white rounded-lg shadow-sm font-medium" onClick={handleSave}>Lưu</Button>
                ]}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="title" label="Tên sự kiện" rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện' }]}>
                            <Input />
                        </Form.Item>
                        
                        <Form.Item name="enterprise_id" label="Doanh nghiệp" rules={[{ required: true, message: 'Vui lòng chọn doanh nghiệp' }]}>
                            <Select placeholder="Chọn doanh nghiệp" showSearch optionFilterProp="children">
                                {enterprises.map(enterprise => (
                                    <Select.Option key={enterprise.id} value={enterprise.id}>
                                        {enterprise.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="type" label="Loại hoạt động">
                            <Select>
                                <Select.Option value="Hội thảo/Workshop">Hội thảo/Workshop</Select.Option>
                                <Select.Option value="Tuyển dụng">Tuyển dụng</Select.Option>
                                <Select.Option value="Đào tạo">Đào tạo</Select.Option>
                                <Select.Option value="Sự kiện">Sự kiện</Select.Option>
                            </Select>
                        </Form.Item>
                        
                        <Form.Item name="status" label="Trạng thái">
                            <Select>
                                <Select.Option value="Tiềm năng">Tiềm năng</Select.Option>
                                <Select.Option value="Đề xuất">Đề xuất</Select.Option>
                                <Select.Option value="Phê duyệt nội bộ">Phê duyệt nội bộ</Select.Option>
                                <Select.Option value="Đã triển khai">Đã triển khai</Select.Option>
                                <Select.Option value="Đã kết thúc">Đã kết thúc</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}>
                            <DatePicker className="w-full" format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item name="end_date" label="Ngày kết thúc">
                            <DatePicker className="w-full" format="DD/MM/YYYY" />
                        </Form.Item>

                        <Form.Item name="start_time" label="Thời gian bắt đầu">
                            <TimePicker className="w-full" format="HH:mm" />
                        </Form.Item>
                        <Form.Item name="end_time" label="Thời gian kết thúc">
                            <TimePicker className="w-full" format="HH:mm" />
                        </Form.Item>

                        <Form.Item name="person_in_charge" label="Người phụ trách" className="col-span-2">
                            <Input />
                        </Form.Item>
                    </div>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <div>
                        <Text strong className="block mb-2">Danh sách công việc (Tasks)</Text>
                        <div className="flex gap-2 mb-2">
                            <Input 
                                value={taskInput} 
                                onChange={e => setTaskInput(e.target.value)} 
                                placeholder="Nhập tên công việc..."
                                onPressEnter={addTask}
                            />
                                <Button type="primary" icon={<PlusOutlined />} className="bg-blue-500 text-white" onClick={addTask}>Thêm</Button>
                        </div>
                        <List
                            size="small"
                            bordered
                            dataSource={tasks}
                            renderItem={(item, index) => (
                                <List.Item
                                    actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeTask(index)} />]}
                                >
                                    {item}
                                </List.Item>
                            )}
                            className="max-h-40 overflow-y-auto"
                        />
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default CalendarView;