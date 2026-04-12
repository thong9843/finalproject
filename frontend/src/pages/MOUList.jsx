import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const MOUList = () => {
    const [data, setData] = useState([]);
    const [enterprises, setEnterprises] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchMOUs();
        fetchOptions();
    }, []);

    const fetchMOUs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/mous');
            setData(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách Biên bản ghi nhớ (MOU)');
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [entRes, deptRes] = await Promise.all([
                api.get('/enterprises'),
                api.get('/structure/departments')
            ]);
            setEnterprises(entRes.data);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error('Lỗi tải option', error);
        }
    };

    const handleSave = async (values) => {
        try {
            const payload = {
                ...values,
                signing_date: values.signing_date ? values.signing_date.format('YYYY-MM-DD') : null,
            };

            if (editingId) {
                await api.put(`/mous/${editingId}`, payload);
                message.success('Cập nhật thành công!');
            } else {
                await api.post('/mous', payload);
                message.success('Thêm mới thành công!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchMOUs();
        } catch (error) {
            message.error('Lỗi khi lưu dữ liệu!');
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Gỡ bỏ Biên bản ghi nhớ này khỏi hệ thống.',
            onOk: async () => {
                try {
                    await api.delete(`/mous/${id}`);
                    message.success('Xóa thành công!');
                    fetchMOUs();
                } catch (error) {
                    message.error('Lỗi khi xóa!');
                }
            }
        });
    };

    const openEditModal = (record) => {
        setEditingId(record.id);
        form.setFieldsValue({
            ...record,
            signing_date: record.signing_date ? dayjs(record.signing_date) : null,
        });
        setIsModalOpen(true);
    };

    const filteredData = data.filter(item => 
        (item.mou_code?.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.enterprise_name?.toLowerCase().includes(searchText.toLowerCase()))
    );

    const columns = [
        {
            title: 'Mã Biên bản',
            dataIndex: 'mou_code',
            key: 'mou_code',
            width: 120,
            render: (text) => <span className="font-semibold text-blue-600">{text}</span>
        },
        {
            title: 'Tên đối tác',
            dataIndex: 'enterprise_name',
            key: 'enterprise_name',
            width: 250,
            ellipsis: true,
            render: (text) => <span className="font-semibold text-slate-800">{text}</span>
        },
        {
            title: 'Ngày ký',
            dataIndex: 'signing_date',
            key: 'signing_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '---'
        },
        {
            title: 'Đơn vị triển khai',
            dataIndex: 'executing_unit_name',
            key: 'executing_unit_name',
            width: 180,
        },
        {
            title: 'Loại tổ chức',
            dataIndex: 'org_type',
            key: 'org_type',
            width: 150,
        },
        {
            title: 'Quốc gia',
            dataIndex: 'country',
            key: 'country',
            width: 100,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    {record.working_dir && (
                        <Tooltip title="Mở thư mục làm việc">
                            <Button type="text" icon={<LinkOutlined />} onClick={() => window.open(record.working_dir, '_blank')} />
                        </Tooltip>
                    )}
                    <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEditModal(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            )
        }
    ];

    return (
        <div className="p-6 h-full bg-slate-50 min-h-screen">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-t-xl gap-4">
                    <div>
                        <h2 className="text-xl font-bold m-0 text-slate-800">Quản lý Biên Bản Ghi Nhớ (MOU)</h2>
                        <p className="text-sm text-slate-500 m-0">Danh sách thống kê các MOU đã ký với Đối tác/Doanh nghiệp</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Input 
                            placeholder="Tìm mã MOU, đối tác..." 
                            prefix={<SearchOutlined className="text-slate-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full sm:w-64 rounded-lg"
                        />
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                            className="bg-blue-600 shadow-sm rounded-lg"
                        >
                            Thêm Biên bản
                        </Button>
                    </div>
                </div>
                
                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading} 
                    rowKey="id" 
                    pagination={{ pageSize: 12 }}
                    className="border-none"
                    scroll={{ x: 'max-content' }}
                />
            </div>

            <Modal
                title={editingId ? "Cập nhật Biên bản ghi nhớ (MOU)" : "Thêm mới Biên bản ghi nhớ (MOU)"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={850}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="mou_code" label="Mã biên bản" rules={[{ required: true, message: 'Vui lòng nhập!' }]}>
                                <Input placeholder="VD: MOU-2024-001" className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="enterprise_id" label="Tên đối tác (Doanh nghiệp)" rules={[{ required: true, message: 'Vui lòng chọn đối tác!' }]}>
                                <Select showSearch placeholder="Chọn đối tác..." optionFilterProp="children" className="rounded-lg">
                                    {enterprises.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="signing_date" label="Ngày ký kết">
                                <DatePicker format="DD/MM/YYYY" className="w-full rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="org_type" label="Loại tổ chức">
                                <Input placeholder="VD: Tập đoàn, Trường ĐH..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="country" label="Quốc gia đối tác">
                                <Input placeholder="VD: Việt Nam, Nhật Bản..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="partner_contact" label="Đầu mối liên hệ của đối tác">
                                <Input placeholder="Ông Nguyễn Văn A - Trưởng phòng..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="vlu_contact" label="Đầu mối liên hệ VLU">
                                <Input placeholder="ThS. Trần B..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="executing_unit_id" label="Đơn vị triển khai">
                                <Select showSearch allowClear placeholder="Chọn bộ môn/đơn vị triển khai..." optionFilterProp="children" className="rounded-lg">
                                    {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="working_dir" label="Thư mục làm việc (Link)">
                                <Input placeholder="https://drive.google.com/..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Form.Item name="collaboration_scope" label="Mảng hợp tác">
                        <TextArea rows={2} placeholder="Nội dung mảng hợp tác..." className="rounded-lg" />
                    </Form.Item>
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="tasks_ay24_25" label="Công tác đã triển khai NH 24-25">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="next_steps" label="Bước kế tiếp (Dự kiến)">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="past_activities" label="Hoạt động cũ">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="related_data" label="Số liệu liên quan (sv, ngành...)">
                                <TextArea rows={2} placeholder="..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                        <Button onClick={() => setIsModalOpen(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-blue-600 rounded-lg">
                            {editingId ? "Cập nhật" : "Lưu Biên bản"}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default MOUList;
