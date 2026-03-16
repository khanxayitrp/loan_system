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
exports.payment_transactions = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class payment_transactions extends sequelize_1.Model {
    static initModel(sequelize) {
        return payment_transactions.init({
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
            schedule_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'repayments',
                    key: 'id'
                }
            },
            amount_paid: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            transaction_type: {
                type: sequelize_1.DataTypes.ENUM('installment', 'closing', 'penalty', 'other'),
                allowNull: true,
                defaultValue: "installment"
            },
            payment_channel: {
                type: sequelize_1.DataTypes.ENUM('mobile_app', 'cash_at_branch', 'bank_transfer', 'staff_collection'),
                allowNull: false
            },
            payment_method: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: true
            },
            proof_url: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            paid_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            },
            recorded_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'payment_transactions',
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
                    name: "schedule_id",
                    using: "BTREE",
                    fields: [
                        { name: "schedule_id" },
                    ]
                },
                {
                    name: "recorded_by",
                    using: "BTREE",
                    fields: [
                        { name: "recorded_by" },
                    ]
                },
            ]
        });
    }
}
exports.payment_transactions = payment_transactions;
