"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.features = void 0;
const sequelize_1 = require("sequelize");
class features extends sequelize_1.Model {
    static initModel(sequelize) {
        return features.init({
            id: {
                autoIncrement: true,
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            feature_name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                unique: "feature_name"
            },
            description: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: true
            }
        }, {
            sequelize,
            tableName: 'features',
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
                    name: "feature_name",
                    unique: true,
                    using: "BTREE",
                    fields: [
                        { name: "feature_name" },
                    ]
                },
            ]
        });
    }
}
exports.features = features;
