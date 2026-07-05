const nodemailer = require('nodemailer');
require('dotenv').config();

const useRealSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter;

if (useRealSmtp) {
    console.log(`[Email Service] Using production SMTP server: ${process.env.SMTP_HOST}`);
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    console.log('[Email Service] Using local mock SMTP server (127.0.0.1:1025)');
    transporter = nodemailer.createTransport({
        host: '127.0.0.1',
        port: 1025,
        secure: false, // TLS not required for local SMTP mock
        tls: {
            rejectUnauthorized: false
        }
    });
}

/**
 * Send an email warning about an upcoming MOU expiration to the Faculty Manager
 * @param {string} managerEmail 
 * @param {string} managerName 
 * @param {string} mouCode 
 * @param {string} enterpriseName 
 * @param {string} endDate 
 * @param {number} daysLeft 
 */
async function sendExpiryWarningEmail(managerEmail, managerName, mouCode, enterpriseName, endDate, daysLeft) {
    const formattedDate = new Date(endDate).toLocaleDateString('vi-VN');
    const warningLabel = daysLeft === 0 ? 'đã hết hạn hôm nay' : `sắp hết hạn trong ${daysLeft} ngày tới`;
    const subject = `[CẢNH BÁO] Hợp đồng MOU với ${enterpriseName} ${warningLabel}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Hệ thống Quản lý Hợp tác VLU" <no-reply@vlu.edu.vn>',
        to: managerEmail,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #DA251D; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">Cảnh Báo Hợp Đồng Sắp Hết Hạn</h2>
                </div>
                <div style="padding: 24px; color: #1a202c; line-height: 1.6;">
                    <p>Kính gửi Thầy/Cô <strong>${managerName}</strong>,</p>
                    <p>Hệ thống ghi nhận Biên bản ghi nhớ hợp tác (MOU) sau đây <strong>${warningLabel}</strong>:</p>
                    
                    <div style="background-color: #f7fafc; border-left: 4px solid #DA251D; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 4px 0; font-weight: bold; width: 140px;">Mã MOU:</td>
                                <td style="padding: 4px 0; color: #4a5568;">${mouCode}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-weight: bold;">Doanh nghiệp:</td>
                                <td style="padding: 4px 0; color: #4a5568;">${enterpriseName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-weight: bold;">Ngày hết hạn:</td>
                                <td style="padding: 4px 0; color: #e53e3e; font-weight: bold;">${formattedDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0; font-weight: bold;">Thời gian còn lại:</td>
                                <td style="padding: 4px 0; color: #dd6b20; font-weight: bold;">${daysLeft === 0 ? 'Đã hết hạn hôm nay' : `${daysLeft} ngày`}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p>Kính đề nghị Thầy/Cô liên hệ với đại diện doanh nghiệp để tiến hành các hoạt động rà soát, đánh giá hợp tác và thực hiện các thủ tục ký gia hạn hợp đồng MOU nếu cần thiết.</p>
                    
                    <div style="text-align: center; margin: 30px 0 10px 0;">
                        <a href="http://localhost:5173/mous" style="background-color: #DA251D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                            Xem chi tiết MOU trên hệ thống
                        </a>
                    </div>
                </div>
                <div style="background-color: #f7fafc; padding: 16px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0;">
                    Đây là email tự động từ Hệ thống Quản lý Doanh nghiệp & Hợp tác VLU. Vui lòng không trả lời trực tiếp email này.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Expiry email sent successfully: ${info.messageId} to ${managerEmail}`);
        return info;
    } catch (error) {
        console.error('[Email Service] Failed to send email:', error.message);
        throw error;
    }
}

module.exports = {
    transporter,
    sendExpiryWarningEmail
};
