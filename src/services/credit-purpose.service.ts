import { db } from '../models/init-models';
import redisService from './redis.service'; // 🟢 อ้างอิง Redis Service[cite: 6]
import { Op } from 'sequelize';

export class CreditPurposeService {
  private cacheKeyActive = 'credit_purposes:active';
  private cacheKeyAll = 'credit_purposes:all';

  // 🟢 1. ດຶງຂໍ້ມູນຈຸດປະສົງ (ມີ Cache)
  async getPurposes(activeOnly: boolean = true) {
    const cacheKey = activeOnly ? this.cacheKeyActive : this.cacheKeyAll;
    
    // 🌟 ກວດສອບ Cache ກ່ອນສະເໝີ[cite: 6]
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const whereClause = activeOnly ? { is_active: 1 } : {};
    
    const purposes = await db.membership_credit_purposes.findAll({
      where: whereClause,
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    // 🌟 ບັນທຶກລົງ Cache (TTL 1 ຊົ່ວໂມງ)
    await redisService.set(cacheKey, JSON.stringify(purposes), 3600);

    return purposes;
  }

  // 🟢 2. ເພີ່ມຈຸດປະສົງໃໝ່
  async createPurpose(data: { purpose_code: string, purpose_name: string, description?: string, sort_order?: number }) {
    // ກວດສອບ Code ຊ້ຳ
    const existing = await db.membership_credit_purposes.findOne({ where: { purpose_code: data.purpose_code } });
    if (existing) throw new Error('Purpose Code ຖືກນຳໃຊ້ແລ້ວ (Code already exists)');

    const newPurpose = await db.membership_credit_purposes.create({
      purpose_code: data.purpose_code,
      purpose_name: data.purpose_name,
      // 🌟 ແກ້ໄຂ TS Error: ປ່ຽນຈາກ null ເປັນ undefined
      description: data.description ?? undefined, 
      sort_order: data.sort_order ?? 0,
      is_active: 1
    });

    await this.invalidateCache(); // 🌟 ລ້າງ Cache[cite: 6]
    return newPurpose;
  }

  // 🟢 3. ແກ້ໄຂຈຸດປະສົງ
  async updatePurpose(id: number, data: { purpose_code: string, purpose_name: string, description?: string, sort_order?: number }) {
    const purpose = await db.membership_credit_purposes.findByPk(id);
    if (!purpose) throw new Error('Purpose not found');

    // ຖ້າແກ້ Code ຕ້ອງກວດສອບຊ້ຳ
    if (data.purpose_code !== purpose.purpose_code) {
      const existing = await db.membership_credit_purposes.findOne({ where: { purpose_code: data.purpose_code } });
      if (existing) throw new Error('Purpose Code ຖືກນຳໃຊ້ແລ້ວ (Code already exists)');
    }

    await purpose.update({
      purpose_code: data.purpose_code,
      purpose_name: data.purpose_name,
      // 🌟 ແກ້ໄຂ TS Error: ໃຊ້ ?? undefined ເພື່ອຄວາມປອດໄພ
      description: data.description ?? undefined,
      sort_order: data.sort_order ?? purpose.sort_order
    });

    await this.invalidateCache(); // 🌟 ລ້າງ Cache[cite: 6]
    return purpose;
  }

  // 🟢 4. ເປີດ/ປິດ ການນຳໃຊ້
  async toggleStatus(id: number, isActive: boolean) {
    const purpose = await db.membership_credit_purposes.findByPk(id);
    if (!purpose) throw new Error('Purpose not found');

    await purpose.update({ is_active: isActive ? 1 : 0 });
    
    await this.invalidateCache(); // 🌟 ລ້າງ Cache[cite: 6]
    return purpose;
  }

  // Helper ສຳລັບລ້າງ Cache
  private async invalidateCache() {
    await redisService.delByPattern('credit_purposes:*');
  }
}

export const creditPurposeService = new CreditPurposeService();