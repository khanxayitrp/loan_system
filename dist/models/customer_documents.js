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
exports.customer_documents = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class customer_documents extends sequelize_1.Model {
    static initModel(sequelize) {
        return customer_documents.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            customer_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            file_url: {
                type: sequelize_1.DataTypes.STRING(1000),
                allowNull: false
            },
            original_filename: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            file_size: {
                type: sequelize_1.DataTypes.BIGINT,
                allowNull: true,
                comment: "ขนาดไฟล์ (bytes)"
            },
            mime_type: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true,
                comment: "เช่น image/jpeg, application/pdf"
            },
            doc_type: {
                type: sequelize_1.DataTypes.ENUM('id_card', 'house_reg', 'salary_slip', 'face_scan', 'other'),
                allowNull: false,
                defaultValue: "other"
            },
            uploaded_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            },
            expires_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true
            },
            uploaded_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: "user_id ที่ upload",
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'customer_documents',
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
                    name: "cust_docs_ibfk_1",
                    using: "BTREE",
                    fields: [
                        { name: "customer_id" },
                    ]
                },
                {
                    // 🟢 เพิ่ม Index สำหรับ FK ใหม่
                    name: "fk_customer_docs_uploaded_by",
                    using: "BTREE",
                    fields: [
                        { name: "uploaded_by" },
                    ]
                },
            ]
        });
    }
}
exports.customer_documents = customer_documents;
