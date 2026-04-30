"use strict";
// ==========================================
// src/utils/formatters.ts
// ==========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapGender = mapGender;
exports.mapMaritalStatus = mapMaritalStatus;
exports.mapResidenceStatus = mapResidenceStatus;
exports.formatDate = formatDate;
exports.formatCurrency = formatCurrency;
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
    return num.toLocaleString('lo-LA') + ' ກີບ';
}
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
