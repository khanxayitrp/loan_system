import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { membership_applications, membership_applicationsId } from './membership_applications';
import type { membership_assessments, membership_assessmentsId } from './membership_assessments';
import type { users, usersId } from './users';

export interface membership_application_versionsAttributes {
  id: number;
  membership_application_id: number;
  version_no: number;
  customer_snapshot_json: object;
  employment_snapshot_json?: object;
  financial_snapshot_json?: object;
  credit_request_snapshot_json: object;
  snapshot_hash?: string;
  created_by?: number;
  created_at: Date;
}

export type membership_application_versionsPk = "id";
export type membership_application_versionsId = membership_application_versions[membership_application_versionsPk];
export type membership_application_versionsOptionalAttributes = "id" | "employment_snapshot_json" | "financial_snapshot_json" | "snapshot_hash" | "created_by" | "created_at";
export type membership_application_versionsCreationAttributes = Optional<membership_application_versionsAttributes, membership_application_versionsOptionalAttributes>;

export class membership_application_versions extends Model<membership_application_versionsAttributes, membership_application_versionsCreationAttributes> implements membership_application_versionsAttributes {
  id!: number;
  membership_application_id!: number;
  version_no!: number;
  customer_snapshot_json!: object;
  employment_snapshot_json?: object;
  financial_snapshot_json?: object;
  credit_request_snapshot_json!: object;
  snapshot_hash?: string;
  created_by?: number;
  created_at!: Date;

  // membership_application_versions hasMany membership_assessments via application_version_id
  membership_assessments!: membership_assessments[];
  getMembership_assessments!: Sequelize.HasManyGetAssociationsMixin<membership_assessments>;
  setMembership_assessments!: Sequelize.HasManySetAssociationsMixin<membership_assessments, membership_assessmentsId>;
  addMembership_assessment!: Sequelize.HasManyAddAssociationMixin<membership_assessments, membership_assessmentsId>;
  addMembership_assessments!: Sequelize.HasManyAddAssociationsMixin<membership_assessments, membership_assessmentsId>;
  createMembership_assessment!: Sequelize.HasManyCreateAssociationMixin<membership_assessments>;
  removeMembership_assessment!: Sequelize.HasManyRemoveAssociationMixin<membership_assessments, membership_assessmentsId>;
  removeMembership_assessments!: Sequelize.HasManyRemoveAssociationsMixin<membership_assessments, membership_assessmentsId>;
  hasMembership_assessment!: Sequelize.HasManyHasAssociationMixin<membership_assessments, membership_assessmentsId>;
  hasMembership_assessments!: Sequelize.HasManyHasAssociationsMixin<membership_assessments, membership_assessmentsId>;
  countMembership_assessments!: Sequelize.HasManyCountAssociationsMixin;
  // membership_application_versions belongsTo membership_applications via membership_application_id
  membership_application!: membership_applications;
  getMembership_application!: Sequelize.BelongsToGetAssociationMixin<membership_applications>;
  setMembership_application!: Sequelize.BelongsToSetAssociationMixin<membership_applications, membership_applicationsId>;
  createMembership_application!: Sequelize.BelongsToCreateAssociationMixin<membership_applications>;
  // membership_application_versions belongsTo users via created_by
  created_by_user!: users;
  getCreated_by_user!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreated_by_user!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreated_by_user!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof membership_application_versions {
    return membership_application_versions.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    membership_application_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'membership_applications',
        key: 'id'
      }
    },
    version_no: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_snapshot_json: {
      type: DataTypes.JSON,
      allowNull: false
    },
    employment_snapshot_json: {
      type: DataTypes.JSON,
      allowNull: true
    },
    financial_snapshot_json: {
      type: DataTypes.JSON,
      allowNull: true
    },
    credit_request_snapshot_json: {
      type: DataTypes.JSON,
      allowNull: false
    },
    snapshot_hash: {
      type: DataTypes.CHAR(64),
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 🌟 ເພີ່ມ 2 ຟິວນີ້ເຂົ້າໄປກ່ອນປິດວົງເລັບ
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
  }, {
    sequelize,
    tableName: 'membership_application_versions',
    timestamps: true,
    createdAt: 'created_at', // ບອກໃຫ້ Sequelize ຮູ້ຊື່ຄໍລຳຈິງ
    // 🌟 ເພີ່ມແຖວນີ້ເຂົ້າໄປສຳຄັນທີ່ສຸດ (ແກ້ Error) 🌟
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
        name: "uk_mav_app_version",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "membership_application_id" },
          { name: "version_no" },
        ]
      },
      {
        name: "idx_mav_hash",
        using: "BTREE",
        fields: [
          { name: "snapshot_hash" },
        ]
      },
      {
        name: "fk_mav_created_by",
        using: "BTREE",
        fields: [
          { name: "created_by" },
        ]
      },
    ]
  });
  }
}
