import React, { useState } from 'react';
import { Modal, Upload, Button, message, Alert, Typography, Table, Tag } from 'antd';
import { UploadOutlined, FileExcelOutlined, InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../utils/api';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;
const { Text } = Typography;

const ImportModal = ({ open, onClose, onSuccess, type, templateColumns }) => {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const typeLabels = {
        enterprises: 'Doanh nghiệp',
        activities: 'Hoạt động',
        students: 'Sinh viên',
    };

    const handleUpload = async (file) => {
        setUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/import/${type}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data);
            if (res.data.inserted > 0) {
                message.success(res.data.message);
                onSuccess?.();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi import file');
        } finally {
            setUploading(false);
        }
        return false; // Prevent default upload
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            templateColumns.reduce((obj, col) => ({ ...obj, [col]: '' }), {})
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `template_${type}.xlsx`);
        message.success('Đã tải file mẫu');
    };

    const handleClose = () => {
        setResult(null);
        onClose();
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <FileExcelOutlined className="text-green-600 text-xl" />
                    <span>Import dữ liệu {typeLabels[type]}</span>
                </div>
            }
            open={open}
            onCancel={handleClose}
            footer={null}
            width={600}
        >
            <div className="space-y-4 mt-4">
                <Alert
                    message="Hướng dẫn Import"
                    description={
                        <div className="text-sm">
                            <p>1. Tải file mẫu Excel bên dưới để xem cấu trúc cột yêu cầu.</p>
                            <p>2. Điền dữ liệu vào file theo đúng tên cột.</p>
                            <p>3. Kéo thả hoặc chọn file để upload (hỗ trợ .xlsx, .xls, .csv).</p>
                        </div>
                    }
                    type="info"
                    showIcon
                />

                <Button
                    icon={<DownloadOutlined />}
                    onClick={downloadTemplate}
                    className="w-full h-10 border-green-500 text-green-600 hover:bg-green-50"
                >
                    Tải file mẫu (.xlsx)
                </Button>

                <Dragger
                    name="file"
                    multiple={false}
                    accept=".csv,.xlsx,.xls"
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    disabled={uploading}
                >
                    <p className="text-4xl text-gray-300 mb-2"><InboxOutlined /></p>
                    <p className="text-gray-600 font-medium">Kéo thả file vào đây hoặc bấm để chọn file</p>
                    <p className="text-gray-400 text-xs mt-1">Hỗ trợ: .csv, .xlsx, .xls</p>
                </Dragger>

                {uploading && <Alert message="Đang xử lý file..." type="warning" showIcon />}

                {result && (
                    <div className="space-y-2">
                        <Alert
                            message={result.message}
                            type={result.inserted > 0 ? 'success' : 'warning'}
                            showIcon
                        />
                        <div className="flex gap-4 text-sm">
                            <Tag color="blue">Tổng: {result.total} dòng</Tag>
                            <Tag color="green">Thành công: {result.inserted}</Tag>
                            <Tag color="red">Lỗi: {result.errors?.length || 0}</Tag>
                        </div>
                        {result.errors?.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                                {result.errors.map((err, idx) => (
                                    <p key={idx} className="text-red-500 text-xs mb-1">⚠ {err}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImportModal;
