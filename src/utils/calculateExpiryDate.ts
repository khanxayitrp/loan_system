import { DocumentType } from '../types/file.types';

/**
 * คำนวณวันหมดอายุของเอกสารแต่ละประเภท
 * @param docType ประเภทของเอกสาร
 * @returns วันที่หมดอายุ หรือ null หากเอกสารประเภทนั้นไม่มีวันหมดอายุ
 */
export const calculateExpiryDate = (docType: DocumentType): Date | null => {
  const now = new Date();
  
  switch (docType) {
    case 'salary_slip':
      now.setMonth(now.getMonth() + 6); // สลิปเงินเดือน มีอายุ 6 เดือน
      return now;
      
    case 'id_card':
      now.setFullYear(now.getFullYear() + 1); // บัตรประชาชน สมมติให้ 1 ปี
      return now;
      
    case 'face_scan':
      now.setDate(now.getDate() + 60); // รูปสแกนหน้า สมมติให้อายุ 60 วัน
      return now;
      
    case 'house_reg':
        now.setFullYear(now.getFullYear() + 1); // บังคับให้อัปเดตทะเบียนบ้านใหม่ทุกๆ 1 ปี
      return now;
    case 'other':
    default:
      return null; // ไม่มีวันหมดอายุ
  }
};