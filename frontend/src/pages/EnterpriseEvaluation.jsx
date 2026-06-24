import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Rate, Space, Spin, message, Row, Col, Divider, Timeline, Tag, Modal } from 'antd';
import { ArrowLeftOutlined, LikeOutlined, CheckCircleOutlined, InfoCircleOutlined, MessageOutlined, CalendarOutlined, UserOutlined, EditOutlined, DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';

const { TextArea } = Input;

const NumberRating = ({ value, onChange }) => {
    return (
        <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = value === num;
                return (
                    <button
                        type="button"
                        key={num}
                        onClick={() => onChange && onChange(num)}
                        className={`w-12 h-12 rounded-xl font-bold text-base flex items-center justify-center transition-all ${
                            isSelected
                                ? 'bg-vluRed text-white shadow-md transform scale-105 border border-vluRed'
                                : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 hover:border-vluRed hover:text-vluRed'
                        }`}
                    >
                        {num}
                    </button>
                );
            })}
        </div>
    );
};

const EnterpriseEvaluation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [enterprise, setEnterprise] = useState(null);
    const [pastRatings, setPastRatings] = useState([]);
    
    // Rating states for dynamic calculation
    const [coordination, setCoordination] = useState(0);
    const [facilities, setFacilities] = useState(0);
    const [guidance, setGuidance] = useState(0);

    // Edit mode states
    const [editingRatingId, setEditingRatingId] = useState(null);

    // Get current logged in user details
    const userCookie = Cookies.get('user');
    let currentUser = null;
    try {
        if (userCookie) currentUser = JSON.parse(userCookie);
    } catch (e) {
        console.error("Failed to parse user cookie", e);
    }

    const scoreTexts = ['Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Xuất sắc/Rất hài lòng'];

    const getRoleLabel = (rating) => {
        if (rating.user_role === 'ADMIN') return 'Quản trị viên';
        if (rating.user_role === 'FACULTY_MANAGER') return 'Quản lý khoa';
        if (rating.user_role === 'LECTURER') return 'Giảng viên';
        return rating.user_type === 'LECTURER' ? 'Giảng viên' : 'Sinh viên';
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entRes, ratingsRes] = await Promise.all([
                api.get(`/enterprises/${id}`),
                api.get(`/ratings/enterprise/${id}`)
            ]);
            setEnterprise(entRes.data);
            setPastRatings(ratingsRes.data || []);
        } catch (error) {
            message.error('Không thể tải thông tin doanh nghiệp hoặc đánh giá');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleValuesChange = (changedValues, allValues) => {
        if (allValues.coordination_score !== undefined) setCoordination(allValues.coordination_score);
        if (allValues.facilities_score !== undefined) setFacilities(allValues.facilities_score);
        if (allValues.guidance_score !== undefined) setGuidance(allValues.guidance_score);
    };

    // Real-time calculation of overall score
    const calculatedOverall = () => {
        const count = [coordination, facilities, guidance].filter(v => v > 0).length;
        if (count === 0) return 0;
        const total = (coordination || 0) + (facilities || 0) + (guidance || 0);
        return (total / count).toFixed(1);
    };

    // Enter Edit mode
    const handleEditRating = (rating) => {
        setEditingRatingId(rating.id);
        form.setFieldsValue({
            coordination_score: rating.coordination_score,
            facilities_score: rating.facilities_score,
            guidance_score: rating.guidance_score,
            internal_note: rating.internal_note
        });
        setCoordination(rating.coordination_score);
        setFacilities(rating.facilities_score);
        setGuidance(rating.guidance_score);
        
        // Scroll to form smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        message.info(`Đang chỉnh sửa đánh giá.`);
    };

    // Cancel Edit mode
    const handleCancelEdit = () => {
        setEditingRatingId(null);
        form.resetFields();
        setCoordination(0);
        setFacilities(0);
        setGuidance(0);
    };

    // Delete a rating
    const handleDeleteRating = (ratingId) => {
        Modal.confirm({
            title: 'Xác nhận xóa phiếu đánh giá?',
            content: 'Ý kiến đóng góp này sẽ bị gỡ bỏ vĩnh viễn khỏi doanh nghiệp. Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            okButtonProps: { className: 'bg-red-600 text-white border-none' },
            onOk: async () => {
                try {
                    await api.delete(`/ratings/${ratingId}`);
                    message.success('Xóa phiếu đánh giá thành công');
                    
                    // If deleted the one currently being edited, cancel edit
                    if (editingRatingId === ratingId) {
                        handleCancelEdit();
                    }
                    
                    fetchData();
                } catch (error) {
                    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá');
                }
            }
        });
    };

    const onFinish = async (values) => {
        if (!coordination || !facilities || !guidance) {
            message.warning('Vui lòng cho điểm tất cả các tiêu chí');
            return;
        }

        setSubmitting(true);
        try {
            if (editingRatingId) {
                // Update existing rating
                await api.put(`/ratings/${editingRatingId}`, {
                    coordination_score: values.coordination_score,
                    facilities_score: values.facilities_score,
                    guidance_score: values.guidance_score,
                    internal_note: values.internal_note
                });
                message.success('Cập nhật nhận xét, đánh giá thành công');
                setEditingRatingId(null);
            } else {
                // Add new rating
                await api.post('/ratings', {
                    enterprise_id: Number(id),
                    coordination_score: values.coordination_score,
                    facilities_score: values.facilities_score,
                    guidance_score: values.guidance_score,
                    internal_note: values.internal_note
                });
                message.success('Đã gửi nhận xét và đánh giá doanh nghiệp thành công');
            }
            form.resetFields();
            setCoordination(0);
            setFacilities(0);
            setGuidance(0);
            fetchData(); // Reload list & average rating score
        } catch (error) {
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    // const avgScore = calculatedOverall();

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
            {/* Header section with back button */}
            <div className="flex items-center gap-3 mb-6">
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/enterprises')}
                    className="border-none bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center h-10 w-10 rounded-full"
                />
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-gray-100 m-0">Đánh giá chất lượng Doanh nghiệp</h1>
                    <p className="text-slate-500 m-0 mt-0.5">Dành cho Giảng viên hướng dẫn & quản lý</p>
                </div>
            </div>

            {/* Enterprise basic card */}
            <Card className="mb-6 rounded-2xl border-slate-100 dark:border-gray-700/80 shadow-sm bg-gradient-to-r from-red-50/30 to-slate-50/50 dark:from-red-950/10 dark:to-gray-800/20">
                <Row gutter={[24, 16]}>
                    <Col xs={24} md={24}>
                        <h2 className="text-lg font-bold text-vluRed dark:text-red-400 m-0 mb-2">{enterprise?.name}</h2>
                        <Space wrap className="mb-2">
                            {enterprise?.scale_name && <Tag color="blue" className="rounded-md px-2 py-0.5">{enterprise.scale_name}</Tag>}
                            {enterprise?.status && <Tag color="orange" className="rounded-md px-2 py-0.5">{enterprise.status}</Tag>}
                        </Space>
                        <div className="text-xs text-slate-500 space-y-1">
                            <div><strong>Mã số thuế:</strong> {enterprise?.tax_code || 'Chưa cung cấp'}</div>
                            <div><strong>Lĩnh vực:</strong> {enterprise?.fields?.map(f => f.name).join(', ') || 'Chưa phân loại'}</div>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[24, 24]}>
                {/* Form column */}
                <Col xs={24} lg={14}>
                    <Card className="rounded-2xl border-slate-100 dark:border-gray-700/80 shadow-sm relative overflow-hidden">
                        {editingRatingId && (
                            <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50 mb-4 rounded-t-xl -mt-6 -mx-6">
                                <span className="flex items-center gap-1.5">
                                    <InfoCircleOutlined /> Bạn đang chỉnh sửa lại phiếu đánh giá của mình.
                                </span>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    icon={<CloseCircleOutlined />} 
                                    onClick={handleCancelEdit}
                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                                >
                                    Hủy chỉnh sửa
                                </Button>
                            </div>
                        )}

                        <h3 className="text-md font-bold mb-5 flex items-center gap-2 text-slate-800 dark:text-gray-100">
                            <CheckCircleOutlined className="text-emerald-500" /> 
                            {editingRatingId ? 'Cập nhật phiếu nhận xét, đánh giá' : 'Điền phiếu nhận xét, đánh giá'}
                        </h3>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            onValuesChange={handleValuesChange}
                            initialValues={{
                                coordination_score: 0,
                                facilities_score: 0,
                                guidance_score: 0,
                                internal_note: ''
                            }}
                        >
                            <Row gutter={[16, 16]}>
                                {/* Coordination Score */}
                                <Col xs={24}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/40 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                                        <Form.Item
                                            name="coordination_score"
                                            label={<span className="font-semibold text-slate-700 dark:text-gray-200">1. Chất lượng phối hợp của doanh nghiệp</span>}
                                            rules={[{ required: true, message: 'Vui lòng đánh giá tiêu chí này' }]}
                                            className="mb-0 flex-1"
                                        >
                                            <NumberRating />
                                        </Form.Item>
                                        {coordination > 0 && (
                                            <span className="text-sm font-semibold text-slate-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm mt-1 sm:mt-8 self-start sm:self-center">
                                                {scoreTexts[coordination - 1]}
                                            </span>
                                        )}
                                    </div>
                                </Col>

                                {/* Facilities Score */}
                                <Col xs={24}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/40 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                                        <Form.Item
                                            name="facilities_score"
                                            label={<span className="font-semibold text-slate-700 dark:text-gray-200">2. Cơ sở vật chất của doanh nghiệp</span>}
                                            rules={[{ required: true, message: 'Vui lòng đánh giá tiêu chí này' }]}
                                            className="mb-0 flex-1"
                                        >
                                            <NumberRating />
                                        </Form.Item>
                                        {facilities > 0 && (
                                            <span className="text-sm font-semibold text-slate-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm mt-1 sm:mt-8 self-start sm:self-center">
                                                {scoreTexts[facilities - 1]}
                                            </span>
                                        )}
                                    </div>
                                </Col>

                                {/* Guidance / Support Score */}
                                <Col xs={24}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/40 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                                        <Form.Item
                                            name="guidance_score"
                                            label={<span className="font-semibold text-slate-700 dark:text-gray-200">3. Sự hỗ trợ của doanh nghiệp đối với sinh viên thực tập</span>}
                                            rules={[{ required: true, message: 'Vui lòng đánh giá tiêu chí này' }]}
                                            className="mb-0 flex-1"
                                        >
                                            <NumberRating />
                                        </Form.Item>
                                        {guidance > 0 && (
                                            <span className="text-sm font-semibold text-slate-500 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm mt-1 sm:mt-8 self-start sm:self-center">
                                                {scoreTexts[guidance - 1]}
                                            </span>
                                        )}
                                    </div>
                                </Col>

                                {/* Comments Text Area */}
                                <Col xs={24}>
                                    <Form.Item
                                        name="internal_note"
                                        label={<span className="font-semibold text-slate-700 dark:text-gray-200">4. Nhận xét & Đánh giá chi tiết</span>}
                                        rules={[{ required: true, message: 'Vui lòng để lại ý kiến đóng góp' }]}
                                    >
                                        <TextArea 
                                            rows={4} 
                                            placeholder="Thầy/Cô hãy để lại những nhận xét thực tế về thái độ, điều kiện làm việc, sự hướng dẫn hay sự phối hợp của doanh nghiệp..."
                                            className="rounded-xl"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} className="mt-4 flex justify-end gap-3">
                                    {editingRatingId ? (
                                        <>
                                            <Button onClick={handleCancelEdit} size="large" className="rounded-xl">Hủy chỉnh sửa</Button>
                                            <Button 
                                                type="primary" 
                                                htmlType="submit" 
                                                size="large" 
                                                loading={submitting} 
                                                className="bg-blue-600 hover:bg-blue-500 border-none rounded-xl"
                                            >
                                                Cập nhật Đánh giá
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button onClick={() => navigate('/enterprises')} size="large" className="rounded-xl">Quay lại</Button>
                                            <Button 
                                                type="primary" 
                                                htmlType="submit" 
                                                size="large" 
                                                loading={submitting} 
                                                className="bg-vluRed hover:bg-vluRedHover border-none rounded-xl"
                                            >
                                                Gửi Đánh Giá
                                            </Button>
                                        </>
                                    )}
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </Col>

                {/* History list column */}
                <Col xs={24} lg={10}>
                    <Card className="rounded-2xl border-slate-100 dark:border-gray-700/80 shadow-sm h-full flex flex-col">
                        <h3 className="text-md font-bold mb-5 flex items-center gap-2 text-slate-800 dark:text-gray-100">
                            <MessageOutlined className="text-blue-500" /> Ý kiến đánh giá trước đây ({pastRatings.length})
                        </h3>

                        {pastRatings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center flex-1">
                                <InfoCircleOutlined className="text-3xl text-slate-300 mb-3" />
                                <p className="text-sm font-medium">Chưa có đánh giá nào cho doanh nghiệp này.</p>
                                <p className="text-xs text-slate-400">Hãy là người đầu tiên đánh giá chất lượng hợp tác!</p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto max-h-[60vh] pr-2 flex-1 pt-2">
                                <Timeline>
                                    {pastRatings.map((rating) => {
                                        const isCreatorOrAdmin = currentUser?.role === 'ADMIN' || rating.created_by === currentUser?.id;
                                        return (
                                            <Timeline.Item 
                                                key={rating.id} 
                                                dot={<LikeOutlined className="text-blue-500" />}
                                            >
                                                <div className="bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800/80 p-3.5 rounded-xl mb-3 relative group">
                                                    {/* Header info inside card */}
                                                    <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400">
                                                        <span className="font-semibold text-slate-500 uppercase tracking-wider">
                                                            {getRoleLabel(rating)}
                                                        </span>
                                                        <span className="flex items-center gap-1 flex-shrink-0">
                                                            <CalendarOutlined /> {dayjs(rating.created_at).format('DD/MM/YYYY HH:mm')}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-end items-center mb-2">
                                                        {isCreatorOrAdmin && (
                                                            <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-md px-1.5 py-0.5">
                                                                <Button 
                                                                    type="text" 
                                                                    size="small" 
                                                                    icon={<EditOutlined className="text-blue-500 text-xs" />} 
                                                                    onClick={() => handleEditRating(rating)}
                                                                    className="h-5 w-5 p-0 flex items-center justify-center hover:bg-slate-100"
                                                                />
                                                                <span className="text-slate-300 dark:text-gray-600 text-xs">|</span>
                                                                <Button 
                                                                    type="text" 
                                                                    size="small" 
                                                                    danger 
                                                                    icon={<DeleteOutlined className="text-red-500 text-xs" />} 
                                                                    onClick={() => handleDeleteRating(rating.id)}
                                                                    className="h-5 w-5 p-0 flex items-center justify-center hover:bg-red-50"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-slate-600 dark:text-gray-300 italic m-0 mb-2">
                                                        "{rating.internal_note || 'Không có nhận xét chi tiết'}"
                                                    </p>

                                                    <div className="text-[9px] text-slate-400 flex items-center gap-1 font-medium bg-slate-100 dark:bg-gray-800/80 px-2 py-0.5 rounded w-max">
                                                        <UserOutlined /> {rating.user_name ? `${rating.user_name} (${getRoleLabel(rating)})` : getRoleLabel(rating)}
                                                    </div>
                                                </div>
                                            </Timeline.Item>
                                        );
                                    })}
                                </Timeline>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default EnterpriseEvaluation;
