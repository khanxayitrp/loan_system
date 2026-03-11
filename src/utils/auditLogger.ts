import { db } from '../models/init-models'; // เช็ค Path ให้ตรงกับโปรเจกต์ของคุณ
import { Transaction } from 'sequelize';
import { logger } from './logger'; // ถ้ามี logger ให้ import มาด้วย

/**
 * 🟢 Centralized Audit Log Helper
 * ใช้สำหรับบันทึกประวัติการเปลี่ยนแปลงข้อมูลของทุกตารางในระบบ
 */
export const logAudit = async (
    tableName: string,
    recordId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues: any,
    newValues: any,
    performedBy: number,
    t?: Transaction
): Promise<void> => {
    try {
        let changedColumns: any = undefined;

        // ถ้าเป็นการอัปเดต ให้หาคอลัมน์ที่ถูกเปลี่ยนแปลง
        if (action === 'UPDATE' && oldValues && newValues) {
            const changes: string[] = [];
            for (const key in newValues) {
                // ข้ามฟิลด์ที่ไม่ได้ส่งมาอัปเดต และเปรียบเทียบค่า
                if (newValues[key] !== undefined && oldValues[key] != newValues[key]) {
                    changes.push(key);
                }
            }
            // ถ้าไม่มีอะไรเปลี่ยนแปลงเลย ไม่ต้องบันทึก Log
            if (changes.length === 0) return;
            changedColumns = changes;
        }

        const logOptions = t ? { transaction: t } : {};

        // บันทึกลงตาราง audit_logs
        await db.audit_logs.create({
            table_name: tableName,
            record_id: recordId,
            action: action,
            old_values: oldValues || undefined,
            new_values: newValues || undefined,
            changed_columns: changedColumns,
            performed_by: performedBy
        }, logOptions);

    } catch (error) {
        // แนะนำให้แค่ Log error แต่ไม่ต้อง Throw เพื่อไม่ให้ระบบหลักพังแค่เพราะเซฟ Log ไม่ผ่าน
        logger.error(`❌ Failed to save Audit Log for ${tableName} (ID: ${recordId}):`, error);
    }
};