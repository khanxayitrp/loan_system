"use strict";
// ==========================================
// src/utils/formatters.ts
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatStandardPhoneNumber = exports.normalizePhoneNumber = void 0;
exports.mapGender = mapGender;
exports.mapMaritalStatus = mapMaritalStatus;
exports.mapResidenceStatus = mapResidenceStatus;
exports.formatDate = formatDate;
exports.formatCurrency = formatCurrency;
exports.formatCurrencyV2 = formatCurrencyV2;
exports.getProductTypeName = getProductTypeName;
exports.fulladdress = fulladdress;
const locations_json_1 = __importDefault(require("./locations.json"));
function mapGender(gender) {
    if (gender === 'male')
        return 'ຊາຍ';
    if (gender === 'female')
        return 'ຍິງ';
    return '________________';
}
function mapMaritalStatus(status) {
    if (status === 'single')
        return 'ໂສດ';
    if (status === 'married')
        return 'ແຕ່ງງານແລ້ວ';
    if (status === 'divorced')
        return 'ຢ່າຮ້າງ';
    return '________________';
}
function mapResidenceStatus(status) {
    if (status === 'own')
        return 'ເຮືອນຕົວເອງ';
    if (status === 'rent')
        return 'ເຊົ່າ';
    if (status === 'family')
        return 'ຢູ່ກັບຄອບຄົວ';
    return '________________';
}
function formatDate(dateStr) {
    if (!dateStr)
        return '___/___/____';
    const date = new Date(dateStr);
    if (isNaN(date.getTime()))
        return '___/___/____';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '')
        return '________________';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num))
        return '________________';
    // 🟢 ເພີ່ມ Options ເພື່ອບັງຄັບໃຫ້ມີທົດສະນິຍົມ 2 ຕຳແໜ່ງສະເໝີ
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }) + ' ກີບ';
}
function formatCurrencyV2(amount) {
    if (amount === null || amount === undefined || amount === '')
        return '________________';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num))
        return '________________';
    // 🟢 ເພີ່ມ Options ເພື່ອບັງຄັບໃຫ້ມີທົດສະນິຍົມ 2 ຕຳແໜ່ງສະເໝີ
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
// export function formatCurrency(amount: number | null | string | undefined): string {
//     if (amount === null || amount === undefined || amount === '') return '________________';
//     const num = typeof amount === 'string' ? parseFloat(amount) : amount;
//     if (isNaN(num)) return '________________';
//     return num.toLocaleString('lo-LA') + ' ກີບ';
// }
// export function formatCurrencyV2(amount: number | null | string | undefined): string {
//     if (amount === null || amount === undefined || amount === '') return '________________';
//     const num = typeof amount === 'string' ? parseFloat(amount) : amount;
//     if (isNaN(num)) return '________________';
//     return num.toLocaleString('lo-LA');
// }
function getProductTypeName(type) {
    // ปรับให้รองรับกรณี DB เก็บเป็น ID (เช่น 1, 2, 3) หรือเก็บเป็น String
    const typeStr = String(type).toLowerCase();
    const types = {
        'gold': 'ສິນຄ້າຄຳ', '1': 'ສິນຄ້າຄຳ',
        'general': 'ສິນຄ້າທົ່ວໄປ', '2': 'ສິນຄ້າທົ່ວໄປ',
        'motorcycle': 'ສິນຄ້າລົດຈັກ', '3': 'ສິນຄ້າລົດຈັກ'
    };
    return types[typeStr] || '________________';
}
function fulladdress(address, districtId, provinceId) {
    // ດຶງຄ່າຈາກ JSON (ຖ້າບໍ່ມີໃຫ້ສົ່ງຄ່າວ່າງ ຫຼື 'ບໍ່ລະບຸ')
    const provinceName = locations_json_1.default.provinces[provinceId] || '';
    const districtName = locations_json_1.default.districts[districtId] || '';
    // ປະກອບເປັນ String ດຽວ
    return `${address}, ${districtName}, ${provinceName}`;
}
// src/utils/formatters.ts (ຫຼື ໄຟລ໌ utils ທີ່ທ່ານມີ)
const normalizePhoneNumber = (phone) => {
    if (!phone)
        return '';
    // ລຶບຊ່ອງຫວ່າງ, ຂີດ, ວົງເລັບ ແລະ ເຄື່ອງໝາຍບວກອອກກ່ອນ
    let cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    // ຕັດ Prefix ຍອດຮິດອອກ (ກວດຈາກຍາວໄປຫາສັ້ນ)
    if (cleanPhone.startsWith('020')) {
        cleanPhone = cleanPhone.substring(3);
    }
    else if (cleanPhone.startsWith('20')) {
        cleanPhone = cleanPhone.substring(2);
    }
    else if (cleanPhone.startsWith('030')) {
        cleanPhone = cleanPhone.substring(3);
    }
    else if (cleanPhone.startsWith('30')) {
        cleanPhone = cleanPhone.substring(2);
    }
    return cleanPhone;
};
exports.normalizePhoneNumber = normalizePhoneNumber;
// src/utils/formatters.ts
const formatStandardPhoneNumber = (phone) => {
    if (!phone)
        return '';
    // 1. ลบอักขระที่ไม่ใช่ตัวเลขออกให้หมด (ตัดช่องว่าง, -, +, (), ตัวอักษร)
    let cleanPhone = phone.replace(/\D/g, '');
    // 2. ลบ Prefix เก่าที่ผู้ใช้อาจจะพิมพ์ติดมาออกให้หมด ให้เหลือแค่เบอร์หลัก
    if (cleanPhone.startsWith('85620'))
        cleanPhone = cleanPhone.substring(5);
    else if (cleanPhone.startsWith('85630'))
        cleanPhone = cleanPhone.substring(5);
    else if (cleanPhone.startsWith('020'))
        cleanPhone = cleanPhone.substring(3);
    else if (cleanPhone.startsWith('20'))
        cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.startsWith('030'))
        cleanPhone = cleanPhone.substring(3);
    else if (cleanPhone.startsWith('30'))
        cleanPhone = cleanPhone.substring(2);
    // 3. ประกอบร่างใหม่ให้เป็นมาตรฐาน (Standardization)
    if (cleanPhone.length === 8) {
        return '020' + cleanPhone;
    }
    else if (cleanPhone.length === 7) {
        return '030' + cleanPhone;
    }
    // ถ้าเบอร์สั้นหรือยาวเกินไป (ผิดปกติ) ให้ส่งค่าเดิมกลับไปเพื่อให้ Validation ของ API เตะ Error
    return cleanPhone;
};
exports.formatStandardPhoneNumber = formatStandardPhoneNumber;
