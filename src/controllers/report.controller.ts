import { Request, Response, NextFunction } from 'express';
import reportService from '../services/report.service';
import { BadRequestError } from '../utils/errors';

class ReportController {
    public async getDisbursedLoans(req: Request, res: Response, next: NextFunction) {
        try {
            // ຮັບຄ່າ Filter ຈາກ Query Parameters (ຖ້າມີ)
            const { startDate, endDate, search } = req.query;

            const filters = {
                startDate: startDate as string,
                endDate: endDate as string,
                search: search as string
            };

            const result = await reportService.getDisbursedLoansReport(filters);

            if (!result.success) {
                throw new BadRequestError(result.message);
            }

            return res.status(200).json(result);
        } catch (error) {
            next(error); // ສົ່ງ Error ໃຫ້ Global Error Handler
        }
    }
}

export default new ReportController();