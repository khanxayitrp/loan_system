import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';

export const generateLoanPDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { formData, loanId } = req.body;

        console.log('📄 Generating PDF for loan:', loanId);

        // ✅ 1. อ่าน HTML Template
        const templatePath = path.join(__dirname, '../templates/loan-form-template.html');
        // const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        // ✅ 2. หา Path ของไฟล์โลโก้ (สำคัญมาก!)
        // ✅ ใช้ path.resolve() เพื่อ absolute path ที่ถูกต้อง
        // ✅ แปลงโลโก้เป็น Base64
        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.readFileSync(logoPath, 'base64');
        const logoDataUri = `data:image/png;base64,${logoBase64}`;

        // ✅ Encode ช่องว่างเป็น %20 สำหรับ file:// URL
        const logoUrl = `file://${logoPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        // ✅ 3. หา Path ของไฟล์ฟ้อนต์
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        // ✅ 4. ตรวจสอบว่าไฟล์มีอยู่จริง
        console.log('🖼️ Logo Path:', logoUrl);
        console.log('🔤 Font Path:', fontUrl);
        console.log('✅ Logo exists:', fs.existsSync(logoPath));
        console.log('✅ Font exists:', fs.existsSync(fontPath));

        if (!fs.existsSync(logoPath)) {
            console.error('❌ Logo file not found at:', logoPath);
        }

        if (!fs.existsSync(fontPath)) {
            console.error('❌ Font file not found at:', fontPath);
        }

        // ✅ 5. แทนที่ Placeholder ด้วย Path จริง (ก่อน compile template)
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);

        // ✅ 6. Compile Template ด้วย Handlebars
        const templateCompiled = handlebars.compile(htmlContent);

        // ✅ 7. เตรียม Data สำหรับ Template
        const data = {
            // Checkbox states
            onlineChecked: 'checked',
            offlineChecked: '',
            goldChecked: formData.product.type === 'gold' ? 'checked' : '',
            generalChecked: formData.product.type === 'general' ? 'checked' : '',
            motorcycleChecked: formData.product.type === 'motorcycle' ? 'checked' : '',

            // Customer
            customer: {
                fullname: formData.customer.fullname || '________________',
                dob: formatDate(formData.customer.dob),
                age: formData.customer.age || '___',
                occupation: formData.customer.occupation || '________________',
                phone: formData.customer.phone || '________________',
                address: {
                    village: formData.customer.address.village || '____________',
                    district: formData.customer.address.district || '____________',
                    province: formData.customer.address.province || '____________'
                },
                idCard: formData.customer.idCard || '________________',
                censusNo: formData.customer.censusNo || '________________',
                unit: formData.customer.unit || '______',
                issuePlace: formData.customer.issuePlace || '________________',
                issueDate: formatDate(formData.customer.issueDate)
            },

            // Work
            work: {
                companyName: formData.work.companyName || '________________',
                address: {
                    village: formData.work.address.village || '____________',
                    district: formData.work.address.district || '____________',
                    province: formData.work.address.province || '____________'
                },
                phone: formData.work.phone || '________________',
                businessType: formData.work.businessType || '________________',
                businessDetail: formData.work.businessDetail || '________________',
                durationMonths: formData.work.durationMonths || '___',
                durationYears: formData.work.durationYears || '___',
                department: formData.work.department || '________________',
                position: formData.work.position || '________________',
                salary: formatCurrency(formData.work.salary)
            },

            // Product
            product: {
                type: getProductTypeName(formData.product.type),
                brand: formData.product.brand || '________________',
                model: formData.product.model || '________________',
                price: formatCurrency(formData.product.price),
                downPayment: formatCurrency(formData.product.downPayment),
                approvedAmount: formatCurrency(formData.product.approvedAmount),
                loanTerm: formData.product.loanTerm || '___',
                interestRate: formData.product.interestRate || '___',
                totalInterest: formatCurrency(formData.product.totalInterest),
                fee: formatCurrency(formData.product.fee),
                firstInstallment: formatCurrency(formData.product.firstInstallment),
                monthlyPayment: formatCurrency(formData.product.monthlyPayment),
                paymentDay: formData.product.paymentDay || '___',
                store: formData.product.store || '________________________________________________________'
            },

            // Guarantor
            hasGuarantor: formData.hasGuarantor || formData.hasReference,
            guarantorChecked: formData.hasGuarantor ? 'checked' : '',
            referenceChecked: formData.hasReference ? 'checked' : '',
            guarantor: {
                name: formData.guarantor?.name || '________________',
                dob: formatDate(formData.guarantor?.dob),
                age: formData.guarantor?.age || '___',
                occupation: formData.guarantor?.occupation || '________________',
                phone: formData.guarantor?.phone || '________________',
                address: {
                    village: formData.guarantor?.address?.village || '____________',
                    district: formData.guarantor?.address?.district || '____________',
                    province: formData.guarantor?.address?.province || '____________'
                },
                idCard: formData.guarantor?.idCard || '________________',
                parentChecked: formData.guarantor?.relationship === 'parent' ? 'checked' : '',
                spouseChecked: formData.guarantor?.relationship === 'spouse' ? 'checked' : '',
                otherChecked: formData.guarantor?.relationship === 'other' ? 'checked' : '',
                relationshipOther: formData.guarantor?.relationshipOther || '',
                work: {
                    companyName: formData.guarantor?.work?.companyName || '________________',
                    address: {
                        village: formData.guarantor?.work?.address?.village || '____________',
                        district: formData.guarantor?.work?.address?.district || '____________',
                        province: formData.guarantor?.work?.address?.province || '____________'
                    },
                    position: formData.guarantor?.work?.position || '________________',
                    phone: formData.guarantor?.work?.phone || '________________',
                    salary: formatCurrency(formData.guarantor?.work?.salary)
                }
            },

            // Signatures
            signatures: {
                borrowerDate: formatDate(formData.signatures?.borrowerDate),
                guarantorDate: formatDate(formData.signatures?.guarantorDate),
                staffDate: formatDate(formData.signatures?.staffDate)
            }
        };

        // ✅ 8. Render HTML
        const html = templateCompiled(data);

        // ✅ 9. Launch Puppeteer - ✅ เพิ่ม args สำหรับไฟล์ท้องถิ่น
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none',
                '--disable-web-security',
                '--allow-file-access-from-files', // ✅ อนุญาตให้เข้าถึงไฟล์ท้องถิ่น
                '--allow-file-access' // ✅ สำหรับ Puppeteer เวอร์ชันใหม่
            ]
        });

        const page = await browser.newPage();

        // ✅ 10. ตั้งค่า Viewport
        await page.setViewport({ width: 1200, height: 800 });

        // ✅ 11. Set Content
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // ✅ 12. รอให้รูปภาพโหลดเสร็จ
        // await page.waitForSelector('.emblem', { visible: true });
        // await page.waitForLoadState('networkidle', { timeout: 30000 });
        // await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 1000)); // ລໍຖ້າ 1 ວິນາທີ
        // await page.waitForLoadState('networkidle');

        // ✅ 13. Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                bottom: '25mm', // ต้องเท่ากับหรือมากกว่าความสูง Footer
                left: '15mm',
                right: '15mm'
            },
            displayHeaderFooter: false, // ปิดเพราะเราใช้ HTML Footer เอง
            preferCSSPageSize: true
        });

        console.log('✅ PDF generated successfully');

        // ✅ 14. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-${loanId || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ PDF Generation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    } finally {
        // ✅ 15. Close Browser
        if (browser) {
            await browser.close();
        }
    }
};

// ເພີ່ມຕໍ່ທ້າຍໄຟລ໌ Controller ຂອງທ່ານ (ເຊັ່ນ: pdf.controller.ts)

export const generateLoanContractPDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        // ຮັບຂໍ້ມູນ formData ທີ່ສົ່ງມາຈາກ LoanContractForm.vue
        const { formData, contractId } = req.body;

        console.log('📄 Generating Contract PDF for ID:', contractId);

        // ✅ 1. ອ່ານ HTML Template ສຳລັບ "ສັນຍາກູ້ຢືມ" (ຕ້ອງສ້າງໄຟລ໌ນີ້ໃນໂຟນເດີ templates)
        const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        // ✅ 2. ຈັດການ Logo ແລະ Font (ຄືກັນກັບອັນເກົ່າ)
        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        // ✅ 3. ແທນທີ່ Path
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);

        // ✅ 4. Compile Template
        const templateCompiled = handlebars.compile(htmlContent);

        // ✅ 5. ກຽມຂໍ້ມູນ (Map ຂໍ້ມູນຈາກ Vue ໃຫ້ພ້ອມສຳລັບ Handlebars)
        const data = {
            // Header
            contractNumber: formData.contractNumber || '________________',
            contractDay: formData.contractDate?.day || '___',
            contractMonth: formData.contractDate?.month || '___',
            contractYear: formData.contractDate?.year || '______',

            // Checkbox ປະເພດສິນຄ້າ
            checkGold: formData.productType?.gold ? 'checked' : '',
            checkGeneral: formData.productType?.general ? 'checked' : '',
            checkMotorcycle: formData.productType?.motorcycle ? 'checked' : '',

            // 1. ຂໍ້ມູນລູກຄ້າ
            cusName: formData.customer?.fullname || '________________',
            cusDob: formatDate(formData.customer?.dob),
            cusPhone: formData.customer?.phone || '________________',
            cusGender: mapGender(formData.customer?.gender),
            cusMarital: mapMaritalStatus(formData.customer?.maritalStatus),
            cusOccupation: formData.customer?.occupation || '________________',
            cusIdCard: formData.customer?.idCard || '________________',
            cusIdIssueDate: formatDate(formData.customer?.idCardIssueDate),
            cusCensus: formData.customer?.censusBook || '________________',
            cusIdExpiryDate: formatDate(formData.customer?.idCardExpiryDate),
            cusIssuePlace: formData.customer?.censusAuthorizeBy || '________________', 
            cusHouseNo: formData.customer?.houseNumber || '_____',
            cusUnit: formData.customer?.unit || '_____',
            cusVillage: formData.customer?.address?.village || '________________',
            cusDistrict: formData.customer?.address?.district || '________________',
            cusProvince: formData.customer?.address?.province || '________________',
            cusLivedYears: formData.customer?.residenceYears || '___',
            cusLiveWith: formData.customer?.liveWith || '________________',
            cusResStatus: mapResidenceStatus(formData.customer?.residenceStatus),

            // 2. ຂໍ້ມູນບ່ອນເຮັດວຽກ
            workName: formData.work?.companyName || '________________',
            workType: formData.work?.businessType || '________________',
            workVillage: formData.work?.address?.village || '________________',
            workDistrict: formData.work?.address?.district || '________________',
            workProvince: formData.work?.address?.province || '________________',
            workYears: formData.work?.workYears || '___',
            workPosition: formData.work?.position || '________________',
            workSalary: formatCurrency(formData.work?.salary),
            workSalaryDay: formData.work?.salaryDay || '___',
            workTotalEmp: formData.work?.totalEmployees || '___',
            workOtherIncome: formatCurrency(formData.work?.otherIncome),
            workOtherSource: formData.work?.otherIncomeSource || '________________',

            // 3. ຂໍ້ມູນສິນຄ້າ
            prodDesc: formData.product?.description || '________________',
            prodType: formData.product?.type || '________________',
            prodBrand: formData.product?.brand || '________________',
            prodModel: formData.product?.model || '________________',
            prodPrice: formatCurrency(formData.product?.price),
            prodDown: formatCurrency(formData.product?.downPayment),
            prodApprove: formatCurrency(formData.product?.approvedAmount),
            prodInterest: formData.product?.interestRate || '___',
            prodTerm: formData.product?.loanTerm || '___',
            prodTotalInt: formatCurrency(formData.product?.totalInterest),
            prodFee: formatCurrency(formData.product?.fee),
            prodMonthly: formatCurrency(formData.product?.monthlyPayment),
            prodFirstInst: formatCurrency(formData.product?.firstInstallment),
            prodPayDay: formData.product?.paymentDay || '___',
            
            // ຂໍ້ມູນລົດຈັກ (ຖ້າມີ)
            isMotorcycle: formData.productType?.motorcycle,
            motorId: formData.product?.motorcycle?.motorId || '________________',
            motorColor: formData.product?.motorcycle?.motorColor || '________________',
            tankNum: formData.product?.motorcycle?.tankNumber || '________________',
            motorIns: formatCurrency(formData.product?.motorcycle?.insurance),
            motorWarranty: formData.product?.motorcycle?.motorWarranty || '___',

            // 4. ຂໍ້ມູນຮ້ານຄ້າ
            shopName: formData.shop?.name || '________________',
            shopBranch: formData.shop?.branch || '________________',
            shopCode: formData.shop?.code || '________________',

            // 5. ຂໍ້ມູນຜູ້ຄ້ຳປະກັນ
            hasGuarantor: formData.hasGuarantor || formData.hasReference,
            checkGuarantor: formData.hasGuarantor ? 'checked' : '',
            checkReference: formData.hasReference ? 'checked' : '',
            
            guaName: formData.guarantor?.fullname || '________________',
            guaDob: formatDate(formData.guarantor?.dob),
            guaPhone: formData.guarantor?.phone || '________________',
            guaGender: mapGender(formData.guarantor?.gender),
            guaMarital: mapMaritalStatus(formData.guarantor?.maritalStatus),
            guaOccupation: formData.guarantor?.occupation || '________________',
            guaRelation: formData.guarantor?.relationship || '________________',
            guaIdCard: formData.guarantor?.idCard || '________________',
            guaIdIssueDate: formatDate(formData.guarantor?.idCardIssueDate),
            guaCensus: formData.guarantor?.censusBook || '________________',
            guaCensusIssue: formatDate(formData.guarantor?.censusBookIssueDate),
            guaIssuePlace: formData.guarantor?.censusAuthorizeBy || '________________',
            guaHouseNo: formData.guarantor?.houseNumber || '_____',
            guaUnit: formData.guarantor?.unit || '_____',
            guaVillage: formData.guarantor?.address?.village || '________________',
            guaDistrict: formData.guarantor?.address?.district || '________________',
            guaProvince: formData.guarantor?.address?.province || '________________',
            guaLivedYears: formData.guarantor?.residenceYears || '___',
            guaLiveWith: formData.guarantor?.liveWith || '________________',
            guaResStatus: mapResidenceStatus(formData.guarantor?.residenceStatus),

            // 6. ຂໍ້ມູນວຽກຜູ້ຄ້ຳ
            guaWorkName: formData.guarantorWork?.companyName || '________________',
            guaWorkType: formData.guarantorWork?.businessType || '________________',
            guaWorkVillage: formData.guarantorWork?.address?.village || '________________',
            guaWorkDistrict: formData.guarantorWork?.address?.district || '________________',
            guaWorkProvince: formData.guarantorWork?.address?.province || '________________',
            guaWorkYears: formData.guarantorWork?.workYears || '___',
            guaWorkPos: formData.guarantorWork?.position || '________________',
            guaWorkSalary: formatCurrency(formData.guarantorWork?.salary),
            guaWorkSalaryDay: formData.guarantorWork?.salaryDay || '___',
            guaWorkTotalEmp: formData.guarantorWork?.totalEmployees || '___',
            guaWorkOtherInc: formatCurrency(formData.guarantorWork?.otherIncome),
            guaWorkOtherSource: formData.guarantorWork?.otherIncomeSource || '________________',
        };

        // ✅ 6. Render HTML
        const html = templateCompiled(data);

        // ✅ 7. Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none',
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--allow-file-access'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

        // ລໍຖ້າໃຫ້ Render ສຳເລັດ
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ✅ 8. Generate PDF (ປັບຄ່າ Margin ສຳລັບສັນຍາ)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                bottom: '25mm',
                left: '15mm',
                right: '15mm'
            },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        console.log('✅ Contract PDF generated successfully');

        // ✅ 9. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Contract PDF Generation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Contract PDF',
            error: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};


export const generateRepaymentSchedulePDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { loanData, scheduleRows, totals } = req.body;

        console.log('📄 Generating Repayment Schedule PDF for loan:', loanData.loan_id);

        // 1. ອ່ານ HTML Template
        const templatePath = path.join(__dirname, '../templates/repayment-schedule-template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        // 2. ຈັດການ Path
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);

        // 3. Helper Functions
        const formatCurrency = (val: number | string | null) => {
            if (!val && val !== 0) return '0';
            return Number(val).toLocaleString('en-US');
        };
        const formatDate = (dateStr: string | null) => {
            if (!dateStr) return '___/___/____';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '___/___/____';
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // 4. ກຽມຂໍ້ມູນສຳລັບ Handlebars
        const data = {
            interestTypeName: loanData.interest_type === 'effective_rate' ? 'ຫຼຸດຕົ້ນຫຼຸດດອກ' : 'ສະເໝີຕົວ',
            contractNumber: loanData.loan_contract_number || loanData.loan_id || '________________',
            customerName: `${loanData.customer?.first_name || ''} ${loanData.customer?.last_name || ''}`.trim() || '________________',
            customerAddress: loanData.customer?.address || '________________',
            customerPhone: loanData.customer?.phone || '________________',
            
            productPrice: formatCurrency(loanData.product?.price || loanData.total_amount),
            downPayment: formatCurrency(loanData.down_payment),
            approvedAmount: formatCurrency(Number(loanData.total_amount) - Number(loanData.down_payment || 0)),
            interestRate: loanData.interest_rate_at_apply,
            interestRateType: loanData.interest_rate_type === 'yearly' ? '(ຕໍ່ປີ)' : '(ຕໍ່ເດືອນ)',
            
            startDate: formatDate(scheduleRows.length > 0 ? scheduleRows[0].due_date : null),
            endDate: formatDate(scheduleRows.length > 0 ? scheduleRows[scheduleRows.length - 1].due_date : null),
            paymentDay: loanData.payment_day || '___',
            loanTerm: loanData.loan_period || '___',

            // Format array ຂອງຕາຕະລາງ
            schedule: scheduleRows.map((row: any) => ({
                installment_number: row.installment_number,
                due_date: formatDate(row.due_date),
                principal: formatCurrency(row.principal),
                interest: formatCurrency(row.interest),
                total_amount: formatCurrency(row.total_amount),
                remaining_balance: formatCurrency(row.remaining_balance)
            })),

            // Totals ທາງລຸ່ມ
            totalPrincipal: formatCurrency(totals.principal),
            totalInterest: formatCurrency(totals.interest),
            totalAmount: formatCurrency(totals.amount)
        };

        // 5. Compile & Render HTML
        const templateCompiled = handlebars.compile(htmlContent);
        const html = templateCompiled(data);

        // ✅ 7. Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none',
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--allow-file-access'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        // 🟢 เปลี่ยนจาก networkidle0 เป็น load เพื่อป้องกัน Timeout
        await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
        
        // 🟢 รอให้ฟอนต์โหลดเสร็จสมบูรณ์
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, 500));

        // ✅ 8. Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });
        console.log('✅ Schedule PDF generated successfully');

        // 8. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="schedule-${loanData.loan_id || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Schedule PDF Generation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Schedule PDF',
            error: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

export const generateDeliveryReceiptPDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { loanData, receiptData, receiverPhone, deliveryAddress } = req.body;

        console.log('📄 Generating Delivery Receipt PDF for receipt:', receiptData?.receipts_id || loanData?.delivery_receipts?.[0]?.receipts_id);
        
        
        // 1. ອ່ານ HTML Template
        const templatePath = path.join(__dirname, '../templates/loan-receipt-template.html');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        // 2. ຈັດການ Path ສຳລັບ Logo ແລະ Font
        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        // 3. ແທນທີ່ Path ລົງໃນ Template
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace(/{{logoPath}}/g, logoDataUri);
        htmlContent = htmlContent.replace(/{{fontPath}}/g, fontUrl);

        // ==========================================
        // 🟢 4. Future-Proof Data Extraction Logic 🟢
        // ==========================================
        const customer = loanData?.customer || {};
        const product = loanData?.product || {};
        const partner = product?.partner || {};
        // ดึงข้อมูล Work หรือ Guarantor แบบครอบคลุมเผื่ออนาคต
        const workInfo = customer?.work_info?.[0] || customer?.customer_work_infos?.[0] || {};
        const guarantor = loanData?.loan_guarantors?.[0] || null;
        const guarantorWork = guarantor?.work_info?.[0] || guarantor?.work || {};
        const receipt = receiptData || loanData?.delivery_receipts?.[0] || {};
        const today = new Date();

        // 🟢 Helper 1: Fallback handler (ถ้ามีข้อมูลให้ใช้ข้อมูล ถ้าไม่มีให้ตีเส้น)
        const getVal = (val: any, defaultStr = '________________') => {
            if (val === null || val === undefined || val === '') return defaultStr;
            return val;
        };

        // 🟢 Helper 2: Smart Address Parser (รองรับแบบมีลูกน้ำ และแบบเว้นวรรค)
        const parseAddress = (addressStr: string | null | undefined) => {
            const defAddr = { village: '', district: '', province: '' };
            if (!addressStr) return defAddr;
            
            if (addressStr.includes(',')) {
                const parts = addressStr.split(',').map(p => p.trim());
                return { village: parts[0] || '', district: parts[1] || '', province: parts[2] || '' };
            } else {
                const parts = addressStr.split(' ').map(p => p.trim()).filter(Boolean);
                if (parts.length >= 3) {
                    return { province: parts.pop() || '', district: parts.pop() || '', village: parts.join(' ') };
                }
                return { village: addressStr, district: '', province: '' };
            }
        };

        // 🟢 Helper 3: Format Number (ไม่คืนค่า 0 ถ้ามันควรจะว่างเปล่า)
        const formatCurrency = (val: any) => {
            const num = Number(val);
            return (isNaN(num) || num === 0) ? '' : Math.round(num).toLocaleString('en-US');
        };

        // 🟢 Helper 4: Format Date
        const formatDate = (dateStr: any) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        };

        // วิเคราะห์ Address ของทุก Section (เผื่ออนาคตส่งมา)
        const cusAddr = parseAddress(customer.address);
        const workAddr = parseAddress(workInfo.address || workInfo.location);
        const guaAddr = parseAddress(guarantor?.address);
        const guaWorkAddr = parseAddress(guarantorWork?.address || guarantorWork?.location);

        // คำนวณตัวเลข
        const price = Number(loanData?.total_amount || product.price || 0);
        const downPayment = Number(loanData?.down_payment || 0);
        const approvedAmount = price - downPayment;
        const term = Number(loanData?.loan_period || 0);
        const monthlyPay = Number(loanData?.monthly_pay || 0);
        const totalInterest = (monthlyPay * term) - approvedAmount; 

        // จัดการประเภทสินค้า
        const pType = String(product.productType_id || product.product_type?.name || product.type || '');
        const isGold = pType.toLowerCase().includes('gold') || pType.includes('ຄຳ') || pType === '1';
        const isMoto = pType.toLowerCase().includes('motor') || pType.includes('ລົດ') || pType === '2';
        const isGen = !isGold && !isMoto;

        // ==========================================
        // 🟢 5. Data Mapping (ผูกตัวแปรเข้า Template) 🟢
        // ==========================================
        const data = {
            logoPath: logoDataUri,

            // Header & General
            contractNumber: getVal(receipt?.receipts_id),
            contractDay: String(today.getDate()).padStart(2, '0'),
            contractMonth: String(today.getMonth() + 1).padStart(2, '0'),
            contractYear: String(today.getFullYear()),
            
            checkGold: isGold ? '✔' : '', 
            checkMotorcycle: isMoto ? '✔' : '',
            checkGeneral: isGen ? '✔' : '',

            // Section I: Customer
            cusName: getVal(`${customer.first_name || ''} ${customer.last_name || ''}`.trim()),
            cusDob: getVal(formatDate(customer.date_of_birth)),
            cusPhone: getVal(customer.phone),
            cusIdCard: getVal(customer.identity_number),
            cusVillage: getVal(cusAddr.village, '____________'),
            cusDistrict: getVal(cusAddr.district, '____________'),
            cusProvince: getVal(cusAddr.province, '____________'),

            // Section II: Work (ถ้าอนาคตมีข้อมูลเข้ามา มันจะแทนที่ ____ อัตโนมัติ)
            workName: getVal(workInfo.company_name || workInfo.companyName),
            workVillage: getVal(workAddr.village, '____________'), 
            workDistrict: getVal(workAddr.district, '____________'),
            workProvince: getVal(workAddr.province, '____________'),
            workDepartment: getVal(workInfo.department),
            workYears: getVal(workInfo.duration_years || workInfo.workYears, '___'),
            workPosition: getVal(workInfo.position || customer.occupation),
            workSalary: getVal(formatCurrency(workInfo.salary || customer.income_per_month)),

            // Section III: Product & Loan
            prodDesc: getVal(product.product_name),
            prodType: getVal(isGold ? 'ສິນຄ້າຄຳ' : isMoto ? 'ສິນຄ້າລົດຈັກ' : 'ສິນຄ້າທົ່ວໄປ'), 
            prodBrand: getVal(product.brand),
            prodModel: getVal(product.model),
            prodPrice: getVal(formatCurrency(price)),
            prodDown: getVal(formatCurrency(downPayment)),
            prodApprove: getVal(formatCurrency(approvedAmount)),
            prodInterest: getVal(loanData?.interest_rate_at_apply, '___'),
            prodTerm: getVal(term, '___'),
            prodTotalInt: getVal(formatCurrency(totalInterest > 0 ? totalInterest : 0)),
            prodFee: getVal(formatCurrency(loanData?.fee)),
            prodMonthly: getVal(formatCurrency(monthlyPay)),
            prodFirstInst: getVal(formatCurrency(loanData?.first_installment_amount)),
            prodPayDay: getVal(loanData?.payment_day, '___'),
            shopName: getVal(partner.shop_name),
            shopBranch: getVal(partner.branch || 'ສຳນັກງານໃຫຍ່'),

            // Section IV: Guarantor
            hasGuarantor: guarantor ? '✔' : '',
            hasReference: !guarantor ? '✔' : '',
            guaName: getVal(guarantor ? `${guarantor.first_name || ''} ${guarantor.last_name || ''}`.trim() : null),
            guaDob: getVal(formatDate(guarantor?.date_of_birth)),
            guaPhone: getVal(guarantor?.phone),
            guaIdCard: getVal(guarantor?.identity_number),
            guaVillage: getVal(guaAddr.village, '____________'),
            guaDistrict: getVal(guaAddr.district, '____________'),
            guaProvince: getVal(guaAddr.province, '____________'),
            
            guaWorkName: getVal(guarantorWork.company_name),
            guaWorkVillage: getVal(guaWorkAddr.village, '____________'),
            guaWorkDistrict: getVal(guaWorkAddr.district, '____________'),
            guaWorkProvince: getVal(guaWorkAddr.province, '____________'),
            guaIncome: getVal(formatCurrency(guarantorWork.salary || guarantor?.salary)),
            guaRelation: getVal(guarantor?.relationship),

            // Delivery Receipt Status
            approveChecked: receipt.status === 'approved' ? '✔' : '',
            rejectChecked: receipt.status === 'rejected' ? '✔' : ''
        };

        // 6. Compile & Render HTML
        const templateCompiled = handlebars.compile(htmlContent);
        const html = templateCompiled(data);

        // 7. Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none',
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--allow-file-access'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        try {
            await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
            await page.evaluateHandle('document.fonts.ready');
        } catch (e: any) {
            console.warn('⚠️ ຂໍ້ຄວາມເຕືອນ: ໜ້າເວັບໂຫຼດຊ້າກວ່າປົກກະຕິ. ລະບົບກຳລັງບັງຄັບສ້າງ PDF ຕໍ່ໄປ...');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // 8. Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        console.log('✅ Delivery Receipt PDF generated successfully');

        // 9. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt?.receipts_id || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Delivery Receipt PDF Generation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Delivery Receipt PDF',
            error: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// ==========================================
// Helper Functions (ເພີ່ມໃສ່ກ້ອງໄຟລ໌)
// ==========================================

function mapGender(gender: string | undefined): string {
    if (gender === 'male') return 'ຊາຍ';
    if (gender === 'female') return 'ຍິງ';
    return '________________';
}

function mapMaritalStatus(status: string | undefined): string {
    if (status === 'single') return 'ໂສດ';
    if (status === 'married') return 'ແຕ່ງງານແລ້ວ';
    if (status === 'divorced') return 'ຢ່າຮ້າງ';
    return '________________';
}

function mapResidenceStatus(status: string | undefined): string {
    if (status === 'own') return 'ເຮືອນຕົວເອງ';
    if (status === 'rent') return 'ເຊົ່າ';
    if (status === 'family') return 'ຢູ່ກັບຄອບຄົວ';
    return '________________';
}

// Helper Functions
function formatDate(dateStr: string | null): string {
    if (!dateStr) return '___/___/____';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '___/___/____';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatCurrency(amount: number | null | string): string {
    if (!amount && amount !== 0) return '________________';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '________________';
    return num.toLocaleString('lo-LA') + ' ກີບ';
}

function getProductTypeName(type: string): string {
    const types: Record<string, string> = {
        gold: 'ສິນຄ້າຄຳ',
        general: 'ສິນຄ້າທົ່ວໄປ',
        motorcycle: 'ສິນຄ້າລົດຈັກ'
    };
    return types[type] || '________________';
}