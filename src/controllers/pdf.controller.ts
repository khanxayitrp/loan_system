import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import redisService from '../services/redis.service'; // 🟢 1. Import Redis
import { db } from '../models/init-models'; // 🟢 2. Import DB Models
import { generatePdfBufferFromData } from '../services/pdf.service';
import { 
    formatDate, formatCurrency, mapGender, 
    mapMaritalStatus, mapResidenceStatus, getProductTypeName 
} from '../utils/formatters';

export const generateLoanPDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { formData, loanId } = req.body;
        console.log('✅ formData received for PDF generation:', formData); // ตรวจสอบข้อมูลที่ได้รับก่อนส่งให้ Template
        // =========================================================
        // 🟢 2. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (loanId) {
            const cacheKey = `cache:pdf:loan-form:${loanId}`;
            const cachedPdfBase64 = await redisService.get(cacheKey);

            if (cachedPdfBase64) {
                console.log(`[PDF] 🚀 Serving Loan Form PDF from Redis Cache for loan: ${loanId} (0 CPU usage!)`);
                const pdfBuffer = Buffer.from(cachedPdfBase64, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="loan-${loanId}.pdf"`);
                return res.send(pdfBuffer);
            }
        }
        // =========================================================

        console.log('📄 Generating PDF for loan:', loanId);

        // ✅ 1. อ่าน HTML Template
        const templatePath = path.join(__dirname, '../templates/loan-form-template.html');
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        // ✅ 2. หา Path ของไฟล์โลโก้
        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        const logoUrl = `file://${logoPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        // ✅ 3. หา Path ของไฟล์ฟ้อนต์
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        if (!fs.existsSync(logoPath)) console.error('❌ Logo file not found at:', logoPath);
        if (!fs.existsSync(fontPath)) console.error('❌ Font file not found at:', fontPath);

        // ✅ 4. แทนที่ Placeholder
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);

        // ✅ 5. Compile Template
        const templateCompiled = handlebars.compile(htmlContent);
        
        const pType = formData.product?.type || ''; // ดึงค่าประเภทสินค้ามาเก็บไว้ก่อน
        
        // ✅ 6. เตรียม Data
        // const data = {
        //     onlineChecked: 'checked',
        //     offlineChecked: '',
        //     // goldChecked: formData.product.type === 'gold' ? 'checked' : '',
        //     // generalChecked: formData.product.type === 'general' ? 'checked' : '',
        //     // motorcycleChecked: formData.product.type === 'motorcycle' ? 'checked' : '',
        //     // 🟢 แก้ไขเงื่อนไข Checkbox ให้เช็คจากคำภาษาลาวที่ส่งมา
        //     goldChecked: pType.includes('ຄຳ') ? 'checked' : '',
        //     generalChecked: pType.includes('ທົ່ວໄປ') ? 'checked' : '',
        //     motorcycleChecked: (pType.includes('ລົດ') || pType.includes('ລົດຈັກ')) ? 'checked' : '',
        //     customer: {
        //         fullname: formData.customer.fullname || '________________',
        //         dob: formatDate(formData.customer.dob),
        //         age: formData.customer.age || '___',
        //         occupation: formData.customer.occupation || '________________',
        //         phone: formData.customer.phone || '________________',
        //         address: {
        //             village: formData.customer.address.village || '____________',
        //             district: formData.customer.address.district || '____________',
        //             province: formData.customer.address.province || '____________'
        //         },
        //         idCard: formData.customer.idCard || '________________',
        //         censusNo: formData.customer.censusNo || '________________',
        //         unit: formData.customer.unit || '______',
        //         issuePlace: formData.customer.issuePlace || '________________',
        //         issueDate: formatDate(formData.customer.issueDate)
        //     },
        //     work: {
        //         companyName: formData.work.companyName || '________________',
        //         address: {
        //             village: formData.work.address.village || '____________',
        //             district: formData.work.address.district || '____________',
        //             province: formData.work.address.province || '____________'
        //         },
        //         phone: formData.work.phone || '________________',
        //         businessType: formData.work.businessType || '________________',
        //         businessDetail: formData.work.businessDetail || '________________',
        //         durationMonths: formData.work.durationMonths || '___',
        //         durationYears: formData.work.durationYears || '___',
        //         department: formData.work.department || '________________',
        //         position: formData.work.position || '________________',
        //         salary: formatCurrency(formData.work.salary)
        //     },
        //     product: {
        //         type: formData.product?.type || formData.product?.type_name || formData.product?.productType?.type_name || '________________',
        //         brand: formData.product.brand || '________________',
        //         model: formData.product.model || '________________',
        //         price: formatCurrency(formData.product.price),
        //         downPayment: formatCurrency(formData.product.downPayment),
        //         approvedAmount: formatCurrency(formData.product.approvedAmount),
        //         loanTerm: formData.product.loanTerm || '___',
        //         interestRate: formData.product.interestRate || '___',
        //         totalInterest: formatCurrency(formData.product.totalInterest),
        //         fee: formatCurrency(formData.product.fee),
        //         firstInstallment: formatCurrency(formData.product.firstInstallment),
        //         monthlyPayment: formatCurrency(formData.product.monthlyPayment),
        //         paymentDay: formData.product.paymentDay || '___',
        //         store: formData.product.store || '________________________________________________________'
        //     },
        //     hasGuarantor: formData.hasGuarantor || formData.hasReference,
        //     guarantorChecked: formData.hasGuarantor ? 'checked' : '',
        //     referenceChecked: formData.hasReference ? 'checked' : '',
        //     guarantor: {
        //         name: formData.guarantor?.name || '________________',
        //         dob: formatDate(formData.guarantor?.dob),
        //         age: formData.guarantor?.age || '___',
        //         occupation: formData.guarantor?.occupation || '________________',
        //         phone: formData.guarantor?.phone || '________________',
        //         address: {
        //             village: formData.guarantor?.address?.village || '____________',
        //             district: formData.guarantor?.address?.district || '____________',
        //             province: formData.guarantor?.address?.province || '____________'
        //         },
        //         idCard: formData.guarantor?.idCard || '________________',
        //         parentChecked: formData.guarantor?.relationship === 'parent' ? 'checked' : '',
        //         spouseChecked: formData.guarantor?.relationship === 'spouse' ? 'checked' : '',
        //         otherChecked: formData.guarantor?.relationship === 'other' ? 'checked' : '',
        //         relationshipOther: formData.guarantor?.relationshipOther || '',
        //         work: {
        //             companyName: formData.guarantor?.work?.companyName || '________________',
        //             address: {
        //                 village: formData.guarantor?.work?.address?.village || '____________',
        //                 district: formData.guarantor?.work?.address?.district || '____________',
        //                 province: formData.guarantor?.work?.address?.province || '____________'
        //             },
        //             position: formData.guarantor?.work?.position || '________________',
        //             phone: formData.guarantor?.work?.phone || '________________',
        //             salary: formatCurrency(formData.guarantor?.work?.salary)
        //         }
        //     },
        //     signatures: {
        //         borrowerDate: formatDate(formData.signatures?.borrowerDate),
        //         guarantorDate: formatDate(formData.signatures?.guarantorDate),
        //         staffDate: formatDate(formData.signatures?.staffDate)
        //     }
        // };
        // ✅ 6. เตรียม Data
        const data = {
            onlineChecked: 'checked',
            offlineChecked: '',
            // 🟢 แก้ไขเงื่อนไข Checkbox ให้เช็คจากคำภาษาลาวที่ส่งมา
            goldChecked: pType.includes('ຄຳ') ? 'checked' : '',
            generalChecked: pType.includes('ທົ່ວໄປ') ? 'checked' : '',
            motorcycleChecked: (pType.includes('ລົດ') || pType.includes('ລົດຈັກ')) ? 'checked' : '',
            
            customer: {
                fullname: formData.customer?.fullname || '________________',
                dob: formatDate(formData.customer?.dob),
                age: formData.customer?.age || '___',
                occupation: formData.customer?.occupation || '________________',
                phone: formData.customer?.phone || '________________',
                address: {
                    village: formData.customer?.address?.village || '____________',
                    district: formData.customer?.address?.district || '____________',
                    province: formData.customer?.address?.province || '____________'
                },
                idCard: formData.customer?.idCard || '________________',
                censusNo: formData.customer?.censusBook || '________________', // 🟢 ປ່ຽນຈາກ censusNo ເປັນ censusBook
                unit: formData.customer?.unit || '______',
                issuePlace: formData.customer?.censusAuthorizeBy || formData.customer?.idCardPlace || '________________', // 🟢 ປ່ຽນການດຶງສະຖານທີ່ອອກ
                issueDate: formatDate(formData.customer?.idCardIssueDate) // 🟢 ປ່ຽນຈາກ issueDate ເປັນ idCardIssueDate
            },
            
            work: {
                companyName: formData.work?.companyName || '________________',
                address: {
                    village: formData.work?.address?.village || '____________',
                    district: formData.work?.address?.district || '____________',
                    province: formData.work?.address?.province || '____________'
                },
                phone: formData.work?.phone || '________________',
                businessType: formData.work?.businessType || '________________',
                businessDetail: formData.work?.businessDetail || '________________',
                durationMonths: formData.work?.workMonths || '___', // 🟢 ປ່ຽນຊື່ໃຫ້ກົງກັບ Frontend
                durationYears: formData.work?.workYears || '___', // 🟢 ປ່ຽນຊື່ໃຫ້ກົງກັບ Frontend
                department: formData.work?.department || '________________',
                position: formData.work?.position || '________________',
                salary: formatCurrency(formData.work?.salary)
            },
            
            product: {
                type: formData.product?.type || formData.product?.type_name || formData.product?.productType?.type_name || '________________',
                brand: formData.product?.brand || '________________',
                model: formData.product?.model || '________________',
                price: formatCurrency(formData.product?.price),
                downPayment: formatCurrency(formData.product?.downPayment),
                approvedAmount: formatCurrency(formData.product?.approvedAmount),
                loanTerm: formData.product?.loanTerm || '___',
                interestRate: formData.product?.interestRate || '___',
                totalInterest: formatCurrency(formData.product?.totalInterest),
                fee: formatCurrency(formData.product?.fee),
                firstInstallment: formatCurrency(formData.product?.firstInstallment),
                monthlyPayment: formatCurrency(formData.product?.monthlyPayment),
                paymentDay: formData.product?.paymentDay || '___',
                store: formData.shop?.branch || formData.product?.store || '________________________________________________________' // 🟢 ດຶງສາຂາຮ້ານມາໃສ່
            },
            
            hasGuarantor: formData.hasGuarantor || formData.hasReference,
            guarantorChecked: formData.hasGuarantor ? 'checked' : '',
            referenceChecked: formData.hasReference ? 'checked' : '',
            
            guarantor: {
                name: formData.guarantor?.fullname || '________________', // 🟢 ປ່ຽນຊື່ໃຫ້ກົງ
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
                
                parentChecked: formData.guarantor?.relationship === 'ພໍ່' || formData.guarantor?.relationship === 'ແມ່' ? 'checked' : '',
                spouseChecked: formData.guarantor?.relationship === 'ຜົວ' || formData.guarantor?.relationship === 'ເມຍ' ? 'checked' : '',
                otherChecked: (formData.guarantor?.relationship && !['ພໍ່', 'ແມ່', 'ຜົວ', 'ເມຍ'].includes(formData.guarantor?.relationship)) ? 'checked' : '',
                relationshipOther: (!['ພໍ່', 'ແມ່', 'ຜົວ', 'ເມຍ'].includes(formData.guarantor?.relationship)) ? formData.guarantor?.relationship : '',
                
                // 🟢 ແກ້ໄຂການດຶງຂໍ້ມູນວຽກຜູ້ຄ້ຳ ໃຫ້ດຶງຈາກ guarantorWork ໂດຍກົງ!
                work: {
                    companyName: formData.guarantorWork?.companyName || '________________',
                    address: {
                        village: formData.guarantorWork?.address?.village || '____________',
                        district: formData.guarantorWork?.address?.district || '____________',
                        province: formData.guarantorWork?.address?.province || '____________'
                    },
                    position: formData.guarantorWork?.position || '________________',
                    phone: formData.guarantorWork?.phone || '________________',
                    salary: formatCurrency(formData.guarantorWork?.salary)
                }
            },
            signatures: {
                borrowerDate: formatDate(formData.signatures?.borrowerDate),
                guarantorDate: formatDate(formData.signatures?.guarantorDate),
                staffDate: formatDate(formData.signatures?.staffDate)
            }
        };

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
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ✅ 8. Generate PDF
        const rawPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '25mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        const pdfBuffer = Buffer.from(rawPdf);

        console.log('✅ PDF generated successfully');

        // =========================================================
        // 🟢 9. Save to Redis (ตั้งเวลา 15 นาที หรือ 900 วินาที)
        // =========================================================
        if (loanId) {
            const cacheKey = `cache:pdf:loan-form:${loanId}`;
            await redisService.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }

        // ✅ 10. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-${loanId || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
    } finally {
        if (browser) await browser.close();
    }
};

