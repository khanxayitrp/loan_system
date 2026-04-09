"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.getCustomerLocations = exports.updateLocation = exports.createLocation = void 0;
const customer_location_service_1 = __importDefault(require("../services/customer_location.service"));
// 👉 1. Import Custom Errors
const errors_1 = require("../utils/errors");
/**
 * ✅ สร้าง Location ใหม่
 * POST /api/customer-locations/:customerId/locations
 */
const createLocation = async (req, res, next) => {
    try {
        const customerId = parseInt(req.params.customerId);
        if (!customerId || isNaN(customerId)) {
            throw new errors_1.BadRequestError('customer_id ບໍ່ຖືກຕ້ອງ');
        }
        const { location_type, address, latitude, longitude, is_primary } = req.body;
        // ✅ ตรวจสอบ location_type
        if (!location_type || !['home', 'work', 'other'].includes(location_type)) {
            throw new errors_1.BadRequestError('location_type ต้องเป็น home, work, หรือ other');
        }
        // ✅ ตรวจสอบ address
        if (!address || address.trim() === '') {
            throw new errors_1.BadRequestError('address ເປັນຂໍ້ມູນທີ່ຈຳເປັນ');
        }
        // ✅ แปลง is_primary เป็น number (0 หรือ 1)
        let primaryValue = 0;
        if (is_primary !== undefined && is_primary !== null) {
            primaryValue = is_primary === 1 || is_primary === true || is_primary === '1' ? 1 : 0;
        }
        const locationData = {
            customer_id: customerId,
            location_type,
            address: address.trim(),
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            is_primary: primaryValue
        };
        const result = await customer_location_service_1.default.createLocation(locationData);
        return res.status(201).json({
            success: true,
            message: 'ສ້າງທີ່ຢู่ສຳເລັດ',
            data: result
        });
    }
    catch (error) {
        next(error); // 👉 โยนให้ Global Error Handler จัดการ
    }
};
exports.createLocation = createLocation;
/**
 * ✅ อัปเดต Location
 * PUT /api/customer-locations/:id
 */
const updateLocation = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
            throw new errors_1.BadRequestError('location_id ບໍ່ຖືກຕ້ອງ');
        }
        const { address, latitude, longitude, is_primary, location_type } = req.body;
        const updateData = {};
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
                throw new errors_1.BadRequestError('location_type ต้องเป็น home, work, หรือ other');
            }
            updateData.location_type = location_type;
        }
        // ✅ แปลง is_primary เป็น number (0 หรือ 1)
        if (is_primary !== undefined) {
            updateData.is_primary = is_primary === 1 || is_primary === true || is_primary === '1' ? 1 : 0;
        }
        console.log('Update Location Data:', updateData);
        const result = await customer_location_service_1.default.updateLocation(id, updateData);
        if (!result) {
            throw new errors_1.NotFoundError('ບໍ່ພົບຂໍ້ມູນທີ່ຢู่');
        }
        return res.status(200).json({
            success: true,
            message: 'ອັບເດດທີ່ຢู่ສຳເລັດ',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLocation = updateLocation;
/**
 * ✅ ดึงรายการ Location ของลูกค้า
 * GET /api/customer-locations/:customerId/locations
 */
const getCustomerLocations = async (req, res, next) => {
    try {
        const customerId = parseInt(req.params.customerId);
        if (!customerId || isNaN(customerId)) {
            throw new errors_1.BadRequestError('customer_id ບໍ່ຖືກຕ້ອງ');
        }
        const result = await customer_location_service_1.default.getLocationsByCustomerId(customerId);
        return res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerLocations = getCustomerLocations;
/**
 * ✅ ลบ Location
 * DELETE /api/customer-locations/:id
 */
const deleteLocation = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!id || isNaN(id)) {
            throw new errors_1.BadRequestError('location_id ບໍ່ຖືກຕ້ອງ');
        }
        await customer_location_service_1.default.deleteLocation(id);
        return res.status(200).json({
            success: true,
            message: 'ລົບທີ່ຢู่ສຳເລັດ'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLocation = deleteLocation;
