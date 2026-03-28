// ==========================================
// src/utils/formatters.ts
// ==========================================

export function mapGender(gender: string | undefined | null): string {
    if (gender === 'male') return 'ຊາຍ';
    if (gender === 'female') return 'ຍິງ';
    return '________________';
}

export function mapMaritalStatus(status: string | undefined | null): string {
    if (status === 'single') return 'ໂສດ';
    if (status === 'married') return 'ແຕ່ງງານແລ້ວ';
    if (status === 'divorced') return 'ຢ່າຮ້າງ';
    return '________________';
}

export function mapResidenceStatus(status: string | undefined | null): string {
    if (status === 'own') return 'ເຮືອນຕົວເອງ';
    if (status === 'rent') return 'ເຊົ່າ';
    if (status === 'family') return 'ຢູ່ກັບຄອບຄົວ';
    return '________________';
}

export function formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '___/___/____';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '___/___/____';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function formatCurrency(amount: number | null | string | undefined): string {
    if (amount === null || amount === undefined || amount === '') return '________________';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '________________';
    return num.toLocaleString('lo-LA') + ' ກີບ';
}

export function getProductTypeName(type: string | number | null): string {
    // ปรับให้รองรับกรณี DB เก็บเป็น ID (เช่น 1, 2, 3) หรือเก็บเป็น String
    const typeStr = String(type).toLowerCase();
    const types: Record<string, string> = { 
        'gold': 'ສິນຄ້າຄຳ', '1': 'ສິນຄ້າຄຳ',
        'general': 'ສິນຄ້າທົ່ວໄປ', '2': 'ສິນຄ້າທົ່ວໄປ',
        'motorcycle': 'ສິນຄ້າລົດຈັກ', '3': 'ສິນຄ້າລົດຈັກ'
    };
    return types[typeStr] || '________________';
}