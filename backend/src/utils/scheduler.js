const cron = require('node-cron');
const pool = require('../config/db');
const { sendExpiryWarningEmail } = require('./emailService');

/**
 * Scan database for expiring MOUs and notify respective Faculty Managers
 */
async function checkMOUExpirations() {
    console.log('[Scheduler] Running MOU expiry check...');
    try {
        // Query MOUs that are active (not deleted), not yet notified, and expiring within 3 days.
        // DATEDIFF(end_date, CURRENT_DATE) yields the number of days left.
        // We look for 0 to 3 days remaining.
        const query = `
            SELECT m.id, m.mou_code, m.end_date, m.faculty_id, e.name as enterprise_name,
                   DATEDIFF(m.end_date, CURRENT_DATE) as days_left
            FROM mous m
            JOIN enterprises e ON m.enterprise_id = e.id
            WHERE m.is_deleted = 0 
              AND m.expiry_email_sent = 0 
              AND m.end_date IS NOT NULL
              AND DATEDIFF(m.end_date, CURRENT_DATE) <= 3 
              AND DATEDIFF(m.end_date, CURRENT_DATE) >= 0
        `;
        
        const [expiringMous] = await pool.query(query);
        console.log(`[Scheduler] Found ${expiringMous.length} expiring MOUs requiring notification.`);

        for (const mou of expiringMous) {
            const { id, mou_code, end_date, faculty_id, enterprise_name, days_left } = mou;
            
            // Find Faculty Manager for this faculty
            let [managers] = await pool.query(
                "SELECT email, full_name FROM users WHERE role = 'FACULTY_MANAGER' AND faculty_id = ?",
                [faculty_id]
            );

            // Fallback: If no Faculty Manager is configured, notify Admin
            if (managers.length === 0) {
                console.log(`[Scheduler] No Faculty Manager found for Faculty ID ${faculty_id}. Falling back to Admin.`);
                [managers] = await pool.query(
                    "SELECT email, full_name FROM users WHERE role = 'ADMIN' LIMIT 1"
                );
            }

            // Fallback email if still no users found
            const recipientEmail = managers.length > 0 ? managers[0].email : 'admin@vlu.edu.vn';
            const recipientName = managers.length > 0 ? managers[0].full_name : 'Quản trị viên Hệ thống';

            try {
                // Send email
                await sendExpiryWarningEmail(
                    recipientEmail,
                    recipientName,
                    mou_code,
                    enterprise_name,
                    end_date,
                    days_left
                );

                // Update database to mark email as sent
                await pool.query(
                    "UPDATE mous SET expiry_email_sent = 1 WHERE id = ?",
                    [id]
                );
                console.log(`[Scheduler] Successfully processed and marked MOU ${mou_code} as notified.`);
            } catch (err) {
                console.error(`[Scheduler] Failed to process notification for MOU ${mou_code}:`, err.message);
            }
        }
        
        console.log('[Scheduler] MOU expiry check completed.');
        return expiringMous.length;
    } catch (error) {
        console.error('[Scheduler] Error running MOU expiry check:', error.message);
        throw error;
    }
}

function initScheduler() {
    // Run daily at 08:00 AM (Vietnam time / Server local time)
    // Pattern: '0 8 * * *' (Minute 0, Hour 8, Day of Month *, Month *, Day of Week *)
    cron.schedule('0 8 * * *', () => {
        checkMOUExpirations().catch((err) => {
            console.error('[Scheduler] Error in cron job execution:', err.message);
        });
    });
    console.log('✔ [Scheduler] Automated daily cron job registered (08:00 AM daily).');
    
    // Execute a quick check on boot (after a short delay to allow database/SMTP startup)
    setTimeout(() => {
        console.log('[Scheduler] Executing boot-time MOU check...');
        checkMOUExpirations().catch((err) => {
            console.error('[Scheduler] Boot-time check failed:', err.message);
        });
    }, 5000);
}

module.exports = {
    initScheduler,
    checkMOUExpirations
};
