import { db } from '../models/init-models';
import { Op } from 'sequelize';

export class MembershipApplicationRepo {
  
  // 🟢 1. ดึงรายการใบคำขอทั้งหมด (รองรับ ค้นหา, กรองสถานะ, และ Cursor Pagination)
  async findAllApplications(
    filters: { search?: string, status?: string },
    options: { limit: number, cursor?: number }
  ) {
    const whereClause: any = {};
    const customerWhereClause: any = {};

    // กรองสถานะ (เช่น SUBMITTED, ASSESSING, APPROVED)
    if (filters.status) {
      whereClause.status = filters.status;
    }

    // Cursor Pagination (ดึง ID ที่น้อยกว่าค่า Cursor เพราะเรียงจากใหม่ไปเก่า DESC)
    if (options.cursor) {
      whereClause.id = { [Op.lt]: options.cursor };
    }

    // ระบบค้นหา (จากเลขที่ใบคำขอ หรือ ข้อมูลลูกค้า)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      whereClause[Op.or] = [
        { application_no: { [Op.like]: searchTerm } },
        { '$customer.first_name$': { [Op.like]: searchTerm } },
        { '$customer.last_name$': { [Op.like]: searchTerm } },
        { '$customer.phone$': { [Op.like]: searchTerm } },
        { '$customer.identity_number$': { [Op.like]: searchTerm } }
      ];
    }

    const applications = await db.membership_applications.findAll({
      where: whereClause,
      include: [
        {
          model: db.customers,
          as: 'customer', // ⚠️ ໃຫ້ແນ່ໃຈວ່າ Model ຂອງທ່ານຕັ້ງ alias ນີ້ໄວ້
          attributes: ['id', 'first_name', 'last_name', 'phone', 'identity_number', 'kyc_status', 'profile_image_url']
        },
        {
          model: db.membership_credit_purposes,
          as: 'purpose',
          attributes: ['purpose_name']
        }
      ],
      limit: options.limit,
      order: [['id', 'DESC']], // ລຽງລຳດັບໃບຄຳຂໍໃໝ່ຫຼ້າສຸດຂຶ້ນກ່ອນ
    });

    const count = await db.membership_applications.count({ where: whereClause });

    return { rows: applications, count };
  }

  // 🟢 2. ดึงรายละเอียดแบบเจาะลึก (รวม Customer, Work Info และ Snapshot)
  async findApplicationById(id: number) {
    return await db.membership_applications.findByPk(id, {
      include: [
        {
          model: db.customers,
          as: 'customer',
          include: [
            {
              // 🌟 เพิ่มการดึงข้อมูลการทำงานเข้ามา
              model: db.customer_work_info,
              as: 'customer_work_infos', // ⚠️ Check Alias in your models/init-models.ts (อาจเป็น customer_work_info ไม่มี s)
            }
          ]
        },
        {
          // ดึง Snapshot
          model: db.membership_application_versions,
          as: 'membership_application_versions', // ⚠️ Check Alias
          order: [['version_no', 'DESC']],
        },
        {
          model: db.membership_credit_purposes,
          as: 'purpose', // ⚠️ Check Alias
          attributes: ['purpose_name']
        }
      ]
    });
  }

  // 🟢 3. ดึงใบคำขอล่าสุดของลูกค้า (ค้นหาจาก Customer ID)
  async findLatestApplicationByCustomerId(customerId: number) {
    return await db.membership_applications.findOne({
      where: { customer_id: customerId },
      order: [['id', 'DESC']], // ເອົາໃບຄຳຂໍຫຼ້າສຸດ (Latest)
      include: [
        {
          model: db.customers,
          as: 'customer',
          include: [
            {
              model: db.customer_work_info,
              as: 'customer_work_infos',
            }
          ]
        },
        {
          model: db.membership_application_versions,
          as: 'membership_application_versions',
          order: [['version_no', 'DESC']],
        },
        {
          model: db.membership_credit_purposes,
          as: 'purpose',
          attributes: ['purpose_name']
        }
      ]
    });
  }
}

export default new MembershipApplicationRepo();