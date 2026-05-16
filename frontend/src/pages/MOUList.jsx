import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Tooltip, Row, Col, Upload, Spin, Tag, Alert } from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, SearchOutlined,
    FilePdfOutlined, ScanOutlined, InboxOutlined, CheckCircleOutlined, RobotOutlined, DownloadOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const MOUList = () => {
    const [data, setData] = useState([]);
    const [enterprises, setEnterprises] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    // AI Scan states
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);

    // PDF Export state
    const [exportingId, setExportingId] = useState(null);

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
            const [entRes, deptRes, actRes] = await Promise.all([
                api.get('/enterprises'),
                api.get('/structure/departments'),
                api.get('/activities')
            ]);
            setEnterprises(entRes.data);
            setDepartments(deptRes.data);
            setActivities(actRes.data);
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
                    setSelectedRowKeys(prev => prev.filter(key => key !== id));
                } catch (error) {
                    message.error('Lỗi khi xóa!');
                }
            }
        });
    };

    const handleBulkDelete = () => {
        Modal.confirm({
            title: `Xác nhận xóa ${selectedRowKeys.length} biên bản MOU?`,
            content: 'Hành động này không thể hoàn tác.',
            onOk: async () => {
                setLoading(true);
                try {
                    await Promise.all(selectedRowKeys.map(id => api.delete(`/mous/${id}`)));
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} biên bản MOU`);
                    setSelectedRowKeys([]);
                    fetchMOUs();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa hàng loạt');
                } finally {
                    setLoading(false);
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

    const removeAccents = (str) => {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const filterOptionIgnoreCase = (input, option) => 
        removeAccents(option?.children || '').includes(removeAccents(input));

    // ==================== PDF EXPORT ====================
    const handleExportPdf = async (record) => {
        setExportingId(record.id);
        try {
            const response = await api.get(`/mous/${record.id}/export-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MOU_${record.mou_code.replace(/\//g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success(`Đã xuất PDF: ${record.mou_code}`);
        } catch (error) {
            message.error('Lỗi khi xuất PDF. Vui lòng thử lại!');
        } finally {
            setExportingId(null);
        }
    };

    // ==================== AI SCAN ====================
    const handleScanDocument = async () => {
        if (!uploadedFile) {
            message.warning('Vui lòng chọn file để scan!');
            return;
        }
        setScanning(true);
        setScanResult(null);
        setScanError(null);
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);
            const response = await api.post('/mous/scan-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            });
            setScanResult(response.data.extracted);
            message.success('AI đã phân tích xong tài liệu!');
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi kết nối AI. Vui lòng thử lại!';
            setScanError(msg);
            message.error(msg);
        } finally {
            setScanning(false);
        }
    };

    const handleApplyScanResult = async () => {
        if (!scanResult) return;

        let finalEnterpriseId = scanResult.enterprise_id;
        let finalActivityId = scanResult.activity_id;

        // 1. Tự động hỏi tạo Doanh nghiệp nếu chưa có
        if (scanResult.enterprise_name && !finalEnterpriseId) {
            const confirmed = await new Promise((resolve) => {
                Modal.confirm({
                    title: 'Doanh nghiệp chưa tồn tại',
                    content: `Doanh nghiệp "${scanResult.enterprise_name}" chưa có trên hệ thống. Bạn có muốn tạo mới không?`,
                    okText: 'Tạo mới',
                    cancelText: 'Bỏ qua',
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });

            if (confirmed) {
                try {
                    const res = await api.post('/enterprises', {
                        name: scanResult.enterprise_name,
                        tax_code: scanResult.tax_code || null,
                        status: 'Tiềm năng'
                    });
                    finalEnterpriseId = res.data.id;
                    await fetchOptions(); // Cập nhật lại danh sách doanh nghiệp
                    message.success('Tạo doanh nghiệp thành công!');
                } catch (error) {
                    message.error('Lỗi khi tạo doanh nghiệp!');
                }
            }
        }

        // 2. Tự động hỏi tạo Hoạt động nếu chưa có
        if (scanResult.activity_name && !finalActivityId && finalEnterpriseId) {
            const confirmed = await new Promise((resolve) => {
                Modal.confirm({
                    title: 'Hoạt động chưa tồn tại',
                    content: `Hoạt động "${scanResult.activity_name}" chưa có trên hệ thống. Bạn có muốn tạo mới cho doanh nghiệp này không?`,
                    okText: 'Tạo mới',
                    cancelText: 'Bỏ qua',
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });

            if (confirmed) {
                try {
                    const res = await api.post('/activities', {
                        title: scanResult.activity_name,
                        enterprise_id: finalEnterpriseId,
                        status: 'Đề xuất',
                        detail: scanResult.collaboration_scope || ''
                    });
                    finalActivityId = res.data.id;
                    await fetchOptions(); // Cập nhật lại danh sách hoạt động
                    message.success('Tạo hoạt động thành công!');
                } catch (error) {
                    message.error('Lỗi khi tạo hoạt động!');
                }
            }
        }

        const fields = {
            mou_code: scanResult.mou_code,
            enterprise_id: finalEnterpriseId || undefined,
            activity_id: finalActivityId || undefined,
            file_url: scanResult.file_url || undefined,
            signing_date: scanResult.signing_date ? dayjs(scanResult.signing_date) : null,
            partner_contact: scanResult.partner_contact,
            org_type: scanResult.org_type,
            country: scanResult.country,
            collaboration_scope: scanResult.collaboration_scope,
            vlu_contact: scanResult.vlu_contact,
            tasks_ay24_25: scanResult.tasks_ay24_25,
            next_steps: scanResult.next_steps,
            past_activities: scanResult.past_activities,
            related_data: scanResult.related_data,
        };
        // Remove nulls
        Object.keys(fields).forEach(k => fields[k] == null && delete fields[k]);
        form.setFieldsValue(fields);
        setEditingId(null);
        setIsScanModalOpen(false);
        setIsModalOpen(true);
        message.success('Đã điền thông tin vào form. Vui lòng kiểm tra và lưu!');
    };

    const handleSmartPdfAction = (record) => {
        if (record.file_url) {
            window.open(record.file_url, '_blank');
        } else {
            Modal.confirm({
                title: 'Chưa có file scan đính kèm',
                content: 'Biên bản này chưa có tài liệu gốc trên hệ thống (Cloud). Bạn có muốn hệ thống tự động xuất file PDF mẫu không?',
                okText: 'Xuất PDF',
                cancelText: 'Huỷ',
                onOk: () => handleExportPdf(record)
            });
        }
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
            width: 130,
            render: (text) => <span className="font-semibold text-blue-600">{text}</span>
        },
        {
            title: 'Tên đối tác',
            dataIndex: 'enterprise_name',
            key: 'enterprise_name',
            width: 220,
            ellipsis: true,
            render: (text) => <span className="font-semibold text-slate-800 dark:text-gray-100">{text}</span>
        },
        {
            title: 'Hoạt động liên kết',
            dataIndex: 'activity_title',
            key: 'activity_title',
            width: 200,
            ellipsis: true,
            render: (text) => text ? <Tag color="purple" className="whitespace-normal text-xs">{text}</Tag> : <span className="text-slate-400 text-xs">Chưa liên kết</span>
        },
        {
            title: 'Ngày ký',
            dataIndex: 'signing_date',
            key: 'signing_date',
            width: 110,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : <span className="text-slate-400">---</span>
        },
        {
            title: 'Đơn vị triển khai',
            dataIndex: 'executing_unit_name',
            key: 'executing_unit_name',
            width: 160,
            ellipsis: true,
        },
        {
            title: 'Loại tổ chức',
            dataIndex: 'org_type',
            key: 'org_type',
            width: 130,
            render: (text) => text ? <Tag color="blue">{text}</Tag> : null,
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
            width: 180,
            align: 'center',
            render: (_, record) => (
                <Space>
                    {record.working_dir && (
                        <Tooltip title="Mở thư mục làm việc">
                            <Button type="text" icon={<LinkOutlined />} onClick={() => window.open(record.working_dir, '_blank')} />
                        </Tooltip>
                    )}
                    <Tooltip title={record.file_url ? "Xem tài liệu (Cloud)" : "Xuất PDF Hợp đồng mẫu"}>
                        <Button
                            type="text"
                            icon={record.file_url ? <InboxOutlined className="text-purple-500" /> : <FilePdfOutlined className="text-red-500" />}
                            loading={exportingId === record.id}
                            onClick={() => handleSmartPdfAction(record)}
                        />
                    </Tooltip>
                    <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => openEditModal(record)} />
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            )
        }
    ];

    // ==================== SCAN RESULT PREVIEW ====================
    const ScanResultPreview = ({ result }) => {
        const fields = [
            { label: 'Mã biên bản', key: 'mou_code' },
            { label: 'Tên đối tác', key: 'enterprise_name' },
            { label: 'Doanh nghiệp khớp DB', key: 'matched_enterprise' },
            { label: 'Hoạt động liên quan', key: 'activity_name' },
            { label: 'Hoạt động khớp DB', key: 'matched_activity' },
            { label: 'Ngày ký', key: 'signing_date' },
            { label: 'Người liên hệ đối tác', key: 'partner_contact' },
            { label: 'Loại tổ chức', key: 'org_type' },
            { label: 'Quốc gia', key: 'country' },
            { label: 'Phạm vi hợp tác', key: 'collaboration_scope' },
            { label: 'Đầu mối VLU', key: 'vlu_contact' },
            { label: 'Công tác đã triển khai', key: 'tasks_ay24_25' },
            { label: 'Bước tiếp theo', key: 'next_steps' },
        ];
        return (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                    <CheckCircleOutlined className="text-green-500 text-lg" />
                    <span className="font-semibold text-green-700">AI đã trích xuất thành công:</span>
                    {result.matched_enterprise && (
                        <Tag color="green">Khớp: {result.matched_enterprise}</Tag>
                    )}
                </div>

                {result.firebase_error && (
                    <Alert
                        message="Lỗi Upload lên Cloud"
                        description={result.firebase_error}
                        type="warning"
                        showIcon
                        className="mb-3"
                    />
                )}

                <div className="grid grid-cols-2 gap-2">
                    {fields.map(f => result[f.key] ? (
                        <div key={f.key} className="text-sm">
                            <span className="text-slate-500 font-medium">{f.label}: </span>
                            <span className="text-slate-800 dark:text-gray-100">{result[f.key]}</span>
                        </div>
                    ) : null)}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 rounded-t-xl gap-4">
                    <div>
                        <h2 className="text-xl font-bold m-0 text-slate-800 dark:text-gray-100">Quản lý Biên Bản Ghi Nhớ (MOU)</h2>
                        <p className="text-sm text-slate-500 m-0">Danh sách thống kê các MOU đã ký với Đối tác/Doanh nghiệp</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                        <Input
                            placeholder="Tìm mã MOU, đối tác..."
                            prefix={<SearchOutlined className="text-slate-400" />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full sm:w-56 rounded-lg"
                        />
                        <Button
                            icon={<InboxOutlined />}
                            onClick={() => { setScanResult(null); setScanError(null); setUploadedFile(null); setIsScanModalOpen(true); }}
                            className="rounded-lg border-purple-400 text-purple-600 hover:bg-purple-50"
                            style={{ borderColor: '#9333ea', color: '#9333ea' }}
                        >
                            Import
                        </Button>
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

                {/* Action Bar for Bulk Selection */}
                {selectedRowKeys.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-5 mb-4 flex justify-between items-center animate-fade-in">
                        <span className="text-red-700 font-medium ml-2">Đã chọn {selectedRowKeys.length} biên bản MOU</span>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                            Xóa đã chọn
                        </Button>
                    </div>
                )}

                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 12 }}
                    className="border-none"
                    scroll={{ x: 'max-content' }}
                />
            </div>

            {/* ==================== ADD/EDIT MODAL ==================== */}
            <Modal
                title={editingId ? "Cập nhật Biên bản ghi nhớ (MOU)" : "Thêm mới Biên bản ghi nhớ (MOU)"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={850}
                destroyOnClose
            >
                <Form layout="vertical" form={form} onFinish={handleSave} className="mt-4">
                    <Form.Item name="file_url" hidden><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="mou_code" label="Mã biên bản" rules={[{ required: true, message: 'Vui lòng nhập!' }]}>
                                <Input placeholder="VD: MOU-2024-001" className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="enterprise_id" label="Tên đối tác (Doanh nghiệp)" rules={[{ required: true, message: 'Vui lòng chọn đối tác!' }]}>
                                <Select showSearch placeholder="Chọn đối tác..." filterOption={filterOptionIgnoreCase} className="rounded-lg">
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
                            <Form.Item noStyle dependencies={['enterprise_id']}>
                                {({ getFieldValue }) => {
                                    const entId = getFieldValue('enterprise_id');
                                    const filtered = activities.filter(a => Number(a.enterprise_id) === Number(entId));
                                    return (
                                        <Form.Item name="activity_id" label="Hoạt động liên kết">
                                            <Select showSearch allowClear placeholder={`Chọn hoạt động (${filtered.length} mục)`} filterOption={filterOptionIgnoreCase} className="rounded-lg" disabled={!entId}>
                                                {filtered.map(a => <Option key={a.id} value={a.id}>{a.title}</Option>)}
                                            </Select>
                                        </Form.Item>
                                    );
                                }}
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
                            <Form.Item name="country" label="Quốc gia đối tác">
                                <Input placeholder="VD: Việt Nam, Nhật Bản..." className="rounded-lg" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="executing_unit_id" label="Đơn vị triển khai">
                                <Select showSearch allowClear placeholder="Chọn bộ môn/đơn vị triển khai..." filterOption={filterOptionIgnoreCase} className="rounded-lg">
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
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
                        <Button onClick={() => setIsModalOpen(false)} size="large" className="rounded-lg">Hủy</Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-blue-600 rounded-lg">
                            {editingId ? "Cập nhật" : "Lưu Biên bản"}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* ==================== AI SCAN MODAL ==================== */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <RobotOutlined className="text-purple-600 text-xl" />
                        <span className="text-lg font-bold text-slate-800 dark:text-gray-100">Import Tài Liệu MOU bằng AI</span>
                    </div>
                }
                open={isScanModalOpen}
                onCancel={() => setIsScanModalOpen(false)}
                footer={null}
                width={680}
                destroyOnClose
            >
                <div className="mt-4">
                    {/* Instructions */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-purple-700 m-0">
                            <strong>Hướng dẫn:</strong> Upload ảnh chụp hoặc file PDF của hợp đồng/biên bản ghi nhớ MOU.
                            Gemini AI sẽ tự động đọc và trích xuất thông tin để điền vào form.
                        </p>
                    </div>

                    {/* Upload Area */}
                    <Dragger
                        beforeUpload={(file) => {
                            setUploadedFile(file);
                            setScanResult(null);
                            setScanError(null);
                            return false; // Prevent auto upload
                        }}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                        maxCount={1}
                        showUploadList={uploadedFile ? { showRemoveIcon: true } : false}
                        onRemove={() => setUploadedFile(null)}
                        className="rounded-lg"
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined className="text-purple-400 text-4xl" />
                        </p>
                        <p className="ant-upload-text text-slate-700 dark:text-gray-200">Kéo thả file hoặc nhấn để chọn</p>
                        <p className="ant-upload-hint text-slate-400 text-xs">
                            Hỗ trợ: JPG, PNG, WEBP, PDF • Tối đa 15MB
                        </p>
                    </Dragger>

                    {uploadedFile && (
                        <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                            <FilePdfOutlined className="text-red-400" />
                            <span className="text-sm text-slate-700 dark:text-gray-200 flex-1 truncate">{uploadedFile.name}</span>
                            <span className="text-xs text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                    )}

                    {/* Scan Button */}
                    <div className="mt-4 flex justify-center">
                        <Button
                            type="primary"
                            size="large"
                            icon={scanning ? <Spin size="small" /> : <ScanOutlined />}
                            onClick={handleScanDocument}
                            disabled={!uploadedFile || scanning}
                            loading={scanning}
                            style={{ background: '#9333ea', borderColor: '#9333ea', minWidth: 200 }}
                            className="rounded-lg"
                        >
                            {scanning ? 'Đang phân tích...' : 'Phân tích với Gemini AI'}
                        </Button>
                    </div>

                    {scanning && (
                        <div className="mt-4 text-center text-sm text-purple-600">
                            <Spin size="small" className="mr-2" />
                            AI đang đọc và trích xuất thông tin từ tài liệu, vui lòng đợi...
                        </div>
                    )}

                    {/* Error */}
                    {scanError && (
                        <Alert
                            message="Lỗi phân tích"
                            description={scanError}
                            type="error"
                            showIcon
                            className="mt-3 rounded-lg"
                        />
                    )}

                    {/* Result Preview */}
                    {scanResult && <ScanResultPreview result={scanResult} />}

                    {/* Apply Button */}
                    {scanResult && (
                        <div className="mt-4 flex justify-end gap-3">
                            <Button onClick={() => setIsScanModalOpen(false)} className="rounded-lg">Hủy</Button>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={handleApplyScanResult}
                                style={{ background: '#9333ea', borderColor: '#9333ea' }}
                                className="rounded-lg"
                                size="large"
                            >
                                Điền vào Form & Lưu
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MOUList;
