import { Transaction } from 'sequelize';
import { db } from '../models/init-models'; // ປ່ຽນ path ໃຫ້ກົງກັບໂປຣເຈັກຂອງທ່ານ

type DocumentType = 'contract' | 'delivery_note' | 'repayment_schedule' | 'approval_summary';

/**
 * ຟັງຊັນສຳລັບສ້າງຊ່ອງລາຍເຊັນ (Pending Signatures) ອັດຕະໂນມັດ ເມື່ອສ້າງເອກະສານໃໝ່
 */
export const generateSignatureSlots = async (
    applicationId: number,
    documentType: DocumentType,
    referenceId: number, // ເຊັ່ນ ID ຂອງ contract ຫຼື ID ຂອງ delivery_note
    t: Transaction
): Promise<void> => {

    let requiredRoles: string[] = [];

    // 🟢 1. ກຳນົດວ່າເອກະສານໃດ ຕ້ອງມີໃຜເຊັນແດ່ (Business Logic ຢູ່ບ່ອນນີ້ບ່ອນດຽວ)
    switch (documentType) {
        case 'contract':
            // ສັນຍາເງິນກູ້: ລູກຄ້າ, ຄົນຄ້ຳ(ຖ້າມີ), ພະນັກງານ, ຜູ້ກວດກາ, ຜູ້ອະນຸມັດ
            requiredRoles = [
                'borrower',
                // 'guarantor', // ອາດຈະເພີ່ມເງື່ອນໄຂຖ້າສິນເຊື່ອນັ້ນມີຄົນຄ້ຳປະກັນ
                'credit_staff',
                'credit_head',
                'approver_2',
                'approver_3',
                'approver_1'
            ];
            break;

        case 'repayment_schedule':
            // ຕາຕະລາງຜ່ອນ: ລູກຄ້າ, ພະນັກງານສິນເຊື່ອ, ຜູ້ອະນຸມັດ
            requiredRoles = [
                'borrower',
                'credit_staff',
                'approver_1'
            ];
            break;

        case 'delivery_note':
            // ໃບມອບຮັບສິນຄ້າ: ລູກຄ້າ, ພະນັກງານຂາຍ (ຫຼື ຮ້ານຄ້າ), ນາຍບ້ານ(ຖ້າຕ້ອງການ)
            requiredRoles = [
                'borrower',
                'sales_staff',
                'partner_shop'
            ];
            break;

        case 'approval_summary':
            // ໃບສະຫຼຸບອະນຸມັດ: ພະນັກງານ, ຜູ້ກວດກາ, ຜູ້ອະນຸມັດ (ເຮົາຂຽນໄວ້ແລ້ວໃນ Controller)
            requiredRoles = [
                'credit_staff',
                'credit_head',
                // 'approver_2',
                // 'approver_3',
                'approver_1'
            ];
            break;

        default:
            throw new Error('ປະເພດເອກະສານບໍ່ຖືກຕ້ອງ');
    }

    // 🟢 2. ກຽມຂໍ້ມູນສຳລັບ Insert ລົງ Database
    const signatureData: any[] = requiredRoles.map(role => ({
        application_id: applicationId,
        document_type: documentType,
        reference_id: referenceId,
        role_type: role,
        status: 'pending' // 🌟 ສ້າງລໍຖ້າໄວ້ໃຫ້ສະຖານະເປັນ pending
    }));
    if (signatureData.length > 0) {
        await db.document_signatures.bulkCreate(signatureData, {
            transaction: t,
            ignoreDuplicates: true // 🌟 ເພີ່ມແຖວນີ້ເພື່ອບໍ່ໃຫ້ມັນ Error ຖ້າມີການກົດພິມຊ້ຳ (ມັນຈະຂ້າມໂຕທີ່ສ້າງແລ້ວໄປເລີຍ)
        });
    }
};