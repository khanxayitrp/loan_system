import { db } from '../models/init-models';
import { Op, QueryTypes } from 'sequelize';

export class DashboardService {
    /**
     * ดึงข้อมูลสรุปทั้งหมดสำหรับ Admin Dashboard
     */
    async getAdminSummary() {
        // 1. ตั้งเวลาสำหรับ Query (เช่น ยอดของเดือนนี้)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // 2. รัน Query ทั้งหมดพร้อมกันด้วย Promise.all เพื่อลด Latency
        const [
            shopsCount,
            totalProducts,
            activeProducts,
            loanMetrics,
            topProductsOverall,
            topProductsMonth,
            demographics,
            topCustomers,
            monthlyComparison
        ] = await Promise.all([
            // Metric 1: จำนวนร้านค้าทั้งหมด
            db.partners.count({ where: { is_active: 1 } }),

            // Metric 2: สินค้าทั้งหมด
            db.products.count(),

            // Metric 3: สินค้าที่เปิดขาย (Active)
            db.products.count({ where: { is_active: 1 } }),

            // Metric 4-6: สถานะสินเชื่อต่างๆ
            this.getLoanMetrics(),

            // Chart 1: สินค้ายอดฮิต (ทั้งหมด)
            this.getTopProducts(),

            // Chart 2: สินค้ายอดฮิต (เฉพาะเดือนนี้)
            this.getTopProducts(startOfMonth),

            // Chart 3: สัดส่วนลูกค้าเก่า-ใหม่
            this.getCustomerDemographics(),

            // Table: ลูกค้ายอดเยี่ยม (อนุมัติแล้วมูลค่าสูงสุด)
            this.getTopCustomers(),

            this.getMonthlyLoanComparison() // Chart 4: เปรียบเทียบยอดสินเชื่อรายเดือน (6 เดือนล่าสุด)
        ]);

        return {
            metrics: {
                totalShops: shopsCount,
                totalProducts: totalProducts,
                activeProducts: activeProducts,
                totalRequests: loanMetrics.total,
                pendingRequests: loanMetrics.pending,
                completedLoans: loanMetrics.completed
            },
            charts: {
                topProductsOverall,
                topProductsMonth,
                demographics
            },
            topCustomers,
            monthlyComparison
        };
    }
    /**
   * ดึงข้อมูลสรุปสำหรับ Partner Dashboard (จำกัดข้อมูลเฉพาะร้านค้านั้นๆ)
   */
    async getPartnerSummary(partnerId: number) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
            productStats,
            topProductsMonth,
            topProductsOverall
        ] = await Promise.all([
            // 1. ภาพรวมสถิติสินค้าของร้านนี้
            this.getPartnerProductStats(partnerId),
            // 2. Top 5 สินค้าเดือนนี้ของร้าน
            this.getPartnerTopProducts(partnerId, 5, startOfMonth),
            // 3. Top 10 สินค้าทั้งหมดของร้าน พร้อมสถานะ
            this.getPartnerTopProducts(partnerId, 10, undefined, true)
        ]);

        return {
            overview: productStats,
            topMonthly: topProductsMonth,
            topOverall: topProductsOverall
        };
    }

    // ==========================================
    // Helper Methods สำหรับ Partner (ใช้วิธี Join เพื่อหาสินค้าของร้าน)
    // ==========================================
    private async getPartnerProductStats(partnerId: number) {
        const query = `
      SELECT
        COUNT(id) as total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_products
      FROM products
      WHERE partner_id = :partnerId;
    `;
        const result: any = await db.sequelize.query(query, {
            replacements: { partnerId },
            type: QueryTypes.SELECT
        });

        return {
            totalProducts: Number(result[0]?.total_products || 0),
            activeProducts: Number(result[0]?.active_products || 0),
            inactiveProducts: Number(result[0]?.inactive_products || 0)
        };
    }

    private async getPartnerTopProducts(partnerId: number, limit: number, startDate?: Date, includeStatus = false) {
        let dateFilter = '';
        const replacements: any = { partnerId, limit };

        if (startDate) {
            dateFilter = 'AND la.created_at >= :startDate';
            replacements.startDate = startDate;
        }

        // เลือก Field ตามที่ Component ต้องการ
        const statusField = includeStatus ? `, CASE WHEN p.is_active = 1 THEN 'เປີດ' ELSE 'ປິດ' END as status` : '';
        const brandField = !includeStatus ? `, p.brand` : '';

        const query = `
      SELECT 
        p.product_name as name
        ${brandField}
        ${statusField}, 
        COUNT(la.id) as count
      FROM loan_applications la
      JOIN products p ON la.product_id = p.id
      WHERE p.partner_id = :partnerId
      AND la.status NOT IN ('rejected', 'cancelled')
      ${dateFilter}
      GROUP BY p.id
      ORDER BY count DESC
      LIMIT :limit;
    `;

        return await db.sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });
    }

    // ==========================================
    // Helper Methods (Raw SQL for Performance)
    // ==========================================

    private async getLoanMetrics() {
        const metrics = await db.loan_applications.findAll({
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        let total = 0, pending = 0, completed = 0;
        metrics.forEach((m: any) => {
            const count = Number(m.count);
            total += count;
            if (['pending', 'verifying', 'verified'].includes(m.status)) pending += count;
            if (['disbursed', 'completed', 'closed_early'].includes(m.status)) completed += count;
        });

        return { total, pending, completed };
    }

    private async getTopProducts(startDate?: Date) {
        let dateFilter = '';
        const replacements: any = {};

        if (startDate) {
            dateFilter = 'AND la.created_at >= :startDate';
            replacements.startDate = startDate;
        }

        const query = `
      SELECT p.product_name as name, COUNT(la.id) as count
      FROM loan_applications la
      JOIN products p ON la.product_id = p.id
      WHERE la.status NOT IN ('rejected', 'cancelled') ${dateFilter}
      GROUP BY p.id
      ORDER BY count DESC
      LIMIT 10;
    `;

        return await db.sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });
    }

    private async getCustomerDemographics() {
        const query = `
      SELECT
        SUM(CASE WHEN loan_count = 1 THEN 1 ELSE 0 END) as new_customers,
        SUM(CASE WHEN loan_count > 1 THEN 1 ELSE 0 END) as repeat_customers
      FROM (
        SELECT customer_id, COUNT(id) as loan_count
        FROM loan_applications
        WHERE status NOT IN ('rejected', 'cancelled')
        GROUP BY customer_id
      ) as cust_stats;
    `;

        const result: any = await db.sequelize.query(query, { type: QueryTypes.SELECT });
        return {
            new: Number(result[0]?.new_customers || 0),
            repeat: Number(result[0]?.repeat_customers || 0)
        };
    }

    private async getTopCustomers() {
        const query = `
      SELECT 
        c.first_name, 
        c.last_name, 
        COUNT(la.id) as contract_count, 
        SUM(la.total_amount - la.down_payment) as total_amount
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      WHERE la.status IN ('disbursed', 'completed', 'closed_early')
      GROUP BY c.id
      ORDER BY total_amount DESC
      LIMIT 5;
    `;

        const customers: any[] = await db.sequelize.query(query, { type: QueryTypes.SELECT });

        // Format ให้ออกมาพร้อมโชว์ เช่น "120M LAK"
        return customers.map(c => ({
            name: `${c.first_name} ${c.last_name || ''}`.trim(),
            contracts: Number(c.contract_count),
            total: `${(Number(c.total_amount) / 1000000).toFixed(1)}M LAK`
        }));
    }
    // ==========================================
    // 🌟 ฟังก์ชันใหม่: ดึงข้อมูลเปรียบเทียบรายเดือน (ย้อนหลัง 6 เดือน)
    // ==========================================
    private async getMonthlyLoanComparison() {
        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS month_year,
                COUNT(id) AS total_requests,
                SUM(CASE WHEN status IN ('disbursed', 'completed', 'closed_early') THEN 1 ELSE 0 END) AS total_disbursed
            FROM loan_applications
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month_year DESC;
        `;

        const results: any[] = await db.sequelize.query(query, { type: QueryTypes.SELECT });

        // แปลงผลลัพธ์เป็น Number ให้ Frontend ใช้งานง่าย
        return results.map(row => ({
            month: row.month_year,
            requests: Number(row.total_requests || 0),
            disbursed: Number(row.total_disbursed || 0)
        }));
    }
}
