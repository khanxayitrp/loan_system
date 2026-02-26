import { Router } from 'express';
import * as LocationController from '../controllers/customer_location.controller';

const router = Router();

// ✅ POST: /api/customer-locations/:customerId/locations
// สร้าง Location ใหม่ (ต้องมี customerId ใน URL)
router.post('/:customerId/locations', LocationController.createLocation);

// ✅ GET: /api/customer-locations/:customerId/locations
// ดึงรายการ Location ของลูกค้า
router.get('/:customerId/locations', LocationController.getCustomerLocations);

// ✅ PUT: /api/customer-locations/:id
// อัปเดต Location (ใช้ ID ของ location)
router.put('/:id', LocationController.updateLocation);

// ✅ DELETE: /api/customer-locations/:id
// ลบ Location (ใช้ ID ของ location)
router.delete('/:id', LocationController.deleteLocation);

export default router;