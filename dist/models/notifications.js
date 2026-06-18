"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class notifications extends sequelize_1.Model {
    static initModel(sequelize) {
        return notifications.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true
            },
            recipient_type: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                comment: "เช่น CUSTOMER, STAFF"
            },
            recipient_id: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                comment: "รหัสของลูกค้าหรือพนักงาน"
            },
            event_type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                comment: "เช่น LOAN_APPROVED, PAYMENT_REMINDER"
            },
            title: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                comment: "หัวข้อการแจ้งเตือน"
            },
            body: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                comment: "รายละเอียดการแจ้งเตือน"
            },
            reference_type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: "เช่น LoanContract, LoanApplication"
            },
            reference_id: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                comment: "รหัสของเอกสารที่อ้างอิง"
            },
            data: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: "ข้อมูลเพิ่มเติม เช่น สี, ไอคอน, ยอดเงิน"
            },
            read_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: "เวลาที่อ่าน (ถ้า NULL คือยังไม่ได้อ่าน)"
            },
            created_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, {
            sequelize,
            tableName: 'notifications',
            timestamps: true,
            updatedAt: false,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "id" },
                        { name: "created_at" },
                    ]
                },
                {
                    name: "idx_recipient_fetch",
                    using: "BTREE",
                    fields: [
                        { name: "recipient_type" },
                        { name: "recipient_id" },
                        { name: "created_at" },
                    ]
                },
                {
                    name: "idx_recipient_unread",
                    using: "BTREE",
                    fields: [
                        { name: "recipient_type" },
                        { name: "recipient_id" },
                        { name: "read_at" },
                    ]
                },
            ]
        });
    }
}
exports.notifications = notifications;
