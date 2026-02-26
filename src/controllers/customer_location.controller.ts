import { Request, Response } from 'express';
import CustomerLocationService from '../services/customer_location.service';

/**
 * ✅ สร้าง Location ใหม่
 * POST /api/customer-locations/:customerId/locations
 */
export const createLocation = async (req: Request, res: Response) => {
    try {
        const customerId = parseInt(req.params.customerId);
        
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'customer_id ไม่ถูกต้อง' 
            });
        }

        // ✅ Validate และแปลง is_primary ใน Controller
        const { location_type, address, latitude, longitude, is_primary } = req.body;
        
        // ✅ ตรวจสอบ location_type
        if (!location_type || !['home', 'work', 'other'].includes(location_type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'location_type ต้องเป็น home, work, หรือ other' 
            });
        }

        // ✅ ตรวจสอบ address
        if (!address || address.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'address เป็นข้อมูลบังคับ' 
            });
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
            is_primary: primaryValue  // ✅ number (0 หรือ 1)
        };

        const result = await CustomerLocationService.createLocation(locationData);
        
        res.status(201).json({ 
            success: true, 
            message: 'สร้างที่อยู่สำเร็จ',
            data: result 
        });
    } catch (error) {
        console.error('Create Location Error:', error);
        res.status(500).json({ 
            success: false, 
            message: (error as Error).message 
        });
    }
};

/**
 * ✅ อัปเดต Location
 * PUT /api/customer-locations/:id
 */
export const updateLocation = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'location_id ไม่ถูกต้อง' 
            });
        }

        // ✅ Validate และแปลง is_primary ใน Controller
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
                return res.status(400).json({ 
                    success: false, 
                    message: 'location_type ต้องเป็น home, work, หรือ other' 
                });
            }
            updateData.location_type = location_type;
        }

        // ✅ แปลง is_primary เป็น number (0 หรือ 1)
        if (is_primary !== undefined) {
            updateData.is_primary = is_primary === 1 || is_primary === true || is_primary === '1' ? 1 : 0;
        }

        const result = await CustomerLocationService.updateLocation(id, updateData);
        
        if (result[0] === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'ไม่พบข้อมูลที่อยู่' 
            });
        }

        res.json({ 
            success: true, 
            message: 'อัปเดตที่อยู่สำเร็จ' 
        });
    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({ 
            success: false, 
            message: (error as Error).message 
        });
    }
};

/**
 * ✅ ดึงรายการ Location ของลูกค้า
 * GET /api/customer-locations/:customerId/locations
 */
export const getCustomerLocations = async (req: Request, res: Response) => {
    try {
        const customerId = parseInt(req.params.customerId);
        
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'customer_id ไม่ถูกต้อง' 
            });
        }

        const result = await CustomerLocationService.getLocationsByCustomerId(customerId);
        
        res.json({ 
            success: true, 
            data: result 
        });
    } catch (error) {
        console.error('Get Locations Error:', error);
        res.status(500).json({ 
            success: false, 
            message: (error as Error).message 
        });
    }
};

/**
 * ✅ ลบ Location
 * DELETE /api/customer-locations/:id
 */
export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'location_id ไม่ถูกต้อง' 
            });
        }

        await CustomerLocationService.deleteLocation(id);
        
        res.json({ 
            success: true, 
            message: 'ลบที่อยู่สำเร็จ' 
        });
    } catch (error) {
        console.error('Delete Location Error:', error);
        res.status(500).json({ 
            success: false, 
            message: (error as Error).message 
        });
    }
};