import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { repayments, repaymentsId } from './repayments';
import type { users, usersId } from './users';

export interface repayment_schedulesAttributes {
  id: number;
  application_id: number;
  version?: number;
  total_principal: number;
  total_interest: number;
  status?: 'draft' | 'approved' | 'cancelled' | 'restructured';
  approved_by?: number;
  approved_at?: Date;
  pdf_url?: string;
  created_by: number;
  created_at?: Date;
}

export type repayment_schedulesPk = "id";
export type repayment_schedulesId = repayment_schedules[repayment_schedulesPk];
export type repayment_schedulesOptionalAttributes = "id" | "version" | "status" | "approved_by" | "approved_at" | "pdf_url" | "created_at";
export type repayment_schedulesCreationAttributes = Optional<repayment_schedulesAttributes, repayment_schedulesOptionalAttributes>;

export class repayment_schedules extends Model<repayment_schedulesAttributes, repayment_schedulesCreationAttributes> implements repayment_schedulesAttributes {
  id!: number;
  application_id!: number;
  version?: number;
  total_principal!: number;
  total_interest!: number;
  status?: 'draft' | 'approved' | 'cancelled' | 'restructured';
  approved_by?: number;
  approved_at?: Date;
  pdf_url?: string;
  created_by!: number;
  created_at?: Date;

  // repayment_schedules belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // repayment_schedules hasMany repayments via schedule_id
  repayments!: repayments[];
  getRepayments!: Sequelize.HasManyGetAssociationsMixin<repayments>;
  setRepayments!: Sequelize.HasManySetAssociationsMixin<repayments, repaymentsId>;
  addRepayment!: Sequelize.HasManyAddAssociationMixin<repayments, repaymentsId>;
  addRepayments!: Sequelize.HasManyAddAssociationsMixin<repayments, repaymentsId>;
  createRepayment!: Sequelize.HasManyCreateAssociationMixin<repayments>;
  removeRepayment!: Sequelize.HasManyRemoveAssociationMixin<repayments, repaymentsId>;
  removeRepayments!: Sequelize.HasManyRemoveAssociationsMixin<repayments, repaymentsId>;
  hasRepayment!: Sequelize.HasManyHasAssociationMixin<repayments, repaymentsId>;
  hasRepayments!: Sequelize.HasManyHasAssociationsMixin<repayments, repaymentsId>;
  countRepayments!: Sequelize.HasManyCountAssociationsMixin;
  // repayment_schedules belongsTo users via approved_by
  approved_by_user!: users;
  getApproved_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setApproved_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createApproved_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // repayment_schedules belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof repayment_schedules {
    return repayment_schedules.init({
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
    version: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: "ເວີຊັ່ນຂອງຕາຕະລາງ (ຖ້າມີການ Re-structure ໜີ້ ຈະເພີ່ມຂຶ້ນ)"
    },
    total_principal: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    total_interest: {
      type: DataTypes.DECIMAL(15,2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft','approved','cancelled','restructured'),
      allowNull: true,
      defaultValue: "draft"
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ຜູ້ອະນຸມັດຕາຕະລາງ",
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pdf_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "ເກັບ Link ໄຟລ໌ PDF ທີ່ລູກຄ້າເຊັນແລ້ວ"
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'repayment_schedules',
    timestamps: true,
    createdAt: 'created_at',    // แมปชื่อให้ตรงกับใน DB
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
        name: "approved_by",
        using: "BTREE",
        fields: [
          { name: "approved_by" },
        ]
      },
      {
        name: "created_by",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
  }
}
