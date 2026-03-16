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
exports.audit_logs = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class audit_logs extends sequelize_1.Model {
    static initModel(sequelize) {
        return audit_logs.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true
            },
            table_name: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                comment: "ชื่อตาราง เช่น loan_contract"
            },
            record_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                comment: "ID ของข้อมูลที่ถูกกระทำ"
            },
            action: {
                type: sequelize_1.DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
                allowNull: false,
                comment: "ประเภทการกระทำ"
            },
            old_values: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: "ข้อมูลเก่า (ก่อนแก้)"
            },
            new_values: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: "ข้อมูลใหม่ (หลังแก้)"
            },
            changed_columns: {
                type: sequelize_1.DataTypes.JSON,
                allowNull: true,
                comment: "รายชื่อคอลัมน์ที่ถูกเปลี่ยน"
            },
            performed_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                comment: "ID พนักงานที่ทำรายการ",
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            performed_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            },
            ip_address: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'audit_logs',
            timestamps: false,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "id" },
                    ]
                },
                {
                    name: "idx_table_record",
                    using: "BTREE",
                    fields: [
                        { name: "table_name" },
                        { name: "record_id" },
                    ]
                },
                {
                    name: "idx_performed_by",
                    using: "BTREE",
                    fields: [
                        { name: "performed_by" },
                    ]
                },
            ]
        });
    }
}
exports.audit_logs = audit_logs;
