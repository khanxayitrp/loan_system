// import { logger } from '../utils/logger';
// import pdfParse = require('pdf-parse');

// export function mapDaysToStatus(days: number): string {
//     if (days === 0) return 'no_delay';
//     if (days <= 30) return 'delay_30_days';
//     if (days <= 60) return 'delay_60_days';
//     if (days <= 90) return 'delay_90_days';
//     return 'blacklist';
// }

// // ========================================================
// // 🌟 Custom Renderer: ດຶງພິກັດ X,Y ມາປະກອບເປັນແຖວທີ່ຊັດເຈນ
// // ========================================================
// function render_page(pageData: any): Promise<string> {
//     const render_options = { normalizeWhitespace: false, disableCombineTextItems: false };

//     return pageData.getTextContent(render_options).then((textContent: any) => {
//         const rows: Record<string, { x: number, text: string }[]> = {};
//         const Y_TOLERANCE = 3; // ຄ່າຄວາມຍືດຍຸ່ນຂອງແກນ Y ປ້ອງກັນຕົວໜັງສືບໍ່ຊື່ກັນ

//         textContent.items.forEach((item: any) => {
//             const text = item.str.trim();
//             if (!text) return;

//             const x = item.transform[4];
//             const y = item.transform[5];

//             // ຈັດກຸ່ມເຂົ້າແຖວ (Y-axis)
//             const existingY = Object.keys(rows).find(key => Math.abs(parseFloat(key) - y) <= Y_TOLERANCE);
//             if (existingY) {
//                 rows[existingY].push({ x, text });
//             } else {
//                 rows[y.toString()] = [{ x, text }];
//             }
//         });

//         // ລຽງລຳດັບແຖວຈາກເທິງລົງລຸ່ມ ແລະ ຖັນຈາກຊ້າຍໄປຂວາ
//         const sortedRows = Object.keys(rows)
//             .sort((a, b) => parseFloat(b) - parseFloat(a)) // ແກນ Y ຂອງ PDF ຈະນັບຈາກລຸ່ມຂຶ້ນເທິງ ຈຶ່ງຕ້ອງ sort ແບບປີ້ນກັບ
//             .map(y => {
//                 const rowItems = rows[y].sort((a, b) => a.x - b.x);
//                 return rowItems.map(item => item.text).join(' '); // ປະກອບເປັນ 1 ແຖວ
//             });

//         return sortedRows.join('\n'); // ແຍກແຕ່ລະແຖວດ້ວຍ Newline
//     });
// }

// export async function parseCIBPDF(buffer: Buffer): Promise<any> {
//     try {
//         // ໃຊ້ pdf-parse ພ້ອມກັບ Custom Renderer
//         const data = await pdfParse(buffer, { pagerender: render_page });
//         const textLines = data.text.split('\n');

//         const loans: Array<{
//             bankName: string;
//             loanType: string;
//             outstandingBalance: number;
//             actualOutstandingBalance: number;
//             daysPastDue: number;
//             status: string;
//         }> = [];

//         const uniqueLoans = new Set<string>();
//         let summaryAccountCount = 0;

//         // ========================================================
//         // 🟢 Line-by-Line Processing: ອ່ານເທື່ອລະແຖວ
//         // ========================================================
//         const strictRowRegex = /^(\d{5,15})\s+(\d{2}-\d{2}-\d{4})\s+([A-Za-z0-9_]+(?:\s[A-Za-z0-9_]+)*?)\s+(\d{2}-\d{2}-\d{4})\s+.*?([\d,]{4,}(?:\.\d{1,4})?)\s+([\d,]{1,}(?:\.\d{1,4})?)\s+(LAK|THB|USD|CNY)/;
//         const fallbackRowRegex = /([A-Za-z_]{2,15}(?:\s[A-Za-z_]{2,15})?)\s+(?:(?![A-Za-z_]).){1,80}?([\d,]{4,}(?:\.\d{1,4})?)\s+([\d,]+(?:\.\d{1,4})?)\s+(LAK|THB|USD|CNY)/;
//         const summaryRegex = /ສະຫຼຸບ\s*ຂໍ້\s*ມູນ\s*ທີ່\s*ຜ່ານ\s*ມາ\s*:\s*(\d+)/;

