import React, { useEffect, useState } from 'react';
import { Table, Tag, Form, Input, Select, Button, Modal, message, Space, Drawer, Timeline, Row, Col, DatePicker, Descriptions, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined, UploadOutlined, DownloadOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';
import ImportModal from '../components/ImportModal';
import api from '../utils/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TextArea } = Input;

const EnterpriseList = () => {
    const [data, setData] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [scales, setScales] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [searchText, setSearchText] = useState('');
    const [filterScale, setFilterScale] = useState(undefined);
    const [filterField, setFilterField] = useState(undefined);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedEnterprise, setSelectedEnterprise] = useState(null);
    const [showImport, setShowImport] = useState(false);

    useEffect(() => {
        fetchData();
        fetchDepartments();
        fetchScales();
        fetchFields();
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
        } catch (e) { console.error(e); }
    };

    const fetchScales = async () => {
        try {
            const res = await api.get('/structure/scales');
            setScales(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchFields = async () => {
        try {
            const res = await api.get('/structure/fields');
            setFields(res.data);
        } catch (e) { console.error(e); }
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
        'Tiềm năng': 'magenta', 'Liên hệ': 'cyan', 'Đàm phán': 'orange',
        'Đề xuất': 'geekblue', 'Đã ký hợp tác': 'purple',
        'Đang triển khai': 'green', 'Đã hoàn thành': 'blue', 'Đã tạm ngưng': 'red'
    };

    const handleExport = () => {
        if (!data || data.length === 0) { message.warning('Không có dữ liệu để xuất'); return; }
        const exportData = filteredData.map(item => ({
            'STT': item.id,
            'Tên Doanh nghiệp': item.name,
            'Mã số thuế': item.tax_code || '',
            'Quy mô': item.scale_name || '',
            'Lĩnh vực': item.fields_text || '',
            'Đại diện': `${item.rep_title || ''} ${item.rep_full_name || ''}`.trim(),
            'Chức vụ': item.rep_role || '',
            'SĐT': item.rep_phone || '',
            'Email': item.rep_email || '',
            'Địa chỉ': [item.building_street, item.district, item.province, item.country].filter(Boolean).join(', '),
            'Trạng thái': item.status || '',
            'Số lượng SV': item.student_count || 0,
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DoanhNghiep');
        XLSX.writeFile(wb, `DanhSachDoanhNghiep_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const filteredData = data.filter(item => {
        const q = searchText.toLowerCase();
        const matchSearch = !searchText ||
            item.name?.toLowerCase().includes(q) ||
            item.tax_code?.toLowerCase().includes(q) ||
            item.rep_full_name?.toLowerCase().includes(q) ||
            item.rep_phone?.toLowerCase().includes(q);
        const matchScale = !filterScale || item.scale_id === filterScale;
        const matchField = !filterField || (item.field_ids && item.field_ids.split(',').map(Number).includes(filterField));
        return matchSearch && matchScale && matchField;
    });

    const columns = [
        { title: 'Tên Doanh nghiệp', dataIndex: 'name', key: 'name', width: 220, render: (text) => <span className="font-semibold text-slate-800">{text}</span> },
        {
            title: 'Đại diện liên hệ', key: 'contact', width: 230,
            render: (_, r) => (
                <div className="text-xs">
                    <div className="font-medium text-slate-700">{r.rep_title} {r.rep_full_name} {r.rep_role && `- ${r.rep_role}`}</div>
                    <div className="text-gray-500 mt-0.5">{r.rep_phone || 'Chưa có SĐT'}</div>
                    <div className="text-gray-400">{r.rep_email || 'Chưa có Email'}</div>
                </div>
            )
        },
        {
            title: 'Lĩnh vực', dataIndex: 'fields_text', key: 'fields', width: 180,
            render: (text) => text ? text.split(', ').map((f, i) => <Tag key={i} color="blue" className="mb-1">{f}</Tag>) : <span className="text-slate-300 italic">Chưa có</span>
        },
        {
            title: 'Quy mô', dataIndex: 'scale_name', key: 'scale', width: 120,
            render: (text) => text ? <Tag color="geekblue">{text}</Tag> : '---'
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 140,
            render: (text) => <Tag color={statusColors[text]}>{text}</Tag>
        },
        {
            title: 'Thao tác', key: 'action', width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<UnorderedListOutlined />} onClick={() => handleViewTimeline(record)} />
                    <Button type="text" className="text-blue-500" icon={<EditOutlined />} onClick={() => {
                        setEditingId(record.id);
                        form.setFieldsValue({
                            name: record.name,
                            tax_code: record.tax_code,
                            scale_id: record.scale_id,
                            is_hcmc: record.is_hcmc,
                            status: record.status,
                            department_id: record.department_id,
                            field_ids: record.field_ids ? record.field_ids.split(',').map(Number) : [],
                            rep_title: record.rep_title,
                            rep_full_name: record.rep_full_name,
                            rep_role: record.rep_role,
                            rep_phone: record.rep_phone,
                            rep_email: record.rep_email,
                            building_street: record.building_street,
                            district: record.district,
                            province: record.province,
                            country: record.country,
                        });
                        setIsModalVisible(true);
                    }} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
                        Modal.confirm({ title: 'Bạn có chắc chắn muốn xóa?', onOk: () => handleDelete(record.id) });
                    }} />
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 m-0">Quản lý Doanh nghiệp</h1>
                    <p className="text-sm text-slate-500 m-0">Cập nhật thông tin Doanh nghiệp & Đầu mối liên hệ Đối tác</p>
                </div>
                <div className="flex gap-3">
                    <Button size="large" icon={<UploadOutlined />} onClick={() => setShowImport(true)}>Import</Button>
                    <Button size="large" icon={<DownloadOutlined />} onClick={handleExport}>Xuất Excel</Button>
                    <Button size="large" type="primary" className="bg-blue-600 rounded-lg shadow-sm" icon={<PlusOutlined />} onClick={() => {
                        setEditingId(null); form.resetFields(); setIsModalVisible(true);
                    }}>Thêm Đối Tác</Button>
                </div>
            </div>

            {/* Search + Filter bar */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <input
                    placeholder="Tìm kiếm theo tên, mã thuế, đại diện..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <Select allowClear placeholder="Lọc trạng thái" onChange={setStatusFilter} className="w-44" size="middle">
                    {Object.keys(statusColors).map(s => <Option key={s} value={s}>{s}</Option>)}
                </Select>
                <Select allowClear placeholder="Lọc quy mô" onChange={setFilterScale} className="w-48" size="middle">
                    {scales.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
                <Select allowClear placeholder="Lọc lĩnh vực" onChange={setFilterField} className="w-52" size="middle">
                    {fields.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                </Select>
            </div>

            <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading}
                className="shadow-sm border border-slate-200 bg-white rounded-xl"
                pagination={{ pageSize: 12 }} />

            <Modal
                title={<div className="text-xl font-bold">{editingId ? 'Chỉnh sửa Đối Tác' : 'Thêm mới Doanh Nghiệp'}</div>}
                open={isModalVisible} onCancel={() => setIsModalVisible(false)}
                footer={null} width={860} destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                    {/* Thông tin cơ bản */}
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="name" label="Tên Doanh nghiệp" rules={[{ required: true }]}>
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="tax_code" label="Mã số thuế">
                                <Input className="rounded-lg" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={10}>
                            <Form.Item name="scale_id" label="Quy mô">
                                <Select allowClear placeholder="Chọn quy mô..." className="rounded-lg">
                                    {scales.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={14}>
                            <Form.Item name="field_ids" label="Lĩnh vực / Ngành nghề">
                                <Select mode="multiple" allowClear placeholder="Chọn lĩnh vực..." className="rounded-lg">
                                    {fields.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                                </Select>
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
                            <Form.Item name="status" label="Trạng thái" initialValue="Tiềm năng">
                                <Select className="rounded-lg">
                                    {Object.keys(statusColors).map(s => <Option key={s} value={s}>{s}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="is_hcmc" label="Có tại TP.HCM?" valuePropName="checked" initialValue={true}>
                                <Switch checkedChildren="Có" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Đại diện chính */}
                    <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                        <h4 className="text-slate-700 font-bold mb-3 flex items-center gap-2"><UserOutlined /> Đại diện liên hệ chính</h4>
                        <Row gutter={16}>
                            <Col span={5}>
                                <Form.Item name="rep_title" label="Danh xưng">
                                    <Select placeholder="Ông/Bà">
                                        {['Ông', 'Bà', 'Anh', 'Chị', 'Khác'].map(t => <Option key={t} value={t}>{t}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={11}>
                                <Form.Item name="rep_full_name" label="Họ và tên">
                                    <Input placeholder="Nguyễn Văn A" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="rep_role" label="Chức vụ">
                                    <Input placeholder="HR Director..." className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="rep_phone" label="Số điện thoại">
                                    <Input placeholder="0123456789" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="rep_email" label="Email">
                                    <Input placeholder="contact@domain.com" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Địa chỉ */}
                    <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                        <h4 className="text-blue-700 font-bold mb-3 flex items-center gap-2"><HomeOutlined /> Địa chỉ chính</h4>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="building_street" label="Tòa nhà / Đường">
                                    <Input placeholder="Số 1, đường ABC, tòa nhà XYZ" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="district" label="Quận / Huyện">
                                    <Input placeholder="Quận 1" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="province" label="Tỉnh / Thành phố">
                                    <Input placeholder="TP. Hồ Chí Minh" className="rounded-lg" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="country" label="Quốc gia" initialValue="Việt Nam">
                                    <Input className="rounded-lg" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                        <Button onClick={() => setIsModalVisible(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-blue-600 rounded-lg">Lưu vào Hệ thống</Button>
                    </div>
                </Form>
            </Modal>

            <Drawer
                title={<span className="font-bold flex items-center gap-2"><UnorderedListOutlined /> {selectedEnterprise?.name}</span>}
                placement="right" width={720}
                onClose={() => setIsDrawerVisible(false)}
                open={isDrawerVisible} className="bg-slate-50"
            >
                {selectedEnterprise && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Thông tin Chi tiết</h3>
                            <Descriptions column={2} layout="vertical" size="small" bordered className="bg-white">
                                <Descriptions.Item label="Mã số thuế"><span className="font-medium">{selectedEnterprise.tax_code || '---'}</span></Descriptions.Item>
                                <Descriptions.Item label="Quy mô"><Tag color="geekblue">{selectedEnterprise.scale_name || '---'}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Lĩnh vực" span={2}>
                                    {selectedEnterprise.fields?.length > 0
                                        ? selectedEnterprise.fields.map(f => <Tag key={f.id} color="blue">{f.name}</Tag>)
                                        : '---'}
                                </Descriptions.Item>
                                <Descriptions.Item label="TP.HCM">{selectedEnterprise.is_hcmc ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>}</Descriptions.Item>
                                <Descriptions.Item label="Trạng thái"><Tag color={statusColors[selectedEnterprise.status]}>{selectedEnterprise.status}</Tag></Descriptions.Item>
                            </Descriptions>
                        </div>

                        {selectedEnterprise.representatives?.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Đại diện Liên hệ</h3>
                                {selectedEnterprise.representatives.map(rep => (
                                    <div key={rep.id} className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-50 last:border-0">
                                        {rep.is_primary && <Tag color="gold">Chính</Tag>}
                                        <div>
                                            <p className="font-semibold m-0">{rep.title} {rep.full_name} {rep.role && `- ${rep.role}`}</p>
                                            <p className="text-gray-500 text-sm m-0">{rep.phone} • {rep.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedEnterprise.addresses?.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Địa chỉ</h3>
                                {selectedEnterprise.addresses.map(addr => (
                                    <div key={addr.id} className="mb-2">
                                        {addr.is_main && <Tag color="blue">Chính</Tag>}
                                        <span className="text-slate-700">{[addr.building_street, addr.district, addr.province, addr.country].filter(Boolean).join(', ')}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Timeline Hoạt động</h3>
                            {selectedEnterprise.activities?.length > 0 ? (
                                <Timeline>
                                    {selectedEnterprise.activities.map(act => (
                                        <Timeline.Item key={act.id} color={act.status === 'Đã triển khai' ? 'green' : 'blue'}>
                                            <p className="font-semibold text-slate-700 m-0">{act.title}</p>
                                            <p className="text-slate-500 text-sm m-0 mt-1">
                                                {act.start_date && dayjs(act.start_date).format('DD/MM/YYYY')}
                                                {act.type_names && <> • <Tag color="cyan" className="ml-1">{act.type_names}</Tag></>}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">Trạng thái: <span className="font-medium">{act.status}</span></p>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <p className="text-slate-400 text-center py-4">Chưa có hoạt động nào.</p>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

            <ImportModal
                open={showImport} onClose={() => setShowImport(false)} onSuccess={fetchData}
                type="enterprises"
                templateColumns={['Tên doanh nghiệp', 'Mã số thuế', 'Quy mô ID', 'Lĩnh vực IDs', 'Ở TP.HCM', 'Danh xưng', 'Họ và tên', 'Chức vụ', 'Số điện thoại', 'Email', 'Địa chỉ', 'Quận/Huyện', 'Tỉnh/Thành', 'Quốc gia', 'Bộ môn ID', 'Trạng thái']}
            />
        </div>
    );
};

export default EnterpriseList;
