import { db } from '../models/init-models';
import { logger } from '../utils/logger';

class DocumentSignatureService {
    public async getSignatureByLoanID(loan_id: number): Promise<any> {
        const t = await db.sequelize.transaction();
        try {
            const signature = await db.document_signatures.findAll({
                where: { application_id: loan_id },
                transaction: t
            });
            await t.commit();
            return {
                success: true,
                data: signature,
                message: 'Signature retrieved successfully'
            };
        } catch (error: any) {
            await t.rollback();
            logger.error(`Error getting signature by loan ID: ${(error as Error).message}`);
            throw error;
        }
    }

}

export default new DocumentSignatureService()