//         for (const line of textLines) {
//             const cleanLine = line.trim();
//             if (!cleanLine) continue;

//             // 1. ຈັບຈຳນວນບັນຊີຈາກໜ້າສະຫຼຸບ (ເກັບໄວ້ໃຊ້ກໍລະນີສຸກເສີນ)
//             const summaryMatch = cleanLine.match(summaryRegex);
//             if (summaryMatch && summaryMatch[1]) {
//                 summaryAccountCount = parseInt(summaryMatch[1], 10);
//             }

//             // 2. ຖ້າແຖວນັ້ນບໍ່ມີສະກຸນເງິນ ໃຫ້ຂ້າມໄປເລີຍ (ຕັດຊັບສິນຄໍ້າປະກັນທີ່ບໍ່ມີຍອດເງິນຖິ້ມ)
//             if (!/(LAK|THB|USD|CNY)/.test(cleanLine)) continue;

//             // 3. ລອງຈັບດ້ວຍ Strict Match ກ່ອນ
//             let match = cleanLine.match(strictRowRegex);
//             let bankName = '', approvedAmt = 0, outstandingAmt = 0;

//             if (match) {
//                 bankName = match[3].trim();
//                 approvedAmt = parseFloat(match[5].replace(/,/g, ''));
//                 outstandingAmt = parseFloat(match[6].replace(/,/g, ''));
//             } else {
//                 // 4. ຖ້າ Strict Match ບໍ່ຜ່ານ, ລອງ Fallback Match (ສຳລັບແຖວທີ່ມີແຕ່ຍອດເງິນ)
//                 match = cleanLine.match(fallbackRowRegex);
//                 if (match) {
//                     bankName = match[1].trim();
//                     approvedAmt = parseFloat(match[2].replace(/,/g, ''));
//                     outstandingAmt = parseFloat(match[3].replace(/,/g, ''));
//                 }
//             }

//             if (match && approvedAmt > 0) {
//                 const status = outstandingAmt > 0 ? 'active' : 'closed';
//                 const loanKey = `${bankName}_${approvedAmt}`;

//                 // ກັນຂໍ້ມູນຊໍ້າກັນ
//                 if (!uniqueLoans.has(loanKey)) {
//                     uniqueLoans.add(loanKey);
//                     loans.push({
//                         bankName: bankName.substring(0, 30),
//                         loanType: 'ບໍ່ລະບຸ',
//                         outstandingBalance: approvedAmt,
//                         actualOutstandingBalance: outstandingAmt,
//                         daysPastDue: 0,
//                         status: status,
//                     });
//                 }
//             }
//         }

//         // ========================================================
//         // 🟢 Ultimate Fallback: ສ້າງບັນຊີເປົ່າ ຖ້າບໍ່ພົບເລີຍແທ້ໆ
//         // ========================================================
//         if (loans.length === 0 && summaryAccountCount > 0) {
//             logger.info(`Fallback: Found ${summaryAccountCount} accounts from summary section.`);
//             for (let i = 0; i < summaryAccountCount; i++) {
//                 loans.push({
//                     bankName: `ບັນຊີ CIB ທີ ${i + 1}`,
//                     loanType: 'ລໍຖ້າກວດສອບ',
//                     outstandingBalance: 0,
//                     actualOutstandingBalance: 0,
//                     daysPastDue: 0,
//                     status: 'active',
//                 });
//             }
//         }

//         if (loans.length === 0) {
//             throw new Error('ບໍ່ພົບຂໍ້ມູນບັນຊີເງິນກູ້ ຫຼື ຍອດເງິນໃນໄຟລ໌ PDF. ລະບົບອາດຈະອ່ານຮູບແບບໃບ CIB ນີ້ບໍ່ໄດ້ ກະລຸນາປ້ອນຂໍ້ມູນດ້ວຍຕົນເອງ.');
//         }

