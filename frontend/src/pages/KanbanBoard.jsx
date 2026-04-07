import React, { useState, useEffect } from 'react';
import { message, Card, Select, Typography, Spin, Badge, Button, Modal, Form, Input, DatePicker, Tag, Tooltip } from 'antd';
import { PlusOutlined, BankOutlined, ProjectOutlined, CalendarOutlined, PushpinOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ENTERPRISE_STATUSES = [
  { name: 'Tiềm năng', color: 'bg-blue-500', tag: 'blue' },
  { name: 'Liên hệ', color: 'bg-cyan-500', tag: 'cyan' },
  { name: 'Đàm phán', color: 'bg-purple-500', tag: 'purple' },
  { name: 'Đề xuất', color: 'bg-orange-500', tag: 'orange' },
  { name: 'Đã ký hợp tác', color: 'bg-green-500', tag: 'green' },
  { name: 'Đang triển khai', color: 'bg-teal-500', tag: 'teal' },
  { name: 'Đã hoàn thành', color: 'bg-blue-600', tag: 'geekblue' },
  { name: 'Đã tạm ngưng', color: 'bg-red-500', tag: 'red' },
];

const ACTIVITY_STATUSES = [
  { name: 'Đề xuất', color: 'bg-orange-500', tag: 'orange' },
  { name: 'Phê duyệt nội bộ', color: 'bg-purple-500', tag: 'purple' },
  { name: 'Đã triển khai', color: 'bg-blue-500', tag: 'blue' },
  { name: 'Đã kết thúc', color: 'bg-green-500', tag: 'green' },
];

const KanbanBoard = () => {
  const [view, setView] = useState('ENTERPRISE');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Drag state
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const endpoint = view === 'ENTERPRISE' ? '/enterprises' : '/activities';
      const res = await api.get(endpoint);
      setItems(res.data);
    } catch (error) {
      message.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [view]);

  const handleStatusChange = async (item, newStatus) => {
    if (item.status === newStatus) return;
    
    // Optimistic update
    const previousItems = [...items];
    setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));

    try {
      if (view === 'ENTERPRISE') {
        const payload = { ...item, status: newStatus };
        await api.put(`/enterprises/${item.id}`, payload);
      } else {
        await api.put(`/activities/${item.id}/status`, { status: newStatus });
      }
      message.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      setItems(previousItems);
      message.error(`Lỗi khi cập nhật trạng thái: ${error.response?.data?.message || error.message}`);
    }
  };

  const onDragStart = (e, item) => {
    e.dataTransfer.setData('itemId', item.id);
    setDraggedItemId(item.id);
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const onDragLeave = () => {
    setDragOverCol(null);
  };

  const onDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedItemId(null);
    
    const itemId = e.dataTransfer.getData('itemId');
    if (!itemId) return;
    
    const item = items.find(i => i.id === parseInt(itemId, 10));
    if (item && item.status !== newStatus) {
      handleStatusChange(item, newStatus);
    }
  };

  const onDragEnd = () => {
    setDragOverCol(null);
    setDraggedItemId(null);
  };

  const handleAddSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (view === 'ENTERPRISE') {
        await api.post('/enterprises', values);
        message.success('Thêm doanh nghiệp thành công');
      } else {
        const payload = {
          ...values,
          start_date: values.start_date?.format('YYYY-MM-DD'),
          end_date: values.end_date?.format('YYYY-MM-DD'),
        };
        await api.post('/activities', payload);
        message.success('Thêm hoạt động thành công');
      }
      setIsModalOpen(false);
      form.resetFields();
      fetchItems();
    } catch (error) {
      message.error(`Lỗi khi thêm: ${error.response?.data?.message || 'Không xác định'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    form.resetFields();
    if (view === 'ENTERPRISE') {
      form.setFieldsValue({ status: 'Tiềm năng' });
    } else {
      form.setFieldsValue({ status: 'Đề xuất' });
    }
    setIsModalOpen(true);
  };

  const currentConfig = view === 'ENTERPRISE' ? ENTERPRISE_STATUSES : ACTIVITY_STATUSES;

  return (
    <div className="p-6 h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="!m-0 !mb-1 text-slate-800">
            {view === 'ENTERPRISE' ? 'Bảng Kanban Doanh Nghiệp' : 'Bảng Kanban Hoạt Động'}
          </Title>
          <Text type="secondary">Quản lý và kéo thả các mục qua các giai đoạn quy trình</Text>
        </div>
        
        <div className="flex items-center gap-3">
          <Select 
            value={view} 
            onChange={setView} 
            style={{ width: 160 }}
            size="large"
            className="shadow-sm"
          >
            <Option value="ENTERPRISE">Doanh nghiệp</Option>
            <Option value="ACTIVITY">Hoạt động</Option>
          </Select>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={openAddModal}
            className="shadow-sm bg-blue-600 hover:bg-blue-500"
          >
            {view === 'ENTERPRISE' ? 'Thêm Doanh Nghiệp' : 'Thêm Hoạt Động'}
          </Button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center"><Spin size="large" /></div>
      ) : (
        <div className="flex-1 flex overflow-x-auto gap-4 pb-4">
          {currentConfig.map(colConfig => {
            const status = colConfig.name;
            const columnItems = items.filter(item => item.status === status);
            const isDragOver = dragOverCol === status;
            
            return (
              <div 
                key={status} 
                className={`bg-slate-100 rounded-xl min-w-[320px] w-[320px] flex flex-col h-full border border-slate-200 shadow-sm transition-colors duration-200 ${isDragOver ? 'bg-slate-200 border-blue-400 border-dashed border-2' : ''}`}
                onDragOver={(e) => onDragOver(e, status)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, status)}
              >
                {/* Column Header */}
                <div className="p-3 pb-2 border-b border-slate-200">
                  <div className={`h-1 w-full rounded-t-lg mb-2 ${colConfig.color}`}></div>
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{status}</h3>
                    <Badge 
                      count={columnItems.length} 
                      showZero 
                      style={{ backgroundColor: isDragOver ? '#1890ff' : '#94a3b8', color: '#fff', fontWeight: 'bold' }} 
                    />
                  </div>
                </div>
                
                {/* Column Items */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3">
                  {columnItems.map(item => {
                    const isDragged = draggedItemId === item.id;
                    const itemName = view === 'ENTERPRISE' ? item.name : item.title;
                    const itemIndustry = view === 'ENTERPRISE' ? item.industry : item.activity_type;
                    
                    return (
                      <Card
                        key={item.id}
                        size="small"
                        className={`cursor-grab active:cursor-grabbing border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all ${isDragged ? 'opacity-50 scale-95' : ''}`}
                        styles={{ body: { padding: '12px' } }}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        onDragEnd={onDragEnd}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <Tooltip title={itemName}>
                              <div className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight">
                                {itemName}
                              </div>
                            </Tooltip>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-1">
                            {view === 'ENTERPRISE' ? (
                              <Tag color={colConfig.tag} className="border-0 m-0 text-xs flex items-center">
                                <BankOutlined className="mr-1" /> {itemIndustry || 'Chưa phân loại'}
                              </Tag>
                            ) : (
                              <>
                                <Tag color={colConfig.tag} className="border-0 m-0 text-xs flex items-center">
                                  <ProjectOutlined className="mr-1" /> {itemIndustry || 'Chưa phân loại'}
                                </Tag>
                                {item.start_date && (
                                  <Tag className="border-slate-200 m-0 text-xs flex items-center text-slate-500 bg-slate-50">
                                    <CalendarOutlined className="mr-1" /> {dayjs(item.start_date).format('DD/MM/YYYY')}
                                  </Tag>
                                )}
                              </>
                            )}
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                            <div className="text-xs text-slate-500 flex items-center max-w-[60%] truncate">
                              <PushpinOutlined className="mr-1" /> ID: {item.id}
                            </div>
                            
                            <Select 
                              size="small" 
                              value={item.status} 
                              onChange={(val) => handleStatusChange(item, val)}
                              onClick={e => e.stopPropagation()}
                              dropdownMatchSelectWidth={false}
                              variant="filled"
                              className="w-[100px] text-xs"
                            >
                              {currentConfig.map(col => (
                                <Option key={col.name} value={col.name} className="text-xs">{col.name}</Option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  
                  {columnItems.length === 0 && (
                    <div className={`h-24 flex items-center justify-center text-sm italic rounded-lg border-2 border-dashed transition-colors ${isDragOver ? 'border-blue-300 text-blue-500 bg-blue-50/50' : 'border-slate-200 text-slate-400'}`}>
                      {isDragOver ? 'Thả để chuyển trạng thái' : 'Kéo thả vào đây'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        title={view === 'ENTERPRISE' ? "Thêm Doanh Nghiệp Mới" : "Thêm Hoạt Động Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddSubmit}>
          {view === 'ENTERPRISE' ? (
            <>
              <Form.Item name="name" label="Tên Doanh Nghiệp" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                <Input placeholder="Công ty Cổ phần ABC" />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  {currentConfig.map(col => <Option key={col.name} value={col.name}>{col.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="industry" label="Lĩnh vực">
                <Input placeholder="Công nghệ thông tin, Tài chính..." />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input placeholder="contact@abc.com" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="0123456789" />
              </Form.Item>
              <Form.Item name="address" label="Địa chỉ">
                <TextArea rows={2} placeholder="Số nhà, đường, quận, thành phố..." />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="title" label="Tiêu đề hoạt động" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                <Input placeholder="Hội thảo kết nối doanh nghiệp" />
              </Form.Item>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  {currentConfig.map(col => <Option key={col.name} value={col.name}>{col.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="activity_type" label="Loại hoạt động">
                <Input placeholder="Seminar, Workshop, Tham quan..." />
              </Form.Item>
              <div className="flex gap-4">
                <Form.Item name="start_date" label="Từ ngày" className="flex-1">
                  <DatePicker format="DD/MM/YYYY" className="w-full" />
                </Form.Item>
                <Form.Item name="end_date" label="Đến ngày" className="flex-1">
                  <DatePicker format="DD/MM/YYYY" className="w-full" />
                </Form.Item>
              </div>
              <Form.Item name="description" label="Mô tả chi tiết">
                <TextArea rows={3} placeholder="Nội dung, mục tiêu của hoạt động..." />
              </Form.Item>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-blue-600">
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;
