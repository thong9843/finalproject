const pool = require('../config/db');

/**
 * Log an action (CREATE, UPDATE, DELETE, RESTORE) to the database history log.
 * @param {object} db - Database connection or pool. If null/undefined, uses the default pool.
 * @param {object} params - Parameters for logging
 * @param {string} params.actionType - 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
 * @param {string} params.entityType - 'ENTERPRISE', 'MOU', 'ACTIVITY', 'STUDENT'
 * @param {number} params.entityId - ID of the entity
 * @param {string} params.entityName - Name or title of the entity for display
 * @param {number} params.facultyId - Faculty ID the entity belongs to
 * @param {number} params.changedBy - User ID of the modifier
 * @param {object} [params.oldValue] - Object/array representing the old state
 * @param {object} [params.newValue] - Object/array representing the new state
 */
async function logAction(db, { actionType, entityType, entityId, entityName, facultyId, changedBy, oldValue, newValue }) {
    const conn = db || pool;
    try {
        const query = `
            INSERT INTO action_history (action_type, entity_type, entity_id, entity_name, faculty_id, changed_by, old_value, new_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const oldValStr = oldValue ? JSON.stringify(oldValue) : null;
        const newValStr = newValue ? JSON.stringify(newValue) : null;
        
        await conn.query(query, [
            actionType,
            entityType,
            entityId,
            entityName || 'Không xác định',
            facultyId || null,
            changedBy || null,
            oldValStr,
            newValStr
        ]);
    } catch (err) {
        console.error(`[HistoryHelper] Failed to log ${actionType} for ${entityType} ID ${entityId}:`, err);
    }
}

module.exports = {
    logAction,
    logCreate: (db, { entityType, entityId, entityName, facultyId, changedBy, newValue }) =>
        logAction(db, { actionType: 'CREATE', entityType, entityId, entityName, facultyId, changedBy, oldValue: null, newValue }),
    logUpdate: (db, { entityType, entityId, entityName, facultyId, changedBy, oldValue, newValue }) =>
        logAction(db, { actionType: 'UPDATE', entityType, entityId, entityName, facultyId, changedBy, oldValue, newValue }),
    logDelete: (db, { entityType, entityId, entityName, facultyId, changedBy, oldValue }) =>
        logAction(db, { actionType: 'DELETE', entityType, entityId, entityName, facultyId, changedBy, oldValue, newValue: null }),
    logRestore: (db, { entityType, entityId, entityName, facultyId, changedBy, newValue }) =>
        logAction(db, { actionType: 'RESTORE', entityType, entityId, entityName, facultyId, changedBy, oldValue: null, newValue })
};
