import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import { AllowNull } from 'sequelize-typescript';

export interface loan_guarantorsAttributes {
  id: number;
  application_id: number;
  name: string;
  identity_number?: string;
  date_of_birth?: string;
  age?: number;
  phone?: string;
  address?: string;
  occupation?: string;
  relationship?: string;
  work_company_name?: string;
  work_phone?: string;
  work_location?: string;
  work_position?: string;
  work_salary?: number;
}

export type loan_guarantorsPk = "id";
export type loan_guarantorsId = loan_guarantors[loan_guarantorsPk];
export type loan_guarantorsOptionalAttributes = "id" | "identity_number" | "phone" | "address" | "occupation" | "relationship" | "work_company_name" | "work_position" | "work_salary";
export type loan_guarantorsCreationAttributes = Optional<loan_guarantorsAttributes, loan_guarantorsOptionalAttributes>;

export class loan_guarantors extends Model<loan_guarantorsAttributes, loan_guarantorsCreationAttributes> implements loan_guarantorsAttributes {
  id!: number;
  application_id!: number;
  name!: string;
  identity_number?: string;
  date_of_birth?: string;
  age?: number;
  phone?: string;
  address?: string;
  occupation?: string;
  relationship?: string;
  work_company_name?: string;
  work_phone?: string;
  work_location?: string;
  work_position?: string;
  work_salary?: number;

  // loan_guarantors belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;

  static initModel(sequelize: Sequelize.Sequelize): typeof loan_guarantors {
    return loan_guarantors.init({
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    identity_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    relationship: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    work_company_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    work_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    work_location: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    work_position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    work_salary: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'loan_guarantors',
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
    ]
  });
  }
}
