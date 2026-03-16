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
exports.loan_cib_checks = void 0;
const Sequelize = __importStar(require("sequelize"));
const sequelize_1 = require("sequelize");
class loan_cib_checks extends sequelize_1.Model {
    static initModel(sequelize) {
        return loan_cib_checks.init({
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
                unique: "loan_cib_checks_ibfk_1"
            },
            cib_status: {
                type: sequelize_1.DataTypes.ENUM('no_delay', 'delay_30_days', 'delay_60_days', 'delay_90_days', 'blacklist'),
                allowNull: true,
                defaultValue: "no_delay"
            },
            is_existing_customer: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: 0
            },
            existing_customer_status: {
                type: sequelize_1.DataTypes.ENUM('normal', 'late_payment', 'bad_debt'),
                allowNull: true
            },
            cib_report_file: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            },
            remark: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true
            },
            checked_by: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            checked_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, {
            sequelize,
            tableName: 'loan_cib_checks',
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
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "application_id" },
                    ]
                },
                {
                    name: "checked_by",
                    using: "BTREE",
                    fields: [
                        { name: "checked_by" },
                    ]
                },
            ]
        });
    }
}
exports.loan_cib_checks = loan_cib_checks;
