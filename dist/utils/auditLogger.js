"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const init_models_1 = require("../models/init-models"); // เช็ค Path ให้ตรงกับโปรเจกต์ของคุณ
const logger_1 = require("./logger"); // ถ้ามี logger ให้ import มาด้วย
/**
 * 🟢 Centralized Audit Log Helper
 * ใช้สำหรับบันทึกประวัติการเปลี่ยนแปลงข้อมูลของทุกตารางในระบบ
 */
const logAudit = async (tableName, recordId, action, oldValues, newValues, performedBy, t) => {
    try {
        let changedColumns = undefined;
        // ถ้าเป็นการอัปเดต ให้หาคอลัมน์ที่ถูกเปลี่ยนแปลง
        if (action === 'UPDATE' && oldValues && newValues) {
            const changes = [];
            for (const key in newValues) {
                // ข้ามฟิลด์ที่ไม่ได้ส่งมาอัปเดต และเปรียบเทียบค่า
                if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
                    changes.push(key);
                }
            }
            // ถ้าไม่มีอะไรเปลี่ยนแปลงเลย ไม่ต้องบันทึก Log
            if (changes.length === 0)
                return;
            changedColumns = changes;
        }
        const logOptions = t ? { transaction: t } : {};
        // บันทึกลงตาราง audit_logs
        await init_models_1.db.audit_logs.create({
            table_name: tableName,
            record_id: recordId,
            action: action,
            old_values: oldValues || undefined,
            new_values: newValues || undefined,
            changed_columns: changedColumns,
            performed_by: performedBy
        }, logOptions);
    }
    catch (error) {
        // แนะนำให้แค่ Log error แต่ไม่ต้อง Throw เพื่อไม่ให้ระบบหลักพังแค่เพราะเซฟ Log ไม่ผ่าน
        logger_1.logger.error(`❌ Failed to save Audit Log for ${tableName} (ID: ${recordId}):`, error);
    }
};
exports.logAudit = logAudit;