export const getCustomerLoanContractPDF = async (req: Request, res: Response) => {
    try {
        const contractId = parseInt(req.params.contractId, 10);
        const loanId = parseInt(req.params.application_id, 10);

        if (!contractId || !loanId) {
            return res.status(400).json({ success: false, message: 'Missing contractId or loanId' });
        }

        // 1. Check Redis Cache
        const cacheKey = `cache:pdf:contract:${contractId}`;
        const cachedPdfBase64 = await redisService.get(cacheKey);

        if (cachedPdfBase64) {
            console.log(`[PDF] 🚀 Serving from Redis Cache for Contract ID: ${contractId}`);
            const pdfBuffer = Buffer.from(cachedPdfBase64, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId}.pdf"`);
            return res.send(pdfBuffer);
        }

        // 2. Fetch Data from Database
        // สมมติใช้ ORM ดึงข้อมูลจากตาราง loan_contract
        const contractDataFromDB = await db.loan_contract.findOne({ 
            where: { id: contractId, loan_id: loanId },
            include: [
                { model: db.product_types, as: 'producttype', attributes: ['id','type_name'] }, 
            ],
                raw: true, nest: true
        });

        if (!contractDataFromDB) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }

        const dbData = contractDataFromDB;
        const contractDateObj = dbData.created_at ? new Date(dbData.created_at) : new Date();

        // 3. Mapping Data (ใช้ Helper ของคุณ)
        const templateData = {
            // -- ข้อมูลสัญญา --
            contractNumber: dbData.loan_contract_number || '________________',
            contractDay: String(contractDateObj.getDate()).padStart(2, '0'),
            contractMonth: String(contractDateObj.getMonth() + 1).padStart(2, '0'),
            contractYear: String(contractDateObj.getFullYear()),

            // -- ประเภทสินค้า (สมมติ DB เก็บ 1=Gold, 2=General, 3=Motorcycle) --
            checkGold: dbData.producttype_id === 1 ? 'checked' : '',
            checkGeneral: dbData.producttype_id === 2 ? 'checked' : '',
            checkMotorcycle: dbData.producttype_id === 3 ? 'checked' : '',

            // -- ข้อมูลลูกค้า --
            cusName: dbData.cus_full_name || '________________',
            cusDob: formatDate(dbData.cus_date_of_birth),
            cusPhone: dbData.cus_phone || '________________',
            cusGender: mapGender(dbData.cus_sex),
            cusMarital: mapMaritalStatus(dbData.cus_marital_status),
            cusOccupation: dbData.cus_occupation || '________________',
            cusIdCard: dbData.cus_id_pass_number || '________________',
            cusIdIssueDate: formatDate(dbData.cus_id_pass_date),
            cusCensus: dbData.cus_census_number || '________________',
            cusIssuePlace: dbData.cus_census_authorize_by || '________________', 
            cusHouseNo: dbData.cus_house_number || '_____',
            cusUnit: dbData.cus_unit ? String(dbData.cus_unit) : '_____',
            cusVillage: dbData.cus_address || '________________', 
            cusLivedYears: dbData.cus_lived_year ? String(dbData.cus_lived_year) : '___',
            cusLiveWith: dbData.cus_lived_with || '________________',
            cusResStatus: mapResidenceStatus(dbData.cus_lived_situation), // ใช้ Helper ของคุณ

            // -- ข้อมูลที่ทำงานลูกค้า --
            workName: dbData.cus_company_name || '________________',
            workType: dbData.cus_company_businessType || '________________',
            workVillage: dbData.cus_company_location || '________________',
            workYears: dbData.cus_company_workYear ? String(dbData.cus_company_workYear) : '___',
            workPosition: dbData.cus_position || '________________',
            workSalary: formatCurrency(dbData.cus_income), // ใช้ Helper ของคุณ
            workSalaryDay: dbData.cus_payroll_date || '___',
            workTotalEmp: dbData.cus_company_emp_number ? String(dbData.cus_company_emp_number) : '___',
            workOtherIncome: formatCurrency(dbData.cus_income_other),
            workOtherSource: dbData.cus_income_other_source || '________________',

            // -- ข้อมูลสินเชื่อและสินค้า --
            prodDesc: dbData.product_detail || '________________',
            prodType: getProductTypeName(dbData.producttype?.type_name), // ใช้ Helper ของคุณ
            prodBrand: dbData.product_brand || '________________',
            prodModel: dbData.product_model || '________________',
            prodPrice: formatCurrency(dbData.product_price),
            prodDown: formatCurrency(dbData.product_down_payment),
            prodApprove: formatCurrency(dbData.total_amount),
            prodInterest: dbData.interest_rate_at_apply ? String(dbData.interest_rate_at_apply) : '___',
            prodTerm: dbData.loan_period ? String(dbData.loan_period) : '___',
            prodTotalInt: formatCurrency(dbData.total_interest),
            prodFee: formatCurrency(dbData.fee),
            prodMonthly: formatCurrency(dbData.monthly_pay),
            prodFirstInst: formatCurrency(dbData.first_installment_amount),
            prodPayDay: dbData.payment_day ? String(dbData.payment_day) : '___',
            
            // -- ข้อมูลรถจักรยานยนต์ --
            isMotorcycle: dbData.producttype_id === 3,
            motorId: dbData.motor_id || '________________',
            motorColor: dbData.motor_color || '________________',
            tankNum: dbData.tank_number || '________________',
            motorWarranty: dbData.motor_warranty ? String(dbData.motor_warranty) : '___',

            // -- ข้อมูลร้านค้า --
            shopBranch: dbData.shop_branch || '________________',
            shopCode: dbData.shop_id || '________________',

            // -- ผู้ค้ำประกัน (Guarantor / Reference) --
            hasGuarantor: !!dbData.ref_name,
            checkGuarantor: !!dbData.ref_name ? 'checked' : '',
            
            guaName: dbData.ref_name || '________________',
            guaDob: formatDate(dbData.ref_date_of_birth),
            guaPhone: dbData.ref_phone || '________________',
            guaGender: mapGender(dbData.ref_sex),
            guaMarital: mapMaritalStatus(dbData.ref_marital_status),
            guaOccupation: dbData.ref_occupation || '________________',
            guaRelation: dbData.ref_relationship || '________________',
            guaIdCard: dbData.ref_id_pass_number || '________________',
            guaIdIssueDate: formatDate(dbData.ref_id_pass_date),
            guaCensus: dbData.ref_census_number || '________________',
            guaCensusIssue: formatDate(dbData.ref_census_created),
            guaIssuePlace: dbData.ref_census_authorize_by || '________________',
            guaHouseNo: dbData.ref_house_number || '_____',
            guaUnit: dbData.ref_unit ? String(dbData.ref_unit) : '_____',
            guaVillage: dbData.ref_address || '________________',
            guaLivedYears: dbData.ref_lived_year ? String(dbData.ref_lived_year) : '___',
            guaLiveWith: dbData.ref_lived_with || '________________',
            guaResStatus: mapResidenceStatus(dbData.ref_lived_situation),

            // -- ข้อมูลที่ทำงานผู้ค้ำประกัน --
            guaWorkName: dbData.ref_company_name || '________________',
            guaWorkType: dbData.ref_company_businessType || '________________',
            guaWorkVillage: dbData.ref_company_location || '________________',
            guaWorkYears: dbData.ref_company_workYear ? String(dbData.ref_company_workYear) : '___',
            guaWorkPos: dbData.ref_position || '________________',
            guaWorkSalary: formatCurrency(dbData.ref_income),
            guaWorkSalaryDay: dbData.ref_payroll_date || '___',
            guaWorkTotalEmp: dbData.ref_company_emp_number ? String(dbData.ref_company_emp_number) : '___',
            guaWorkOtherInc: formatCurrency(dbData.ref_income_other),
            guaWorkOtherSource: dbData.ref_income_other_source || '________________',
        };

        // 4. Generate PDF
        const pdfBuffer = await generatePdfBufferFromData(templateData);

        // 5. Cache & Send Response
        await redisService.set(cacheKey, pdfBuffer.toString('base64'), 900);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Database Contract PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate DB PDF', error: error.message });
    }
};

