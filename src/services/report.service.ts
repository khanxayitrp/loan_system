import { db } from '../models/init-models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

class ReportService {
    public async getDisbursedLoansReport(filters: { startDate?: string, endDate?: string, search?: string }) {
        try {
            const whereClause: any = {
                status: 'disbursed'
            };

            const now = new Date();
            let start = filters.startDate;
            let end = filters.endDate;

            if (!start || !end) {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const formatYMD = (date: Date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                start = start || formatYMD(firstDay);
                end = end || formatYMD(lastDay);
            }

            whereClause.approved_at = {
                [Op.between]: [
                    `${start} 00:00:00`,
                    `${end} 23:59:59`
                ]
            };

            const loans = await db.loan_applications.findAll({
                where: whereClause,
                include: [
                    {
                        model: db.customers,
                        as: 'customer',
                        required: false,
                        // 🟢 ຂໍ້ສັງເກດ: ຕ້ອງລຶບ 'gender' ແລະ 'age' ອອກຈາກບ່ອນນີ້!
                        attributes: ['id', 'first_name', 'last_name', 'phone', 'address', 'date_of_birth'],
                        include: [
                            {
                                model: db.customer_work_info,
                                as: 'customer_work_infos',
                                required: false,
                                attributes: ['salary', 'duration_years']
                            }
                        ]
                    },
                    {
                        model: db.products,
                        as: 'product',
                        required: false,
                        attributes: ['id', 'productType_id', 'product_name']
                    },
                    {
                        model: db.users,
                        as: 'requester',
                        attributes: ['id', 'username', 'full_name'],
                        required: false
                    },
                    {
                        model: db.users,
                        as: 'approver',
                        attributes: ['id', 'username', 'full_name'],
                        required: false
                    },
                    {
                        model: db.repayments,
                        as: 'repayments',
                        attributes: ['installment_no', 'due_date'],
                        required: false,
                        where: { installment_no: 1 },
                        limit: 1
                    },
                    {
                        model: db.loan_contract,
                        as: 'loan_contracts',
                        required: false,
                        // 🟢 ດຶງເອົາ ເລກທີ່ສັນຍາ ແລະ ເພດ ມາຈາກຕາຕະລາງນີ້ແທນ
                        attributes: ['loan_contract_number', 'cus_sex']
                    }
                ],
                order: [['approved_at', 'DESC']]
            });

            return {
                success: true,
                message: 'ດຶງຂໍ້ມູນລາຍງານສຳເລັດ',
                data: loans,
                meta: { date_range: { start, end } }
            };
        } catch (error: any) {
            console.error('❌ Error in getDisbursedLoansReport:', error);
            logger.error('Error in getDisbursedLoansReport:', error);
            throw new Error(`ບໍ່ສາມາດດຶງຂໍ້ມູນລາຍງານໄດ້: ${error.message}`);
        }
    }
}

export default new ReportService();