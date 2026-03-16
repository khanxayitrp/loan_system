"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpAndGetToken = exports.getCustomerBySearch = exports.getCustomerById = exports.createCustomer = exports.requestOtpForCustomer = void 0;
const customer_repo_1 = __importDefault(require("../repositories/customer.repo")); // ปรับ path ตาม project
const otp_service_1 = require("../services/otp.service");
const init_models_1 = require("../models/init-models");
const token_service_1 = __importDefault(require("../services/token.service"));
const errors_1 = require("../utils/errors"); // สมมติมี
const requestOtpForCustomer = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone)
            throw new errors_1.ValidationError('Phone number is required');
        // สร้างและส่ง OTP (ใน dev จะ log OTP ออกมา)
        const result = await otp_service_1.otpService.sendOTP({
            phoneNumber: phone,
            message: 'Your OTP code is: {OTP}. Valid for 5 minutes.',
        });
        res.status(200).json({
            message: 'OTP sent successfully',
            result
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.requestOtpForCustomer = requestOtpForCustomer;
const createCustomer = async (req, res) => {
    try {
        const { identity_number, first_name, last_name, phone, address, occupation, income_per_month, otp } = req.body;
        // Verify OTP ก่อน
        const isValid = await otp_service_1.otpService.verifyOTP({
            phoneNumber: phone,
            otp
        });
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        const customer = await customer_repo_1.default.createCustomer({
            identity_number,
            first_name,
            last_name,
            phone,
            address,
            occupation,
            income_per_month,
            // user_id: req.user?.id || null, // ถ้ามี auth จาก middleware
        });
        res.status(201).json({
            message: 'Customer created successfully',
            customer
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createCustomer = createCustomer;
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await customer_repo_1.default.findCustomerById(Number(id));
        if (!customer)
            return res.status(404).json({ message: 'Customer not found' });
        res.status(200).json({ success: true, message: 'found customer data', data: customer });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getCustomerById = getCustomerById;
const getCustomerBySearch = async (req, res) => {
    try {
        const { phone, first_name, last_name } = req.query;
        console.log("🔍 Incoming search params:", req.query);
        let customer = null;
        // 1. ກໍລະນີຫາດ້ວຍເບີໂທ
        if (phone && typeof phone === 'string') {
            customer = await customer_repo_1.default.findCustomersByPhone(phone);
        }
        // 2. ຖ້າຫາດ້ວຍເບີບໍ່ເຫັນ (ຫຼື ບໍ່ໄດ້ສົ່ງເບີມາ) ໃຫ້ຫາດ້ວຍຊື່-ນາມສະກຸນ
        if (!customer && first_name && last_name) {
            const fullName = `${first_name} + ' ' + ${last_name}`;
            customer = await customer_repo_1.default.findCustomersByName(fullName);
        }
        // 3. ຖ້າບໍ່ມີຂໍ້ມູນຫຍັງສົ່ງມາເລີຍ
        if (!phone && (!first_name || !last_name)) {
            return res.status(400).json({
                success: false,
                message: 'ກະລຸນາລະບຸ ຊື່-ນາມສະກຸນ ຫຼື ເບີໂທລະສັບ'
            });
        }
        // 4. ສົ່ງຜົນລັດ
        if (!customer) {
            return res.status(404).json({ success: false, message: 'ບໍ່ພົບຂໍ້ມູນລູກຄ້າ' });
        }
        return res.status(200).json({
            success: true,
            message: 'ພົບຂໍ້ມູນລູກຄ້າ',
            data: customer
        });
    }
    catch (error) {
        console.error("❌ Search Error:", error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
exports.getCustomerBySearch = getCustomerBySearch;
// 🟢 API ສຳລັບລູກຄ້າທີ່ເຄີຍຂໍສິນເຊື່ອແລ້ວ ແຕ່ຕ້ອງການເຂົ້າລະບົບມາເພື່ອ "ອັບໂຫຼດເອກະສານ"
const verifyOtpAndGetToken = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            throw new errors_1.ValidationError('ກະລຸນາປ້ອນເບີໂທລະສັບ ແລະ ລະຫັດ OTP');
        }
        // 1. ຢືນຢັນ OTP ຜ່ານ otpService (ຄືກັນກັບຕອນ createCustomer)
        const isValid = await otp_service_1.otpService.verifyOTP({
            phoneNumber: phone,
            otp
        });
        if (!isValid) {
            return res.status(400).json({ message: 'ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ' });
        }
        // 2. ຄົ້ນຫາລູກຄ້າໃນຖານຂໍ້ມູນ ດ້ວຍເບີໂທ
        // (ເພາະລູກຄ້າຕ້ອງເຄີຍສະໝັກ/ມີຂໍ້ມູນແລ້ວ ຈຶ່ງຈະມາອັບໂຫຼດເອກະສານໄດ້)
        const customer = await init_models_1.db.customers.findOne({ where: { phone } });
        if (!customer) {
            return res.status(404).json({
                message: 'ບໍ່ພົບຂໍ້ມູນລູກຄ້ານີ້ໃນລະບົບ. ກະລຸນາສະໝັກ ຫຼື ສົ່ງຄຳຂໍສິນເຊື່ອກ່ອນ.'
            });
        }
        // 🔥 ด่านอรหันต์: ถ้าลูกค้าคนนี้ถูกระงับการใช้งาน (is_active = 0) อาจจะไม่ให้เข้าสู่ระบบเลยก็ได้
        // if (customer.is_active === 0) {
        //   return res.status(403).json({ message: 'ບັນຊີລູກຄ້າຖືກລະງັບການນຳໃຊ້' });
        // }
        // 3. 🟢 ສ້າງ Token ຂອງລູກຄ້າ ຜ່ານ TokenService
        // (ໃຊ້ຟັງຊັນ generateCustomerToken ທີ່ເຮົາສ້າງໄວ້ກ່ອນໜ້ານີ້)
        const token = token_service_1.default.generateCustomerToken(customer.id, customer.phone);
        // 4. ສົ່ງ Token ກັບໄປໃຫ້ Frontend ເພື່ອເອົາໄປແນບ Header (Authorization: Bearer <token>)
        res.status(200).json({
            success: true,
            message: 'ຢືນຢັນ OTP ສຳເລັດ, ໄດ້ຮັບ Token ແລ້ວ',
            token: token,
            customer: {
                id: customer.id,
                phone: customer.phone,
                first_name: customer.first_name,
                last_name: customer.last_name
            }
        });
    }
    catch (error) {
        console.error('❌ Verify OTP for Token Error:', error);
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
exports.verifyOtpAndGetToken = verifyOtpAndGetToken;
// เพิ่ม controller อื่นๆ ตาม repo ที่มี เช่น update, search by name/phone...