export const generateLoanContractPDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { formData, contractId } = req.body;

        // =========================================================
        // 🟢 1. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (contractId) {
            const cacheKey = `cache:pdf:contract:${contractId}`;
            const cachedPdfBase64 = await redisService.get(cacheKey);

            if (cachedPdfBase64) {
                console.log(`[PDF] 🚀 Serving Contract PDF from Redis Cache for ID: ${contractId}`);
                const pdfBuffer = Buffer.from(cachedPdfBase64, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId}.pdf"`);
                return res.send(pdfBuffer);
            }
        }
        // =========================================================

        console.log('📄 Generating Contract PDF for ID:', contractId);

        const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
        if (!fs.existsSync(templatePath)) throw new Error(`Template file not found at: ${templatePath}`);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);
        const templateCompiled = handlebars.compile(htmlContent);

        const data = {
            contractNumber: formData.contractNumber || '________________',
            contractDay: formData.contractDate?.day || '___',
            contractMonth: formData.contractDate?.month || '___',
            contractYear: formData.contractDate?.year || '______',

            checkGold: formData.productType?.gold ? 'checked' : '',
            checkGeneral: formData.productType?.general ? 'checked' : '',
            checkMotorcycle: formData.productType?.motorcycle ? 'checked' : '',

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
            
            isMotorcycle: formData.productType?.motorcycle,
            motorId: formData.product?.motorcycle?.motorId || '________________',
            motorColor: formData.product?.motorcycle?.motorColor || '________________',
            tankNum: formData.product?.motorcycle?.tankNumber || '________________',
            motorIns: formatCurrency(formData.product?.motorcycle?.insurance),
            motorWarranty: formData.product?.motorcycle?.motorWarranty || '___',

            shopName: formData.shop?.name || '________________',
            shopBranch: formData.shop?.branch || '________________',
            shopCode: formData.shop?.code || '________________',

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

        const html = templateCompiled(data);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
                '--font-render-hinting=none', '--disable-web-security',
                '--allow-file-access-from-files', '--allow-file-access'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const rawPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '25mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });
        const pdfBuffer = Buffer.from(rawPdf);

        console.log('✅ Contract PDF generated successfully');

        // =========================================================
        // 🟢 2. Save to Redis (ตั้งเวลา 15 นาที)
        // =========================================================
        if (contractId) {
            const cacheKey = `cache:pdf:contract:${contractId}`;
            await redisService.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Contract PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Contract PDF', error: error.message });
    } finally {
        if (browser) await browser.close();
    }
};

export const generateRepaymentSchedulePDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { loanData, scheduleRows, totals } = req.body;
        const loanId = loanData?.loan_id;

        // =========================================================
        // 🟢 1. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (loanId) {
            const cacheKey = `cache:pdf:schedule:${loanId}`;
            const cachedPdfBase64 = await redisService.get(cacheKey);

            if (cachedPdfBase64) {
                console.log(`[PDF] 🚀 Serving Schedule PDF from Redis Cache for loan: ${loanId}`);
                const pdfBuffer = Buffer.from(cachedPdfBase64, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="schedule-${loanId}.pdf"`);
                return res.send(pdfBuffer);
            }
        }
        // =========================================================

        console.log('📄 Generating Repayment Schedule PDF for loan:', loanId);

        const templatePath = path.join(__dirname, '../templates/repayment-schedule-template.html');
        if (!fs.existsSync(templatePath)) throw new Error(`Template file not found at: ${templatePath}`);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        let htmlContent = templateSource.replace('{{fontPath}}', fontUrl);

        // =========================================================
        // 🟢 2. ໂຫຼດຮູບ QR Code ແປງເປັນ Base64
        // =========================================================
        // ໝາຍເຫດ: ປັບ path ໃຫ້ກົງກັບທີ່ຢູ່ຈິງຂອງໂຟນເດີ public ຂອງທ່ານ
        const qrPath = path.resolve(__dirname, '../../public/image/qr_code.jpeg'); 
        let qrCodeBase64 = '';
        if (fs.existsSync(qrPath)) {
            const qrBuffer = fs.readFileSync(qrPath);
            qrCodeBase64 = `data:image/jpeg;base64,${qrBuffer.toString('base64')}`;
        } else {
            console.warn(`⚠️ ບໍ່ພົບໄຟລ໌ QR Code ຢູ່ທີ່: ${qrPath}`);
        }
        // =========================================================

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

            schedule: scheduleRows.map((row: any) => ({
                installment_number: row.installment_number,
                due_date: formatDate(row.due_date),
                principal: formatCurrency(row.principal),
                interest: formatCurrency(row.interest),
                total_amount: formatCurrency(row.total_amount),
                remaining_balance: formatCurrency(row.remaining_balance)
            })),

            totalPrincipal: formatCurrency(totals.principal),
            totalInterest: formatCurrency(totals.interest),
            totalAmount: formatCurrency(totals.amount),
            
            // 🟢 ສົ່ງ Base64 ຂອງ QR Code ໄປໃຫ້ HTML Template ໃຊ້ງານ
            qrCodeBase64: qrCodeBase64 
        };

        const templateCompiled = handlebars.compile(htmlContent);
        const html = templateCompiled(data);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
                '--font-render-hinting=none', '--disable-web-security',
                '--allow-file-access-from-files', '--allow-file-access'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });

        await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, 500));

        const rawPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });
        const pdfBuffer = Buffer.from(rawPdf);
        
        console.log('✅ Schedule PDF generated successfully');

        // =========================================================
        // 🟢 2. Save to Redis (ตั้งเวลา 15 นาที)
        // =========================================================
        if (loanId) {
            const cacheKey = `cache:pdf:schedule:${loanId}`;
            await redisService.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="schedule-${loanId || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Schedule PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Schedule PDF', error: error.message });
    } finally {
        if (browser) await browser.close();
    }
};

export const generateDeliveryReceiptPDF = async (req: Request, res: Response) => {
    let browser = null;

    try {
        const { loanData, receiptData, receiverPhone, deliveryAddress } = req.body;
        const receiptId = receiptData?.receipts_id || loanData?.delivery_receipts?.[0]?.receipts_id;

        // =========================================================
        // 🟢 1. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (receiptId) {
            const cacheKey = `cache:pdf:receipt:${receiptId}`;
            const cachedPdfBase64 = await redisService.get(cacheKey);

            if (cachedPdfBase64) {
                console.log(`[PDF] 🚀 Serving Receipt PDF from Redis Cache for receipt: ${receiptId}`);
                const pdfBuffer = Buffer.from(cachedPdfBase64, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptId}.pdf"`);
                return res.send(pdfBuffer);
            }
        }
        // =========================================================

        console.log('📄 Generating Delivery Receipt PDF for receipt:', receiptId);
        
        const templatePath = path.join(__dirname, '../templates/loan-receipt-template.html');
        if (!fs.existsSync(templatePath)) throw new Error(`Template file not found at: ${templatePath}`);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        
        const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;

        let htmlContent = templateSource;
        htmlContent = htmlContent.replace(/{{logoPath}}/g, logoDataUri);
        htmlContent = htmlContent.replace(/{{fontPath}}/g, fontUrl);

        const customer = loanData?.customer || {};
        const product = loanData?.product || {};
        const partner = product?.partner || {};
        const workInfo = customer?.work_info?.[0] || customer?.customer_work_infos?.[0] || {};
        const guarantor = loanData?.loan_guarantors?.[0] || null;
        const guarantorWork = guarantor?.work_info?.[0] || guarantor?.work || {};
        const receipt = receiptData || loanData?.delivery_receipts?.[0] || {};
        const today = new Date();

        const getVal = (val: any, defaultStr = '________________') => {
            if (val === null || val === undefined || val === '') return defaultStr;
            return val;
        };

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

        const cusAddr = parseAddress(customer.address);
        const workAddr = parseAddress(workInfo.address || workInfo.location);
        const guaAddr = parseAddress(guarantor?.address);
        const guaWorkAddr = parseAddress(guarantorWork?.address || guarantorWork?.location);

        const price = Number(loanData?.total_amount || product.price || 0);
        const downPayment = Number(loanData?.down_payment || 0);
        const approvedAmount = price - downPayment;
        const term = Number(loanData?.loan_period || 0);
        const monthlyPay = Number(loanData?.monthly_pay || 0);
        const totalInterest = (monthlyPay * term) - approvedAmount; 

        const pType = String(product.productType_id || product.product_type?.name || product.type || '');
        const isGold = pType.toLowerCase().includes('gold') || pType.includes('ຄຳ') || pType === '1';
        const isMoto = pType.toLowerCase().includes('motor') || pType.includes('ລົດ') || pType === '2';
        const isGen = !isGold && !isMoto;

        const data = {
            logoPath: logoDataUri,
            contractNumber: getVal(receipt?.receipts_id),
            contractDay: String(today.getDate()).padStart(2, '0'),
            contractMonth: String(today.getMonth() + 1).padStart(2, '0'),
            contractYear: String(today.getFullYear()),
            
            checkGold: isGold ? '✔' : '', 
            checkMotorcycle: isMoto ? '✔' : '',
            checkGeneral: isGen ? '✔' : '',

            cusName: getVal(`${customer.first_name || ''} ${customer.last_name || ''}`.trim()),
            cusDob: getVal(formatDate(customer.date_of_birth)),
            cusPhone: getVal(customer.phone),
            cusIdCard: getVal(customer.identity_number),
            cusVillage: getVal(cusAddr.village, '____________'),
            cusDistrict: getVal(cusAddr.district, '____________'),
            cusProvince: getVal(cusAddr.province, '____________'),

            workName: getVal(workInfo.company_name || workInfo.companyName),
            workVillage: getVal(workAddr.village, '____________'), 
            workDistrict: getVal(workAddr.district, '____________'),
            workProvince: getVal(workAddr.province, '____________'),
            workDepartment: getVal(workInfo.department),
            workYears: getVal(workInfo.duration_years || workInfo.workYears, '___'),
            workPosition: getVal(workInfo.position || customer.occupation),
            workSalary: getVal(formatCurrency(workInfo.salary || customer.income_per_month)),

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

            approveChecked: receipt.status === 'approved' ? '✔' : '',
            rejectChecked: receipt.status === 'rejected' ? '✔' : ''
        };

        const templateCompiled = handlebars.compile(htmlContent);
        const html = templateCompiled(data);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
                '--font-render-hinting=none', '--disable-web-security',
                '--allow-file-access-from-files', '--allow-file-access'
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

        const rawPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        const pdfBuffer = Buffer.from(rawPdf);

        console.log('✅ Delivery Receipt PDF generated successfully');

        // =========================================================
        // 🟢 2. Save to Redis (ตั้งเวลา 15 นาที)
        // =========================================================
        if (receiptId) {
            const cacheKey = `cache:pdf:receipt:${receiptId}`;
            await redisService.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptId || 'draft'}.pdf"`);
        res.send(pdfBuffer);

    } catch (error: any) {
        console.error('❌ Delivery Receipt PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Delivery Receipt PDF', error: error.message });
    } finally {
        if (browser) await browser.close();
    }
};

