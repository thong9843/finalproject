import React, { useEffect, useState } from 'react';
import { Table, Tag, Form, Input, Select, Button, Modal, message, Space, Drawer, Timeline, Row, Col, DatePicker, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined, UploadOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TextArea } = Input;

const EnterpriseList = () => {
    const [data, setData] = useState([]);
    const [departments, setDepartments] = useState([]);
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
        fetchDepartments();
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

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/structure/departments');
            setDepartments(res.data);
        } catch (error) {
            console.error('Lỗi tải phòng ban', error);
        }
    };

    const handleSave = async (values) => {
        try {
            const payload = {
                ...values,
                collaboration_date: values.collaboration_date ? values.collaboration_date.format('YYYY-MM-DD') : null
            };

            if (editingId) {
                await api.put(`/enterprises/${editingId}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/enterprises', payload);
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
            'STT': item.id,
            'Danh xưng': item.contact_title || '',
            'Họ và tên': item.contact_name || '',
            'Chức vụ': item.contact_position || '',
            'Tên Doanh nghiệp': item.name,
            'Mã số thuế': item.tax_code || '',
            'Ngành nghề': item.industry || '',
            'Địa chỉ': item.address || '',
            'SĐT liên hệ': item.phone || '',
            'Email': item.email || '',
            'Các hoạt động đã hợp tác': item.past_collaboration || '',
            'Bộ môn Phân loại ID': item.department_id || '',
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
        { title: 'Tên Doanh nghiệp', dataIndex: 'name', key: 'name', width: 220, render: (text) => <span className="font-semibold text-slate-800">{text}</span> },
        { 
            title: 'Người liên hệ', 
            key: 'contact',
            width: 250,
            render: (_, record) => (
                <div className="text-xs">
                    <div className="font-medium text-slate-700">
                        {record.contact_title} {record.contact_name} {record.contact_position && ` - ${record.contact_position}`}
                    </div>
                    <div className="text-gray-500 mt-1">{record.phone || 'Chưa ĐK Số điện thoại'}</div>
                    <div className="text-gray-400">{record.email || 'Chưa ĐK Email'}</div>
                </div>
            )
        },
        { title: 'Lĩnh vực', dataIndex: 'industry', key: 'industry', width: 140 },
        { 
            title: 'Trạng thái', 
            dataIndex: 'status', 
            key: 'status',
            width: 140,
            render: (text) => <Tag color={statusColors[text]}>{text}</Tag>
        },
        { 
            title: 'HĐ Lịch sử', 
            dataIndex: 'past_collaboration', 
            key: 'past_collaboration',
            ellipsis: true,
            render: (text) => text || <span className="text-slate-300 italic">Chưa có</span>
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
                        form.setFieldsValue({
                            ...record,
                            collaboration_date: record.collaboration_date ? dayjs(record.collaboration_date) : null
                        });
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
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 m-0">Quản lý Doanh nghiệp</h1>
                    <p className="text-sm text-slate-500 m-0">Cập nhật thông tin Doanh nghiệp & Đầu mối liên hệ Đối tác</p>
                </div>
                <div className="flex gap-4">
                    <Select
                        placeholder="Lọc trạng thái"
                        allowClear
                        onChange={setStatusFilter}
                        className="w-48"
                        size="large"
                    >
                        {Object.keys(statusColors).map(status => (
                            <Option key={status} value={status}>{status}</Option>
                        ))}
                    </Select>
                    <Button size="large" icon={<UploadOutlined />} onClick={() => setShowImport(true)}>
                        Import
                    </Button>
                    <Button size="large" icon={<DownloadOutlined />} onClick={handleExport}>
                        Xuất Excel (TH)
                    </Button>
                    <Button size="large" type="primary" className="bg-blue-600 rounded-lg shadow-sm" icon={<PlusOutlined />} onClick={() => {
                        setEditingId(null);
                        form.resetFields();
                        setIsModalVisible(true);
                    }}>
                        Thêm Đối Tác
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                className="shadow-sm border border-slate-200 bg-white rounded-xl"
                pagination={{ pageSize: 12 }}
            />

            <Modal
                title={<div className="text-xl font-bold">{editingId ? 'Chỉnh sửa Đối Tác / Doanh Nghiệp' : 'Thêm mới Đầu Mối Doanh Nghiệp'}</div>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                        <h4 className="text-slate-700 font-bold mb-3 flex items-center gap-2"><UserOutlined/> Thông tin liên hệ</h4>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Form.Item name="contact_title" label="Danh xưng">
                                    <Select placeholder="Ông/Bà" className="rounded-lg">
                                        <Option value="Ông">Ông</Option>
                                        <Option value="Bà">Bà</Option>
                                        <Option value="Anh">Anh</Option>
                                        <Option value="Chị">Chị</Option>
                                        <Option value="Khác">Khác</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <Form.Item name="contact_name" label="Họ và tên">
                                    <Input placeholder="VD: Nguyễn Văn A" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="contact_position" label="Chức vụ">
                                    <Input placeholder="Director Resource..." className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
                                    <Input placeholder="0123456789" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                    <Input placeholder="contact@domain.com" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item name="name" label="Tên Doanh nghiệp" rules={[{ required: true }]}>
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="tax_code" label="Mã số thuế" rules={[{ required: true }]}>
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item name="address" label="Địa chỉ">
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="industry" label="Ngành nghề">
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="department_id" label="Bộ môn phân loại">
                                <Select allowClear placeholder="Chọn bộ môn..." className="rounded-lg">
                                    {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="collaboration_date" label="Ngày bắt đầu Hợp tác">
                                <DatePicker format="DD/MM/YYYY" className="w-full rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="status" label="Trạng thái" initialValue="Tiềm năng">
                                <Select className="rounded-lg">
                                    {Object.keys(statusColors).map(status => (
                                        <Option key={status} value={status}>{status}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Form.Item name="past_collaboration" label="Các hoạt động đã hợp tác (từ 2018 trở về trước)">
                        <TextArea rows={2} placeholder="Từng tuyển dụng thực tập, tham quan, hội thảo..." className="rounded-lg" />
                    </Form.Item>

                    <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                        <Button onClick={() => setIsModalVisible(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-blue-600 rounded-lg">Lưu vào Hệ thống</Button>
                    </div>
                </Form>
            </Modal>

            <Drawer
                title={<span className="font-bold flex items-center gap-2"><UnorderedListOutlined /> {selectedEnterprise?.name}</span>}
                placement="right"
                width={700}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible}
                className="bg-slate-50"
            >
                {selectedEnterprise && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Chi tiết</h3>
                            <Descriptions column={2} layout="vertical" size="small" bordered className="bg-white">
                                <Descriptions.Item label="Mã số thuế"><span className="font-medium">{selectedEnterprise.tax_code || '---'}</span></Descriptions.Item>
                                <Descriptions.Item label="Ngành nghề">{selectedEnterprise.industry || '---'}</Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ" span={2}>{selectedEnterprise.address || '---'}</Descriptions.Item>
                                <Descriptions.Item label="Người liên hệ chính" span={2}>
                                    <span className="font-semibold text-blue-700">
                                        {selectedEnterprise.contact_title} {selectedEnterprise.contact_name} {selectedEnterprise.contact_position && `- ${selectedEnterprise.contact_position}`}
                                    </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại">{selectedEnterprise.phone || '---'}</Descriptions.Item>
                                <Descriptions.Item label="Email">{selectedEnterprise.email || '---'}</Descriptions.Item>
                                <Descriptions.Item label="Ngày bắt đầu hợp tác">
                                    {selectedEnterprise.collaboration_date ? <Tag color="blue">{dayjs(selectedEnterprise.collaboration_date).format('DD/MM/YYYY')}</Tag> : '---'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color={statusColors[selectedEnterprise.status]}>{selectedEnterprise.status}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm">
                            <h4 className="font-bold text-blue-800 m-0">Lịch sử Hợp tác cũ</h4>
                            <p className="text-sm mt-1 text-blue-600 m-0">
                                {selectedEnterprise.past_collaboration || "Chưa ghi nhận hoạt động cũ trước đây."}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Timeline Hoạt động Hiện Tại</h3>
                            {selectedEnterprise.activities?.length > 0 ? (
                                <Timeline>
                                    {selectedEnterprise.activities.map(act => (
                                        <Timeline.Item
                                            key={act.id}
                                            color={act.status === 'Đã triển khai' ? 'green' : 'blue'}
                                        >
                                            <p className="font-semibold text-slate-700 m-0 text-base">{act.title}</p>
                                            <p className="text-slate-500 text-sm m-0 mt-1">{dayjs(act.start_date).format('DD/MM/YYYY')} • <Tag color="cyan" size="small">{act.type}</Tag></p>
                                            <p className="text-slate-400 text-xs mt-1">Trạng thái: <span className="font-medium">{act.status}</span></p>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-400 m-0">Doanh nghiệp chưa có hoạt động hợp tác nào mới.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

            <ImportModal
                open={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={fetchData}
                type="enterprises"
                templateColumns={['Danh xưng', 'Họ tên', 'Chức vụ', 'Tên doanh nghiệp', 'Mã số thuế', 'Ngành nghề', 'SĐT', 'Email', 'Địa chỉ', 'Các hoạt động hợp tác (cũ)', 'Bộ môn ID', 'Trạng thái']}
            />
        </div>
    );
};

export default EnterpriseList;