//         const severityMap: Record<string, number> = {
//             no_delay: 1, delay_30_days: 2, delay_60_days: 3, delay_90_days: 4, blacklist: 5
//         };

//         let worstStatus = 'no_delay';
//         let maxSeverity = 1;

//         for (const loan of loans) {
//             const status = mapDaysToStatus(loan.daysPastDue);
//             const sev = severityMap[status] || 1;
//             if (sev > maxSeverity) {
//                 maxSeverity = sev;
//                 worstStatus = status;
//             }
//         }

//         return {
//             cib_details: loans.map(l => ({
//                 institution_name: l.bankName,
//                 account_type: l.loanType,
//                 history_status: mapDaysToStatus(l.daysPastDue),
//                 outstanding_balance: l.outstandingBalance,
//                 actual_outstanding_balance: l.actualOutstandingBalance
//             })),
//             cib_status: worstStatus,
//             is_existing_customer: loans.length > 0,
//             existing_customer_status: loans.some(l => l.status === 'active') ? 'active' : 'closed',
//             remark: `ສະກັດຈາກ PDF ດ້ວຍ Line-by-Line Coordinate Parsing (ພົບ ${loans.length} ບັນຊີ)`,
//         };

//     } catch (error: any) {
//         logger.error('Error parsing PDF:', error);
//         throw new Error(`ບໍ່ສາມາດອ່ານຂໍ້ມູນຈາກ PDF ໄດ້: ${error.message || error}`);
//     }
// }

import { logger } from '../utils/logger';
import pdfParse = require('pdf-parse');
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export function mapDaysToStatus(days: number): string {
    if (days === 0) return 'no_delay';
    if (days <= 30) return 'delay_30_days';
    if (days <= 60) return 'delay_60_days';
    if (days <= 90) return 'delay_90_days';
    return 'blacklist';
}

