import { Request, Response, NextFunction } from 'express';
import { creditPurposeService } from '../services/credit-purpose.service';
import { BadRequestError } from '../utils/errors';

export const getPurposes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.all !== 'true'; // ?all=true ສຳລັບດຶງທັງໝົດ
    const purposes = await creditPurposeService.getPurposes(activeOnly);
    
    res.status(200).json({ success: true, data: purposes });
  } catch (error) { next(error); }
};

export const createPurpose = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { purpose_code, purpose_name, description, sort_order } = req.body;
    if (!purpose_code || !purpose_name) throw new BadRequestError('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (Missing required fields)');

    const purpose = await creditPurposeService.createPurpose({ 
      purpose_code, 
      purpose_name, 
      description, 
      sort_order: sort_order !== undefined ? Number(sort_order) : 0 
    });
    
    res.status(201).json({ success: true, message: 'ສ້າງສຳເລັດ', data: purpose });
  } catch (error) { next(error); }
};

export const updatePurpose = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { purpose_code, purpose_name, description, sort_order } = req.body;
    if (!purpose_code || !purpose_name) throw new BadRequestError('ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (Missing required fields)');

    const purpose = await creditPurposeService.updatePurpose(id, { 
      purpose_code, 
      purpose_name, 
      description, 
      sort_order: sort_order !== undefined ? Number(sort_order) : undefined 
    });
    
    res.status(200).json({ success: true, message: 'ແກ້ໄຂສຳເລັດ', data: purpose });
  } catch (error) { next(error); }
};

export const togglePurposeStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body;
    
    if (is_active === undefined) throw new BadRequestError('ກະລຸນາລະບຸສະຖານະ (Missing is_active flag)');

    const purpose = await creditPurposeService.toggleStatus(id, Boolean(is_active));
    res.status(200).json({ success: true, message: 'ປ່ຽນສະຖານະສຳເລັດ', data: purpose });
  } catch (error) { next(error); }
};