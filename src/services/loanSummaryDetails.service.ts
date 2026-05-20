import { db } from '../models/init-models'; // ปรับ path ตามโปรเจกต์ของคุณ
import { Op } from 'sequelize';

export const getCustomerLoanSummary = async (customerId: number) => {
    // 1. ดึงข้อมูลสินเชื่อทั้งหมดของลูกค้าที่กำลังผ่อน และผ่อนจบแล้ว
    const loans = await db.loan_applications.findAll({
        where: {
            customer_id: customerId,
            status: {
                [Op.in]: ['disbursed', 'completed', 'closed_early']
            }
        },
        include: [
            {
                model: db.products,
                as: 'product',
                attributes: ['product_name'], // ดึงชื่อสินค้า
                include: [
                    {
                        model: db.partners,
                        as: 'partner', // ดึงข้อมูลร้านค้า
                        attributes: ['shop_name']
                    }
                ]
            },
            {
                model: db.repayments,
                as: 'repayments', // 🟢 ดึงตารางงวดชำระโดยตรง
                required: false,
                attributes: [
                    'id', 'installment_no', 'due_date', 'total_due', 
                    'payment_status', 'paid_principal', 'paid_interest', 'paid_penalty'
                ]
            }
        ],
        order: [['created_at', 'DESC']]
    });

    let totalActiveLoans = 0;
    let totalMonthlyPay = 0;
    const activeLoans: any[] = [];
    const completedLoans: any[] = [];
    const loanDetails: any[] = [];

    // 2. ลูปคำนวณข้อมูลทีละรายการ
    for (const loan of loans) {
        // แปลงเป็น JSON เพื่อให้อ่านง่าย
        const loanData = loan.toJSON() as any; 
        const repayments = loanData.repayments || [];

        // เรียงงวดจากน้อยไปมาก (งวดที่ 1, 2, 3...)
        repayments.sort((a: any, b: any) => a.installment_no - b.installment_no);

        const totalInstallments = loanData.loan_period;
        let paidInstallments = 0;
        let remainingBalance = 0;
        let nextDueDate = null;

        for (const rep of repayments) {
            if (rep.payment_status === 'paid') {
                paidInstallments++;
            } else {
                // คำนวณยอดที่ยังค้างชำระในงวดนั้นๆ
                const paidAmount = Number(rep.paid_principal) + Number(rep.paid_interest) + Number(rep.paid_penalty);
                const dueAmount = Number(rep.total_due);
                remainingBalance += (dueAmount - paidAmount);

                // หาวันดิวของงวดถัดไปที่ยังไม่จ่าย
                if (!nextDueDate && ['unpaid', 'partial', 'overdue'].includes(rep.payment_status)) {
                    nextDueDate = rep.due_date;
                }
            }
        }

        // จัดเตรียมข้อมูลส่งกลับ
        const mappedLoan = {
            loan_id: loanData.id,
            loan_number: loanData.loan_id,
            product_name: loanData.product?.product_name || 'ບໍ່ລະບຸສິນຄ້າ',
            shop_name: loanData.product?.partner?.shop_name || 'ບໍ່ລະບຸຮ້ານຄ້າ', // 🟢 ได้ชื่อร้านของจริงแล้ว!
            total_amount: loanData.total_amount,
            monthly_pay: loanData.monthly_pay,
            total_installments: totalInstallments,
            paid_installments: paidInstallments,
            months_left: totalInstallments - paidInstallments,
            remaining_balance: remainingBalance,
            next_due_date: nextDueDate,
            status: loanData.status
        };

        if (loanData.status === 'disbursed') {
            activeLoans.push(mappedLoan);
            totalActiveLoans++;
            totalMonthlyPay += Number(loanData.monthly_pay);
        } else {
            completedLoans.push(mappedLoan);
        }
        loanDetails.push(mappedLoan);
    }

    // 3. ส่งข้อมูลกลับ
    return {
        summary: {
            active_count: totalActiveLoans,
            total_monthly_pay: totalMonthlyPay
        },
        // active_loans: activeLoans,
        // completed_loans: completedLoans

        details: loanDetails
    };
};

