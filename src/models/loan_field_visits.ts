import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface loan_field_visitsAttributes {
  id: number;
  application_id: number;
  visit_type: 'home' | 'workplace' | 'other';
  visit_date: Date;
  latitude?: number;
  longitude?: number;
  living_condition?: string;
  is_address_correct?: number;
  photo_url_1?: string;
  photo_url_2?: string;
  remarks?: string;
  visited_by: number;
  created_at?: Date;
}

export type loan_field_visitsPk = "id";
export type loan_field_visitsId = loan_field_visits[loan_field_visitsPk];
export type loan_field_visitsOptionalAttributes = "id" | "latitude" | "longitude" | "living_condition" | "is_address_correct" | "photo_url_1" | "photo_url_2" | "remarks" | "created_at";
export type loan_field_visitsCreationAttributes = Optional<loan_field_visitsAttributes, loan_field_visitsOptionalAttributes>;

export class loan_field_visits extends Model<loan_field_visitsAttributes, loan_field_visitsCreationAttributes> implements loan_field_visitsAttributes {
  id!: number;
  application_id!: number;
  visit_type!: 'home' | 'workplace' | 'other';
  visit_date!: Date;
  latitude?: number;
  longitude?: number;
  living_condition?: string;
  is_address_correct?: number;
  photo_url_1?: string;
  photo_url_2?: string;
  remarks?: string;
  visited_by!: number;
  created_at?: Date;

  // loan_field_visits belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // loan_field_visits belongsTo users via visited_by
  visited_by_user!: users;
  getVisited_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setVisited_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createVisited_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_field_visits {
    return loan_field_visits.init({
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      application_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'loan_applications',
          key: 'id'
        }
      },
      visit_type: {
        type: DataTypes.ENUM('home', 'workplace', 'other'),
        allowNull: false
      },
      visit_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      living_condition: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_address_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 1
      },
      photo_url_1: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      photo_url_2: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      visited_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    }, {
      sequelize,
      tableName: 'loan_field_visits',
      timestamps: true,
      createdAt: 'created_at',  // Maps to your column name
      updatedAt: false,
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
          name: "visited_by",
          using: "BTREE",
          fields: [
            { name: "visited_by" },
          ]
        },
      ]
    });
  }
}
