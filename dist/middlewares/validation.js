"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = void 0;
const validatePagination = (req, res, next) => {
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
exports.validatePagination = validatePagination;
