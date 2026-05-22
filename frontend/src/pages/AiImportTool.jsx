import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, Steps, Upload, Button, message, Table, Select, Progress, Typography, Space } from 'antd';
import { InboxOutlined, CheckCircleOutlined, SyncOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import Cookies from 'js-cookie';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const SYSTEM_FIELDS = [
    { key: 'company_name', label: 'Tên doanh nghiệp (*)', required: true },
    { key: 'rep_title', label: 'Danh xưng đại diện', required: false },
    { key: 'rep_name', label: 'Họ và tên đại diện', required: false },
    { key: 'rep_role', label: 'Chức vụ đại diện', required: false },
    { key: 'rep_phone', label: 'Số điện thoại', required: false },
    { key: 'rep_email', label: 'Email', required: false },
    { key: 'address', label: 'Địa chỉ', required: false },
    { key: 'activities', label: 'Các hoạt động đã hợp tác (*)', required: true }
];

const AiImportTool = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        document.title = "Nhập dữ liệu bằng AI | VLU Enterprise Link Manager";
    }, []);
    const [headers, setHeaders] = useState([]);
    const [rawData, setRawData] = useState([]);
    
    // mapping state: { systemFieldKey: excelHeaderName }
    const [mapping, setMapping] = useState({});
    
    // Processed & Grouped Data
    const [groupedData, setGroupedData] = useState([]);
    const [importProgress, setImportProgress] = useState(0);
    const [importStatus, setImportStatus] = useState([]); // Array of { companyName, status, message }
    const [isImporting, setIsImporting] = useState(false);
    const isImportingRef = useRef(false);

    // --- STEP 1: Upload File ---
    const uploadProps = {
        name: 'file',
        multiple: false,
        accept: '.xlsx, .xls, .csv',
        beforeUpload: (file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Get headers (first row)
                const headerRow = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] || [];
                const validHeaders = headerRow.filter(h => h && String(h).trim() !== '');
                setHeaders(validHeaders);
                
                // Get all data
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                setRawData(jsonData);
                
                // Auto-map if names loosely match
                const autoMap = {};
                SYSTEM_FIELDS.forEach(sf => {
                    const match = validHeaders.find(h => 
                        h.toLowerCase().includes(sf.label.replace(' (*)', '').toLowerCase()) ||
                        (sf.key === 'company_name' && h.toLowerCase().includes('doanh nghiệp')) ||
                        (sf.key === 'rep_name' && h.toLowerCase().includes('họ tên'))
                    );
                    if (match) autoMap[sf.key] = match;
                });
                setMapping(autoMap);
                
                setFileList([file]);
                setCurrentStep(1);
            };
            reader.readAsArrayBuffer(file);
            return false; // Prevent auto upload
        },
        fileList,
        onRemove: () => {
            setFileList([]);
            setHeaders([]);
            setRawData([]);
            setMapping({});
            setCurrentStep(0);
        }
    };

    // --- STEP 2: Map Columns ---
    const handleMapChange = (systemKey, excelHeader) => {
        setMapping(prev => ({ ...prev, [systemKey]: excelHeader }));
    };

    const confirmMapping = () => {
        // Validate required fields
        const missingReq = SYSTEM_FIELDS.filter(f => f.required && !mapping[f.key]);
        if (missingReq.length > 0) {
            message.error(`Vui lòng map các trường bắt buộc: ${missingReq.map(f => f.label).join(', ')}`);
            return;
        }

        // Process data: Group by Company Name
        const companyField = mapping['company_name'];
        if (!companyField) return;

        const grouped = {};
        rawData.forEach(row => {
            const cName = row[companyField];
            if (!cName || String(cName).trim() === '') return;
            
            const key = String(cName).trim().toUpperCase();
            if (!grouped[key]) {
                grouped[key] = {
                    company_name: cName,
                    rep_title: row[mapping['rep_title']] || '',
                    rep_name: row[mapping['rep_name']] || '',
                    rep_role: row[mapping['rep_role']] || '',
                    rep_phone: row[mapping['rep_phone']] || '',
                    rep_email: row[mapping['rep_email']] || '',
                    address: row[mapping['address']] || '',
                    activities: []
                };
            }
            
            const actStr = row[mapping['activities']];
            if (actStr && String(actStr).trim() !== '') {
                grouped[key].activities.push(String(actStr).trim());
            }
        });

        const finalData = Object.values(grouped).map(g => {
            const actText = g.activities.join('\\n- ');
            // Construct rowText matching python script
            const rowText = `Doanh nghiệp: ${g.company_name}\\n` +
                `Đại diện: ${g.rep_title} ${g.rep_name} - ${g.rep_role}\\n` +
                `Liên hệ: ${g.rep_phone} - ${g.rep_email}\\n` +
                `Địa chỉ: ${g.address}\\n` +
                `CÁC HOẠT ĐỘNG (Đã gộp):\\n${actText}`;
            
            return {
                companyName: g.company_name,
                rowText: rowText,
                activityCount: g.activities.length
            };
        });

        setGroupedData(finalData);
        setCurrentStep(2);
    };

    // --- STEP 3: Preview Data ---
    const previewColumns = [
        { title: 'Tên Doanh nghiệp', dataIndex: 'companyName', key: 'companyName', width: 250 },
        { title: 'Số lượng hoạt động gộp', dataIndex: 'activityCount', key: 'activityCount', width: 150 },
        { 
            title: 'Dữ liệu thô (Gửi lên AI)', 
            dataIndex: 'rowText', 
            key: 'rowText',
            render: (text) => (
                <div className="max-h-32 overflow-y-auto text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {text}
                </div>
            )
        }
    ];

    // --- STEP 4: Import Process ---
    const startImport = async () => {
        setIsImporting(true);
        isImportingRef.current = true;
        setCurrentStep(3);
        
        // Use functional state updates to keep track without stale closures
        let currentStatus = [...importStatus];
        if (importProgress === 100) {
            currentStatus = [];
            setImportStatus([]);
            setImportProgress(0);
        }

        for (let i = 0; i < groupedData.length; i++) {
            if (!isImportingRef.current) {
                break;
            }

            const item = groupedData[i];
            
            // Skip already successful ones
            const isSuccess = currentStatus.some(log => log.companyName === item.companyName && log.status === 'success');
            if (isSuccess) {
                setImportProgress(Math.round(((i + 1) / groupedData.length) * 100));
                continue;
            }

            try {
                const token = Cookies.get('token');
                const res = await axios.post(
                    'http://localhost:5000/api/import/ai-parse-row', 
                    { rowText: item.rowText },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                currentStatus = [
                    ...currentStatus.filter(l => l.companyName !== item.companyName),
                    { companyName: item.companyName, status: 'success', message: res.data.message || 'Thành công' }
                ];
                setImportStatus(currentStatus);
            } catch (err) {
                currentStatus = [
                    ...currentStatus.filter(l => l.companyName !== item.companyName),
                    { companyName: item.companyName, status: 'error', message: err.response?.data?.message || err.message }
                ];
                setImportStatus(currentStatus);
            }
            setImportProgress(Math.round(((i + 1) / groupedData.length) * 100));
        }
        
        setIsImporting(false);
        isImportingRef.current = false;
        
        // Show completion message only if it wasn't paused
        if (isImportingRef.current === false && importProgress === 100) {
            // Already handled by progress bar
        }
    };

    const pauseImport = () => {
        isImportingRef.current = false;
        setIsImporting(false);
        message.info('Đã tạm dừng Import. Tiến trình được lưu lại.');
    };

    const cancelImport = () => {
        isImportingRef.current = false;
        setIsImporting(false);
        setFileList([]);
        setCurrentStep(0);
        setImportProgress(0);
        setImportStatus([]);
        message.warning('Đã hủy quá trình Import.');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Title level={2} className="m-0 text-gray-800 dark:text-gray-100">
                    Import Dữ Liệu Tự Động (AI)
                </Title>
            </div>

            <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <Steps 
                    current={currentStep} 
                    className="mb-8"
                    items={[
                        { title: 'Upload File', icon: <FileExcelOutlined /> },
                        { title: 'Ghép Cột', icon: <SyncOutlined /> },
                        { title: 'Xem Trước', icon: <CheckCircleOutlined /> },
                        { title: 'Đang Import', icon: <InboxOutlined /> },
                    ]}
                />

                {/* Step 0: Upload */}
                {currentStep === 0 && (
                    <div className="py-8">
                        <Dragger {...uploadProps} className="dark:bg-gray-700 dark:border-gray-600 hover:dark:border-red-500">
                            <p className="ant-upload-drag-icon text-red-500">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text dark:text-gray-200">Kéo thả file Excel hoặc click để chọn file</p>
                            <p className="ant-upload-hint dark:text-gray-400">
                                Hệ thống sẽ tự động gộp các dòng trùng tên doanh nghiệp và dùng AI phân tích dữ liệu.
                            </p>
                        </Dragger>
                    </div>
                )}

                {/* Step 1: Mapping */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <Title level={4} className="dark:text-gray-200">Ghép cột Excel với Trường Dữ Liệu Hệ Thống</Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SYSTEM_FIELDS.map(sf => (
                                <div key={sf.key} className="flex flex-col space-y-1">
                                    <Text className="dark:text-gray-300">
                                        {sf.label} {sf.required && <span className="text-red-500">*</span>}
                                    </Text>
                                    <Select
                                        showSearch
                                        allowClear
                                        placeholder="Chọn cột tương ứng"
                                        value={mapping[sf.key]}
                                        onChange={(val) => handleMapChange(sf.key, val)}
                                        options={headers.map(h => ({ label: h, value: h }))}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button onClick={() => setCurrentStep(0)}>Quay lại</Button>
                            <Button type="primary" className="bg-red-600" onClick={confirmMapping}>
                                Tiếp tục
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <Title level={4} className="dark:text-gray-200">
                            Dữ liệu sau khi gộp ({groupedData.length} Doanh nghiệp)
                        </Title>
                        <Table 
                            dataSource={groupedData} 
                            columns={previewColumns} 
                            rowKey="companyName"
                            pagination={{ pageSize: 5 }}
                            bordered
                            size="small"
                        />
                        <div className="flex justify-end gap-3">
                            <Button onClick={() => setCurrentStep(1)}>Quay lại</Button>
                            <Button type="primary" className="bg-red-600" onClick={startImport}>
                                Bắt đầu Import bằng AI
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Importing */}
                {currentStep === 3 && (
                    <div className="space-y-6 py-6">
                        <div className="text-center">
                            <Title level={4} className="dark:text-gray-200">
                                {isImporting ? 'Đang tiến hành phân tích & lưu trữ...' : 'Hoàn tất quá trình Import'}
                            </Title>
                            <Progress percent={importProgress} status={isImporting ? 'active' : 'success'} />
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm border border-gray-200 dark:border-gray-700">
                            {importStatus.map((log, idx) => (
                                <div key={idx} className={`mb-1 ${log.status === 'error' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                    [{log.status.toUpperCase()}] {log.companyName}: {log.message}
                                </div>
                            ))}
                            {importStatus.length === 0 && <div className="text-gray-500">Đang chờ xử lý...</div>}
                        </div>

                        {!isImporting && (
                            <div className="flex justify-center gap-4 mt-6">
                                {importProgress < 100 ? (
                                    <Button type="primary" className="bg-red-600" onClick={startImport}>
                                        Tiếp tục Import
                                    </Button>
                                ) : null}
                                <Button onClick={() => {
                                    setFileList([]);
                                    setCurrentStep(0);
                                    setImportProgress(0);
                                    setImportStatus([]);
                                }}>
                                    Import File Khác
                                </Button>
                            </div>
                        )}
                        {isImporting && (
                            <div className="flex justify-center gap-4 mt-6">
                                <Button type="default" onClick={pauseImport}>
                                    Tạm dừng
                                </Button>
                                <Button type="default" danger onClick={cancelImport}>
                                    Hủy Import
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AiImportTool;