// // ==========================================
// // Helper Functions
// // ==========================================
// function mapGender(gender: string | undefined): string {
//     if (gender === 'male') return 'ຊາຍ';
//     if (gender === 'female') return 'ຍິງ';
//     return '________________';
// }
// function mapMaritalStatus(status: string | undefined): string {
//     if (status === 'single') return 'ໂສດ';
//     if (status === 'married') return 'ແຕ່ງງານແລ້ວ';
//     if (status === 'divorced') return 'ຢ່າຮ້າງ';
//     return '________________';
// }
// function mapResidenceStatus(status: string | undefined): string {
//     if (status === 'own') return 'ເຮືອນຕົວເອງ';
//     if (status === 'rent') return 'ເຊົ່າ';
//     if (status === 'family') return 'ຢູ່ກັບຄອບຄົວ';
//     return '________________';
// }
// function formatDate(dateStr: string | null): string {
//     if (!dateStr) return '___/___/____';
//     const date = new Date(dateStr);
//     if (isNaN(date.getTime())) return '___/___/____';
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}/${month}/${year}`;
// }
// function formatCurrency(amount: number | null | string): string {
//     if (!amount && amount !== 0) return '________________';
//     const num = typeof amount === 'string' ? parseFloat(amount) : amount;
//     if (isNaN(num)) return '________________';
//     return num.toLocaleString('lo-LA') + ' ກີບ';
// }
// function getProductTypeName(type: string): string {
//     const types: Record<string, string> = { gold: 'ສິນຄ້າຄຳ', general: 'ສິນຄ້າທົ່ວໄປ', motorcycle: 'ສິນຄ້າລົດຈັກ' };
//     return types[type] || '________________';
// }