export const getLoanInstallmentDetails = async (loanId: number) => {
    // 1. ดึงข้อมูลสินเชื่อ พร้อมตารางค่างวด
    const loan = await db.loan_applications.findOne({
        where: { id: loanId },
        include: [
            {
                model: db.products,
                as: 'product',
                attributes: ['product_name']
            },
            {
                model: db.repayments,
                as: 'repayments',
                attributes: [
                    'id', 'installment_no', 'due_date', 'total_due',
                    'payment_status', 'paid_principal', 'paid_interest', 'paid_penalty'
                ]
            }
        ]
    });

    if (!loan) throw new Error('ບໍ່ພົບຂໍ້ມູນສິນເຊື່ອ (Loan not found)');

    const loanData = loan.toJSON() as any;
    const repayments = loanData.repayments || [];
    
    // เรียงลำดับงวดจากน้อยไปมาก (1, 2, 3...)
    repayments.sort((a: any, b: any) => a.installment_no - b.installment_no);

    let totalAmount = 0; // ยอดรวมทั้งหมดของตารางผ่อน
    let totalPaid = 0;   // จ่ายไปแล้วทั้งหมด
    let paidInstallmentsCount = 0; // จำนวนงวดที่จ่ายแล้ว

    // 2. คำนวณยอดรวมต่างๆ
    repayments.forEach((rep: any) => {
        totalAmount += Number(rep.total_due);
        
        // ยอดที่จ่ายไปแล้วในงวดนี้ (ต้น + ดอก + ปรับ)
        const paidForThisInstallment = Number(rep.paid_principal) + Number(rep.paid_interest) + Number(rep.paid_penalty);
        totalPaid += paidForThisInstallment;

        if (rep.payment_status === 'paid') {
            paidInstallmentsCount++;
        }
    });

    const totalRemaining = totalAmount - totalPaid;

    // 3. จัดเตรียมข้อมูลตารางผ่อนรายงวด
    let isCurrentFound = false; // ตัวแปรเช็คว่าเจองวดปัจจุบันหรือยัง
    let runningBalance = totalAmount; // ยอดหนี้คงเหลือที่ค่อยๆ ลดลงทีละงวด

    const installmentsList = repayments.map((rep: any) => {
        let uiStatus = 'pending'; // สถานะสำหรับ UI: 'paid' (จ่ายแล้ว), 'current' (งวดปัจจุบัน), 'pending' (งวดถัดๆ ไป)

        if (rep.payment_status === 'paid') {
            uiStatus = 'paid';
        } else if (!isCurrentFound && ['unpaid', 'partial', 'overdue'].includes(rep.payment_status)) {
            // ถ้างวดยังไม่จ่าย และยังไม่เคยเจองวดปัจจุบันมาก่อน -> ให้งวดนี้เป็น "งวดปัจจุบัน"
            uiStatus = 'current';
            isCurrentFound = true;
        }

        // ยอดคงเหลือหลังจากจ่ายงวดนี้ (สำหรับโชว์คำว่า "ຄົງເຫຼືອ K X,XXX,XXX")
        runningBalance -= Number(rep.total_due);

        return {
            id: rep.id,
            installment_no: rep.installment_no,
            due_date: rep.due_date,
            amount_due: Number(rep.total_due), // ยอดที่ต้องจ่ายงวดนี้
            balance_after_payment: Math.max(0, runningBalance), // ยอดคงเหลือหลังหักงวดนี้
            status: uiStatus, // 'paid', 'current', 'pending'
            db_status: rep.payment_status // สถานะจริงใน Database เผื่อต้องใช้
        };
    });

    // 4. ส่งข้อมูลกลับให้ Controller
    return {
        header: {
            loan_id: loanData.loan_id,
            product_name: loanData.product?.product_name || 'ບໍ່ລະບຸ',
            progress: {
                current: paidInstallmentsCount,
                total: loanData.loan_period
            },
            summary_amounts: {
                total_amount: totalAmount,       // ยอดลวม
                total_paid: totalPaid,           // จ่ายแล้ว
                total_remaining: totalRemaining  // ยอดคงเหลือ
            }
        },
        installments: installmentsList // ตารางจำระค่างวด
    };
};