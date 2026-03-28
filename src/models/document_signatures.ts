import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { loan_applications, loan_applicationsId } from './loan_applications';
import type { users, usersId } from './users';

export interface document_signaturesAttributes {
  id: number;
  application_id: number;
  document_type: 'contract' | 'delivery_note' | 'repayment_schedule' | 'approval_summary';
  reference_id: number;
  role_type: 'borrower' | 'guarantor' | 'sales_staff' | 'credit_staff' | 'credit_head' | 'approver_1' | 'approver_2' | 'approver_3' | 'partner_shop' | 'village_chief';
  user_id?: number;
  signer_name?: string;
  status?: 'pending' | 'signed' | 'rejected';
  signed_at?: Date;
  signature_image_url?: string;
  remark?: string;
}

export type document_signaturesPk = "id";
export type document_signaturesId = document_signatures[document_signaturesPk];
export type document_signaturesOptionalAttributes = "id" | "user_id" | "signer_name" | "status" | "signed_at" | "signature_image_url" | "remark";
export type document_signaturesCreationAttributes = Optional<document_signaturesAttributes, document_signaturesOptionalAttributes>;

export class document_signatures extends Model<document_signaturesAttributes, document_signaturesCreationAttributes> implements document_signaturesAttributes {
  id!: number;
  application_id!: number;
  document_type!: 'contract' | 'delivery_note' | 'repayment_schedule' | 'approval_summary';
  reference_id!: number;
  role_type!: 'borrower' | 'guarantor' | 'sales_staff' | 'credit_staff' | 'credit_head' | 'approver_1' | 'approver_2' | 'approver_3' | 'partner_shop' | 'village_chief';
  user_id?: number;
  signer_name?: string;
  status?: 'pending' | 'signed' | 'rejected';
  signed_at?: Date;
  signature_image_url?: string;
  remark?: string;

  // document_signatures belongsTo loan_applications via application_id
  application!: loan_applications;
  getApplication!: Sequelize.BelongsToGetAssociationMixin<loan_applications>;
  setApplication!: Sequelize.BelongsToSetAssociationMixin<loan_applications, loan_applicationsId>;
  createApplication!: Sequelize.BelongsToCreateAssociationMixin<loan_applications>;
  // document_signatures belongsTo users via user_id
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof document_signatures {
    return document_signatures.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ອ້າງອີງໄປຫາໃບຄຳຂໍສິນເຊື່ອ",
      references: {
        model: 'loan_applications',
        key: 'id'
      }
    },
    document_type: {
      type: DataTypes.ENUM('contract','delivery_note','repayment_schedule','approval_summary'),
      allowNull: false
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID ຂອງເອກະສານນັ້ນໆ (ເຊັ່ນ id ຂອງ loan_contract ຫຼື delivery_receipts)"
    },
    role_type: {
      type: DataTypes.ENUM('borrower','guarantor','sales_staff','credit_staff','credit_head','approver_1','approver_2','approver_3','partner_shop','village_chief'),
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ຖ້າເປັນພະນັກງານໃນລະບົບ",
      references: {
        model: 'users',
        key: 'id'
      }
    },
    signer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "ຖ້າເປັນຄົນນອກ ເຊັ່ນ ລູກຄ້າ, ນາຍບ້ານ"
    },
    status: {
      type: DataTypes.ENUM('pending','signed','rejected'),
      allowNull: true,
      defaultValue: "pending"
    },
    signed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    signature_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'document_signatures',
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
        name: "unique_contract_role",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "document_type" },
          { name: "reference_id" },
          { name: "role_type" },
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
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
