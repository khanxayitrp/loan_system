import { Request, Response, NextFunction } from 'express';
import CustomerLocationService from '../services/customer_location.service';

// 👉 1. Import Custom Errors
import { BadRequestError, NotFoundError } from '../utils/errors';

/**
 * ✅ สร้าง Location ใหม่
 * POST /api/customer-locations/:customerId/locations
 */
export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customerId = parseInt(req.params.customerId);

        if (!customerId || isNaN(customerId)) {
            throw new BadRequestError('customer_id ບໍ່ຖືກຕ້ອງ');
        }

        const { location_type, address, latitude, longitude, is_primary } = req.body;

        // ✅ ตรวจสอบ location_type
        if (!location_type || !['home', 'work', 'other'].includes(location_type)) {
            throw new BadRequestError('location_type ต้องเป็น home, work, หรือ other');
        }

        // ✅ ตรวจสอบ address
        if (!address || address.trim() === '') {
            throw new BadRequestError('address ເປັນຂໍ້ມູນທີ່ຈຳເປັນ');
        }

        // ✅ แปลง is_primary เป็น number (0 หรือ 1)
        let primaryValue: number = 0;
        if (is_primary !== undefined && is_primary !== null) {
            primaryValue = is_primary === 1 || is_primary === true || is_primary === '1' ? 1 : 0;
        }

        const locationData: any = {
            customer_id: customerId,
            location_type,
            address: address.trim(),
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            is_primary: primaryValue
        };

        const result = await CustomerLocationService.createLocation(locationData);

        return res.status(201).json({
            success: true,
            message: 'ສ້າງທີ່ຢู่ສຳເລັດ',
            data: result
        });
    } catch (error) {
        next(error); // 👉 โยนให้ Global Error Handler จัดการ
    }
};

/**
 * ✅ อัปเดต Location
 * PUT /api/customer-locations/:id
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);

        if (!id || isNaN(id)) {
            throw new BadRequestError('location_id ບໍ່ຖືກຕ້ອງ');
        }

        const { address, latitude, longitude, is_primary, location_type } = req.body;
        const updateData: any = {};

        if (address !== undefined) {
            updateData.address = address.trim();
        }

        if (latitude !== undefined) {
            updateData.latitude = latitude ? parseFloat(latitude) : null;
        }

        if (longitude !== undefined) {
            updateData.longitude = longitude ? parseFloat(longitude) : null;
        }

        if (location_type !== undefined) {
            if (!['home', 'work', 'other'].includes(location_type)) {
                throw new BadRequestError('location_type ต้องเป็น home, work, หรือ other');
            }
            updateData.location_type = location_type;
        }

        // ✅ แปลง is_primary เป็น number (0 หรือ 1)
        if (is_primary !== undefined) {
            updateData.is_primary = is_primary === 1 || is_primary === true || is_primary === '1' ? 1 : 0;
        }
        console.log('Update Location Data:', updateData);

        const result = await CustomerLocationService.updateLocation(id, updateData);

        if (!result) {
            throw new NotFoundError('ບໍ່ພົບຂໍ້ມູນທີ່ຢู่');
        }

        return res.status(200).json({
            success: true,
            message: 'ອັບເດດທີ່ຢู่ສຳເລັດ',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ ดึงรายการ Location ของลูกค้า
 * GET /api/customer-locations/:customerId/locations
 */
export const getCustomerLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customerId = parseInt(req.params.customerId);

        if (!customerId || isNaN(customerId)) {
            throw new BadRequestError('customer_id ບໍ່ຖືກຕ້ອງ');
        }

        const result = await CustomerLocationService.getLocationsByCustomerId(customerId);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ✅ ลบ Location
 * DELETE /api/customer-locations/:id
 */
export const deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);

        if (!id || isNaN(id)) {
            throw new BadRequestError('location_id ບໍ່ຖືກຕ້ອງ');
        }

        await CustomerLocationService.deleteLocation(id);

        return res.status(200).json({
            success: true,
            message: 'ລົບທີ່ຢู่ສຳເລັດ'
        });
    } catch (error) {
        next(error);
    }
};