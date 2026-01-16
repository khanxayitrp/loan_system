// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({ 
      error: 'Page must be a positive number' 
    });
  }
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return res.status(400).json({ 
      error: 'Limit must be a number between 1 and 100' 
    });
  }
  
  next();
};