export async function parseCIBPDF(buffer: Buffer): Promise<any> {
    try {
        if (!apiKey) {
            throw new Error('ກະລຸນາເພີ່ມ GEMINI_API_KEY ໃນໄຟລ໌ .env ເພື່ອໃຊ້ງານ AI Parser.');
        }

        const data = await pdfParse(buffer);
        const text = data?.text || '';

        if (!text || text.trim().length === 0) {
            throw new Error('ໄຟລ໌ PDF ບໍ່ມີຂໍ້ຄວາມ (ອາດເປັນພາບສະແກນ)');
        }

        // 🟢 ປ່ຽນມາໃຊ້ 'gemini-pro' ເຊິ່ງຮອງຮັບທຸກ API Key ແລະ ທຸກພື້ນທີ່ 100%
        // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        // const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `
            ເຈົ້າເປັນຜູ້ຊ່ຽວຊານດ້ານການວິເຄາະຂໍ້ມູນສິນເຊື່ອ. ຈົ່ງສະກັດຂໍ້ມູນບັນຊີເງິນກູ້ທັງໝົດຈາກຂໍ້ຄວາມລາຍງານ CIB ຂອງລາວລຸ່ມນີ້.
            
            ກົດລະບຽບສຳຄັນ:
            - ຊອກຫາທຸກບັນຊີເງິນກູ້ ບໍ່ວ່າຈະຢູ່ໃນພາກສ່ວນ "ລາຍລະອຽດກ່ຽວກັບວົງເງິນກູ້" ຫຼື "ລາຍລະອຽດກ່ຽວກັບວົງເງິນກູ້ຂອງຜູ້ກູ້ຮ່ວມ".
            - ຊື່ສະຖາບັນການເງິນຈະເປັນໂຕຫຍໍ້ ເຊັ່ນ: DTMFI_SSB, KLS_LS, ACLD, IB, AEON_LS.
            - ຫ້າມເອົາ "ຊັບສິນຄໍ້າປະກັນ" (ເຊັ່ນ: ລົດໃຫຍ່, ໂທລະສັບ, ທີ່ດິນ) ເຂົ້າມາເດັດຂາດ.
            - ຕອບກັບມາເປັນ JSON Array ເທົ່ານັ້ນ ຫ້າມມີຂໍ້ຄວາມອື່ນປົນ ແລະ ຫ້າມມີ Markdown (ບໍ່ຕ້ອງໃສ່ \`\`\`json).
            - ໂຄງສ້າງ JSON ຕ້ອງເປັນແບບນີ້:
            [
              {
                "bankName": "ຊື່ສະຖາບັນ",
                "approvedAmt": ຕົວເລກຍອດອະນຸມັດ (ຕົວເລກເທົ່ານັ້ນ),
                "outstandingAmt": ຕົວເລກຍອດໜີ້ທີ່ຍັງເຫຼືອ (ຕົວເລກເທົ່ານັ້ນ),
                "daysPastDue": ຈຳນວນວັນທີ່ຊຳລະຊ້າ
              }
            ]

            ຂໍ້ຄວາມລາຍງານ CIB:
            ${text}
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // ອະນາໄມຂໍ້ຄວາມເຜື່ອ AI ຍັງແຖມ Markdown ມາໃຫ້
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let extractedLoans: any[] = [];
        try {
            extractedLoans = JSON.parse(responseText);
        } catch (e) {
            logger.error('Gemini ບໍ່ໄດ້ຕອບກັບເປັນ JSON ທີ່ຖືກຕ້ອງ:', responseText);
            throw new Error('ການສະກັດຂໍ້ມູນຜິດພາດຈາກ AI.');
        }

        if (!Array.isArray(extractedLoans) || extractedLoans.length === 0) {
            throw new Error('ບໍ່ພົບຂໍ້ມູນບັນຊີເງິນກູ້ໃນໄຟລ໌ PDF ກະລຸນາກວດສອບວ່າເປັນໃບລາຍງານ CIB ແທ້ຫຼືບໍ່.');
        }

        const loans = extractedLoans.map((loan: any) => ({
            bankName: loan.bankName || 'ສະມາຊິກ LCIC',
            loanType: 'ບໍ່ລະບຸ',
            outstandingBalance: Number(loan.approvedAmt) || 0,
            actualOutstandingBalance: Number(loan.outstandingAmt) || 0,
            daysPastDue: Number(loan.daysPastDue) || 0,
            status: Number(loan.outstandingAmt) > 0 ? 'active' : 'closed',
        }));

        const severityMap: Record<string, number> = {
            no_delay: 1, delay_30_days: 2, delay_60_days: 3, delay_90_days: 4, blacklist: 5
        };

        let worstStatus = 'no_delay';
        let maxSeverity = 1;

        for (const loan of loans) {
            const status = mapDaysToStatus(loan.daysPastDue);
            const sev = severityMap[status] || 1;
            if (sev > maxSeverity) {
                maxSeverity = sev;
                worstStatus = status;
            }
        }

        return {
            cib_details: loans.map(l => ({
                institution_name: l.bankName,
                account_type: l.loanType,
                history_status: mapDaysToStatus(l.daysPastDue),
                outstanding_balance: l.outstandingBalance,
                actual_outstanding_balance: l.actualOutstandingBalance
            })),
            cib_status: worstStatus,
            // is_existing_customer: loans.length > 0,
            // existing_customer_status: loans.some(l => l.status === 'active') ? 'active' : 'closed',
            remark: `ສະກັດຈາກ PDF ໂດຍ AI (ພົບ ${loans.length} ບັນຊີ)`,
        };

    } catch (error: any) {
        logger.error('Error parsing PDF with Gemini:', error);
        throw new Error(`ບໍ່ສາມາດອ່ານຂໍ້ມູນຈາກ PDF ໄດ້: ${error.message || error}`);
    }
}