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
exports.loan_income_assessments = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class loan_income_assessments extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_income_assessments.init({
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
                },
                unique: "loan_income_assessments_ibfk_1"
            },
            assessed_date: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            },
            average_monthly_income: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            other_verified_income: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            total_verified_income: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            estimated_living_expenses: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            existing_debt_payments: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            proposed_installment: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: false
            },
            dsr_percentage: {
                type: sequelize_1.DataTypes.DECIMAL(5, 2),
                allowNull: false
            },
            max_approved_amount: {
                type: sequelize_1.DataTypes.DECIMAL(15, 2),
                allowNull: true
            },
            remarks: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            assessed_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            }
        }, {
            sequelize,
            tableName: 'loan_income_assessments',
            timestamps: true,
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
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
                {
                    name: "assessed_by",
                    using: "BTREE",
                    fields: [
                        { name: "assessed_by" },
                    ]
                },
            ]
        });
    }
}
exports.loan_income_assessments = loan_income_assessments;
