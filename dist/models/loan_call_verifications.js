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
exports.loan_call_verifications = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class loan_call_verifications extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_call_verifications.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            application_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'loan_applications',
                    key: 'id'
                }
            },
            call_target: {
                type: sequelize_1.DataTypes.ENUM('workplace', 'home', 'guarantor'),
                allowNull: false
            },
            contact_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            contact_phone: {
                type: sequelize_1.DataTypes.STRING(20),
                allowNull: true
            },
            relationship: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: true
            },
            is_info_matching: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            has_debt_history_known: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true
            },
            remark: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            call_status: {
                type: sequelize_1.DataTypes.ENUM('no_answer', 'pending_callback', 'completed'),
                allowNull: true,
                defaultValue: "completed"
            },
            called_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            called_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, {
            sequelize,
            tableName: 'loan_call_verifications',
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
                    name: "application_id",
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
                {
                    name: "called_by",
                    using: "BTREE",
                    fields: [
                        { name: "called_by" },
                    ]
                },
            ]
        });
    }
}
exports.loan_call_verifications = loan_call_verifications;
