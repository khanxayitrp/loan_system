import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface notificationsAttributes {
  id: number;
  recipient_type: string;
  recipient_id: number;
  event_type: string;
  title: string;
  body: string;
  reference_type?: string;
  reference_id?: number;
  data?: object;
  read_at?: Date;
  created_at: Date;
}

export type notificationsPk = "id" | "created_at";
export type notificationsId = notifications[notificationsPk];
export type notificationsOptionalAttributes = "id" | "reference_type" | "reference_id" | "data" | "read_at" | "created_at";
export type notificationsCreationAttributes = Optional<notificationsAttributes, notificationsOptionalAttributes>;

export class notifications extends Model<notificationsAttributes, notificationsCreationAttributes> implements notificationsAttributes {
  id!: number;
  recipient_type!: string;
  recipient_id!: number;
  event_type!: string;
  title!: string;
  body!: string;
  reference_type?: string;
  reference_id?: number;
  data?: object;
  read_at?: Date;
  created_at!: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof notifications {
    return notifications.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    recipient_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "เช่น CUSTOMER, STAFF"
    },
    recipient_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "รหัสของลูกค้าหรือพนักงาน"
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "เช่น LOAN_APPROVED, PAYMENT_REMINDER"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "หัวข้อการแจ้งเตือน"
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "รายละเอียดการแจ้งเตือน"
    },
    reference_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "เช่น LoanContract, LoanApplication"
    },
    reference_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "รหัสของเอกสารที่อ้างอิง"
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "ข้อมูลเพิ่มเติม เช่น สี, ไอคอน, ยอดเงิน"
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "เวลาที่อ่าน (ถ้า NULL คือยังไม่ได้อ่าน)"
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
          { name: "created_at" },
        ]
      },
      {
        name: "idx_recipient_fetch",
        using: "BTREE",
        fields: [
          { name: "recipient_type" },
          { name: "recipient_id" },
          { name: "created_at" },
        ]
      },
      {
        name: "idx_recipient_unread",
        using: "BTREE",
        fields: [
          { name: "recipient_type" },
          { name: "recipient_id" },
          { name: "read_at" },
        ]
      },
    ]
  });
  }
}
