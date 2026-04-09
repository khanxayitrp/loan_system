"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeliveryReceiptPDF = exports.generateRepaymentSchedulePDF = exports.generateLoanContractPDF = exports.getCustomerLoanContractPDF = exports.generateLoanPDF = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
const redis_service_1 = __importDefault(require("../services/redis.service")); // 🟢 1. Import Redis
const init_models_1 = require("../models/init-models"); // 🟢 2. Import DB Models
const pdf_service_1 = require("../services/pdf.service");
const formatters_1 = require("../utils/formatters");
const generateLoanPDF = async (req, res) => {
    let browser = null;
    try {
        const { formData, loanId } = req.body;
        console.log('✅ formData received for PDF generation:', formData); // ตรวจสอบข้อมูลที่ได้รับก่อนส่งให้ Template
        // =========================================================
        // 🟢 2. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (loanId) {
            const cacheKey = `cache:pdf:loan-form:${loanId}`;
            const cachedPdfBase64 = await redis_service_1.default.get(cacheKey);
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
        const templatePath = path_1.default.join(__dirname, '../templates/loan-form-template.html');
        const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
        // ✅ 2. หา Path ของไฟล์โลโก้
        const logoPath = path_1.default.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs_1.default.existsSync(logoPath) ? fs_1.default.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        const logoUrl = `file://${logoPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
        // ✅ 3. หา Path ของไฟล์ฟ้อนต์
        const fontPath = path_1.default.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
        if (!fs_1.default.existsSync(logoPath))
            console.error('❌ Logo file not found at:', logoPath);
        if (!fs_1.default.existsSync(fontPath))
            console.error('❌ Font file not found at:', fontPath);
        // ✅ 4. แทนที่ Placeholder
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);
        // ✅ 5. Compile Template
        const templateCompiled = handlebars_1.default.compile(htmlContent);
        const pType = formData.product?.type || ''; // ดึงค่าประเภทสินค้ามาเก็บไว้ก่อน
        // ✅ 6. เตรียม Data
        const data = {
            onlineChecked: 'checked',
            offlineChecked: '',
            // goldChecked: formData.product.type === 'gold' ? 'checked' : '',
            // generalChecked: formData.product.type === 'general' ? 'checked' : '',
            // motorcycleChecked: formData.product.type === 'motorcycle' ? 'checked' : '',
            // 🟢 แก้ไขเงื่อนไข Checkbox ให้เช็คจากคำภาษาลาวที่ส่งมา
            goldChecked: pType.includes('ຄຳ') ? 'checked' : '',
            generalChecked: pType.includes('ທົ່ວໄປ') ? 'checked' : '',
            motorcycleChecked: (pType.includes('ລົດ') || pType.includes('ລົດຈັກ')) ? 'checked' : '',
            customer: {
                fullname: formData.customer.fullname || '________________',
                dob: (0, formatters_1.formatDate)(formData.customer.dob),
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
                issueDate: (0, formatters_1.formatDate)(formData.customer.issueDate)
            },
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
                salary: (0, formatters_1.formatCurrency)(formData.work.salary)
            },
            product: {
                type: formData.product?.type || formData.product?.type_name || formData.product?.productType?.type_name || '________________',
                brand: formData.product.brand || '________________',
                model: formData.product.model || '________________',
                price: (0, formatters_1.formatCurrency)(formData.product.price),
                downPayment: (0, formatters_1.formatCurrency)(formData.product.downPayment),
                approvedAmount: (0, formatters_1.formatCurrency)(formData.product.approvedAmount),
                loanTerm: formData.product.loanTerm || '___',
                interestRate: formData.product.interestRate || '___',
                totalInterest: (0, formatters_1.formatCurrency)(formData.product.totalInterest),
                fee: (0, formatters_1.formatCurrency)(formData.product.fee),
                firstInstallment: (0, formatters_1.formatCurrency)(formData.product.firstInstallment),
                monthlyPayment: (0, formatters_1.formatCurrency)(formData.product.monthlyPayment),
                paymentDay: formData.product.paymentDay || '___',
                store: formData.product.store || '________________________________________________________'
            },
            hasGuarantor: formData.hasGuarantor || formData.hasReference,
            guarantorChecked: formData.hasGuarantor ? 'checked' : '',
            referenceChecked: formData.hasReference ? 'checked' : '',
            guarantor: {
                name: formData.guarantor?.name || '________________',
                dob: (0, formatters_1.formatDate)(formData.guarantor?.dob),
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
                    salary: (0, formatters_1.formatCurrency)(formData.guarantor?.work?.salary)
                }
            },
            signatures: {
                borrowerDate: (0, formatters_1.formatDate)(formData.signatures?.borrowerDate),
                guarantorDate: (0, formatters_1.formatDate)(formData.signatures?.guarantorDate),
                staffDate: (0, formatters_1.formatDate)(formData.signatures?.staffDate)
            }
        };
        const html = templateCompiled(data);
        // ✅ 7. Launch Puppeteer
        browser = await puppeteer_1.default.launch({
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
            await redis_service_1.default.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }
        // ✅ 10. Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-${loanId || 'draft'}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
    }
    finally {
        if (browser)
            await browser.close();
    }
};
exports.generateLoanPDF = generateLoanPDF;
const getCustomerLoanContractPDF = async (req, res) => {
    try {
        const contractId = parseInt(req.params.contractId, 10);
        const loanId = parseInt(req.params.application_id, 10);
        if (!contractId || !loanId) {
            return res.status(400).json({ success: false, message: 'Missing contractId or loanId' });
        }
        // 1. Check Redis Cache
        const cacheKey = `cache:pdf:contract:${contractId}`;
        const cachedPdfBase64 = await redis_service_1.default.get(cacheKey);
        if (cachedPdfBase64) {
            console.log(`[PDF] 🚀 Serving from Redis Cache for Contract ID: ${contractId}`);
            const pdfBuffer = Buffer.from(cachedPdfBase64, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId}.pdf"`);
            return res.send(pdfBuffer);
        }
        // 2. Fetch Data from Database
        // สมมติใช้ ORM ดึงข้อมูลจากตาราง loan_contract
        const contractDataFromDB = await init_models_1.db.loan_contract.findOne({
            where: { id: contractId, loan_id: loanId },
            include: [
                { model: init_models_1.db.product_types, as: 'producttype', attributes: ['id', 'type_name'] },
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
            cusDob: (0, formatters_1.formatDate)(dbData.cus_date_of_birth),
            cusPhone: dbData.cus_phone || '________________',
            cusGender: (0, formatters_1.mapGender)(dbData.cus_sex),
            cusMarital: (0, formatters_1.mapMaritalStatus)(dbData.cus_marital_status),
            cusOccupation: dbData.cus_occupation || '________________',
            cusIdCard: dbData.cus_id_pass_number || '________________',
            cusIdIssueDate: (0, formatters_1.formatDate)(dbData.cus_id_pass_date),
            cusCensus: dbData.cus_census_number || '________________',
            cusIssuePlace: dbData.cus_census_authorize_by || '________________',
            cusHouseNo: dbData.cus_house_number || '_____',
            cusUnit: dbData.cus_unit ? String(dbData.cus_unit) : '_____',
            cusVillage: dbData.cus_address || '________________',
            cusLivedYears: dbData.cus_lived_year ? String(dbData.cus_lived_year) : '___',
            cusLiveWith: dbData.cus_lived_with || '________________',
            cusResStatus: (0, formatters_1.mapResidenceStatus)(dbData.cus_lived_situation), // ใช้ Helper ของคุณ
            // -- ข้อมูลที่ทำงานลูกค้า --
            workName: dbData.cus_company_name || '________________',
            workType: dbData.cus_company_businessType || '________________',
            workVillage: dbData.cus_company_location || '________________',
            workYears: dbData.cus_company_workYear ? String(dbData.cus_company_workYear) : '___',
            workPosition: dbData.cus_position || '________________',
            workSalary: (0, formatters_1.formatCurrency)(dbData.cus_income), // ใช้ Helper ของคุณ
            workSalaryDay: dbData.cus_payroll_date || '___',
            workTotalEmp: dbData.cus_company_emp_number ? String(dbData.cus_company_emp_number) : '___',
            workOtherIncome: (0, formatters_1.formatCurrency)(dbData.cus_income_other),
            workOtherSource: dbData.cus_income_other_source || '________________',
            // -- ข้อมูลสินเชื่อและสินค้า --
            prodDesc: dbData.product_detail || '________________',
            prodType: (0, formatters_1.getProductTypeName)(dbData.producttype?.type_name), // ใช้ Helper ของคุณ
            prodBrand: dbData.product_brand || '________________',
            prodModel: dbData.product_model || '________________',
            prodPrice: (0, formatters_1.formatCurrency)(dbData.product_price),
            prodDown: (0, formatters_1.formatCurrency)(dbData.product_down_payment),
            prodApprove: (0, formatters_1.formatCurrency)(dbData.total_amount),
            prodInterest: dbData.interest_rate_at_apply ? String(dbData.interest_rate_at_apply) : '___',
            prodTerm: dbData.loan_period ? String(dbData.loan_period) : '___',
            prodTotalInt: (0, formatters_1.formatCurrency)(dbData.total_interest),
            prodFee: (0, formatters_1.formatCurrency)(dbData.fee),
            prodMonthly: (0, formatters_1.formatCurrency)(dbData.monthly_pay),
            prodFirstInst: (0, formatters_1.formatCurrency)(dbData.first_installment_amount),
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
            guaDob: (0, formatters_1.formatDate)(dbData.ref_date_of_birth),
            guaPhone: dbData.ref_phone || '________________',
            guaGender: (0, formatters_1.mapGender)(dbData.ref_sex),
            guaMarital: (0, formatters_1.mapMaritalStatus)(dbData.ref_marital_status),
            guaOccupation: dbData.ref_occupation || '________________',
            guaRelation: dbData.ref_relationship || '________________',
            guaIdCard: dbData.ref_id_pass_number || '________________',
            guaIdIssueDate: (0, formatters_1.formatDate)(dbData.ref_id_pass_date),
            guaCensus: dbData.ref_census_number || '________________',
            guaCensusIssue: (0, formatters_1.formatDate)(dbData.ref_census_created),
            guaIssuePlace: dbData.ref_census_authorize_by || '________________',
            guaHouseNo: dbData.ref_house_number || '_____',
            guaUnit: dbData.ref_unit ? String(dbData.ref_unit) : '_____',
            guaVillage: dbData.ref_address || '________________',
            guaLivedYears: dbData.ref_lived_year ? String(dbData.ref_lived_year) : '___',
            guaLiveWith: dbData.ref_lived_with || '________________',
            guaResStatus: (0, formatters_1.mapResidenceStatus)(dbData.ref_lived_situation),
            // -- ข้อมูลที่ทำงานผู้ค้ำประกัน --
            guaWorkName: dbData.ref_company_name || '________________',
            guaWorkType: dbData.ref_company_businessType || '________________',
            guaWorkVillage: dbData.ref_company_location || '________________',
            guaWorkYears: dbData.ref_company_workYear ? String(dbData.ref_company_workYear) : '___',
            guaWorkPos: dbData.ref_position || '________________',
            guaWorkSalary: (0, formatters_1.formatCurrency)(dbData.ref_income),
            guaWorkSalaryDay: dbData.ref_payroll_date || '___',
            guaWorkTotalEmp: dbData.ref_company_emp_number ? String(dbData.ref_company_emp_number) : '___',
            guaWorkOtherInc: (0, formatters_1.formatCurrency)(dbData.ref_income_other),
            guaWorkOtherSource: dbData.ref_income_other_source || '________________',
        };
        // 4. Generate PDF
        const pdfBuffer = await (0, pdf_service_1.generatePdfBufferFromData)(templateData);
        // 5. Cache & Send Response
        await redis_service_1.default.set(cacheKey, pdfBuffer.toString('base64'), 900);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ Database Contract PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate DB PDF', error: error.message });
    }
};
exports.getCustomerLoanContractPDF = getCustomerLoanContractPDF;
const generateLoanContractPDF = async (req, res) => {
    let browser = null;
    try {
        const { formData, contractId } = req.body;
        // =========================================================
        // 🟢 1. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (contractId) {
            const cacheKey = `cache:pdf:contract:${contractId}`;
            const cachedPdfBase64 = await redis_service_1.default.get(cacheKey);
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
        const templatePath = path_1.default.join(__dirname, '../templates/loan-contract-template.html');
        if (!fs_1.default.existsSync(templatePath))
            throw new Error(`Template file not found at: ${templatePath}`);
        const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
        const logoPath = path_1.default.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs_1.default.existsSync(logoPath) ? fs_1.default.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        const fontPath = path_1.default.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);
        const templateCompiled = handlebars_1.default.compile(htmlContent);
        const data = {
            contractNumber: formData.contractNumber || '________________',
            contractDay: formData.contractDate?.day || '___',
            contractMonth: formData.contractDate?.month || '___',
            contractYear: formData.contractDate?.year || '______',
            checkGold: formData.productType?.gold ? 'checked' : '',
            checkGeneral: formData.productType?.general ? 'checked' : '',
            checkMotorcycle: formData.productType?.motorcycle ? 'checked' : '',
            cusName: formData.customer?.fullname || '________________',
            cusDob: (0, formatters_1.formatDate)(formData.customer?.dob),
            cusPhone: formData.customer?.phone || '________________',
            cusGender: (0, formatters_1.mapGender)(formData.customer?.gender),
            cusMarital: (0, formatters_1.mapMaritalStatus)(formData.customer?.maritalStatus),
            cusOccupation: formData.customer?.occupation || '________________',
            cusIdCard: formData.customer?.idCard || '________________',
            cusIdIssueDate: (0, formatters_1.formatDate)(formData.customer?.idCardIssueDate),
            cusCensus: formData.customer?.censusBook || '________________',
            cusIdExpiryDate: (0, formatters_1.formatDate)(formData.customer?.idCardExpiryDate),
            cusIssuePlace: formData.customer?.censusAuthorizeBy || '________________',
            cusHouseNo: formData.customer?.houseNumber || '_____',
            cusUnit: formData.customer?.unit || '_____',
            cusVillage: formData.customer?.address?.village || '________________',
            cusDistrict: formData.customer?.address?.district || '________________',
            cusProvince: formData.customer?.address?.province || '________________',
            cusLivedYears: formData.customer?.residenceYears || '___',
            cusLiveWith: formData.customer?.liveWith || '________________',
            cusResStatus: (0, formatters_1.mapResidenceStatus)(formData.customer?.residenceStatus),
            workName: formData.work?.companyName || '________________',
            workType: formData.work?.businessType || '________________',
            workVillage: formData.work?.address?.village || '________________',
            workDistrict: formData.work?.address?.district || '________________',
            workProvince: formData.work?.address?.province || '________________',
            workYears: formData.work?.workYears || '___',
            workPosition: formData.work?.position || '________________',
            workSalary: (0, formatters_1.formatCurrency)(formData.work?.salary),
            workSalaryDay: formData.work?.salaryDay || '___',
            workTotalEmp: formData.work?.totalEmployees || '___',
            workOtherIncome: (0, formatters_1.formatCurrency)(formData.work?.otherIncome),
            workOtherSource: formData.work?.otherIncomeSource || '________________',
            prodDesc: formData.product?.description || '________________',
            prodType: formData.product?.type || '________________',
            prodBrand: formData.product?.brand || '________________',
            prodModel: formData.product?.model || '________________',
            prodPrice: (0, formatters_1.formatCurrency)(formData.product?.price),
            prodDown: (0, formatters_1.formatCurrency)(formData.product?.downPayment),
            prodApprove: (0, formatters_1.formatCurrency)(formData.product?.approvedAmount),
            prodInterest: formData.product?.interestRate || '___',
            prodTerm: formData.product?.loanTerm || '___',
            prodTotalInt: (0, formatters_1.formatCurrency)(formData.product?.totalInterest),
            prodFee: (0, formatters_1.formatCurrency)(formData.product?.fee),
            prodMonthly: (0, formatters_1.formatCurrency)(formData.product?.monthlyPayment),
            prodFirstInst: (0, formatters_1.formatCurrency)(formData.product?.firstInstallment),
            prodPayDay: formData.product?.paymentDay || '___',
            isMotorcycle: formData.productType?.motorcycle,
            motorId: formData.product?.motorcycle?.motorId || '________________',
            motorColor: formData.product?.motorcycle?.motorColor || '________________',
            tankNum: formData.product?.motorcycle?.tankNumber || '________________',
            motorIns: (0, formatters_1.formatCurrency)(formData.product?.motorcycle?.insurance),
            motorWarranty: formData.product?.motorcycle?.motorWarranty || '___',
            shopName: formData.shop?.name || '________________',
            shopBranch: formData.shop?.branch || '________________',
            shopCode: formData.shop?.code || '________________',
            hasGuarantor: formData.hasGuarantor || formData.hasReference,
            checkGuarantor: formData.hasGuarantor ? 'checked' : '',
            checkReference: formData.hasReference ? 'checked' : '',
            guaName: formData.guarantor?.fullname || '________________',
            guaDob: (0, formatters_1.formatDate)(formData.guarantor?.dob),
            guaPhone: formData.guarantor?.phone || '________________',
            guaGender: (0, formatters_1.mapGender)(formData.guarantor?.gender),
            guaMarital: (0, formatters_1.mapMaritalStatus)(formData.guarantor?.maritalStatus),
            guaOccupation: formData.guarantor?.occupation || '________________',
            guaRelation: formData.guarantor?.relationship || '________________',
            guaIdCard: formData.guarantor?.idCard || '________________',
            guaIdIssueDate: (0, formatters_1.formatDate)(formData.guarantor?.idCardIssueDate),
            guaCensus: formData.guarantor?.censusBook || '________________',
            guaCensusIssue: (0, formatters_1.formatDate)(formData.guarantor?.censusBookIssueDate),
            guaIssuePlace: formData.guarantor?.censusAuthorizeBy || '________________',
            guaHouseNo: formData.guarantor?.houseNumber || '_____',
            guaUnit: formData.guarantor?.unit || '_____',
            guaVillage: formData.guarantor?.address?.village || '________________',
            guaDistrict: formData.guarantor?.address?.district || '________________',
            guaProvince: formData.guarantor?.address?.province || '________________',
            guaLivedYears: formData.guarantor?.residenceYears || '___',
            guaLiveWith: formData.guarantor?.liveWith || '________________',
            guaResStatus: (0, formatters_1.mapResidenceStatus)(formData.guarantor?.residenceStatus),
            guaWorkName: formData.guarantorWork?.companyName || '________________',
            guaWorkType: formData.guarantorWork?.businessType || '________________',
            guaWorkVillage: formData.guarantorWork?.address?.village || '________________',
            guaWorkDistrict: formData.guarantorWork?.address?.district || '________________',
            guaWorkProvince: formData.guarantorWork?.address?.province || '________________',
            guaWorkYears: formData.guarantorWork?.workYears || '___',
            guaWorkPos: formData.guarantorWork?.position || '________________',
            guaWorkSalary: (0, formatters_1.formatCurrency)(formData.guarantorWork?.salary),
            guaWorkSalaryDay: formData.guarantorWork?.salaryDay || '___',
            guaWorkTotalEmp: formData.guarantorWork?.totalEmployees || '___',
            guaWorkOtherInc: (0, formatters_1.formatCurrency)(formData.guarantorWork?.otherIncome),
            guaWorkOtherSource: formData.guarantorWork?.otherIncomeSource || '________________',
        };
        const html = templateCompiled(data);
        browser = await puppeteer_1.default.launch({
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
            await redis_service_1.default.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="loan-contract-${contractId || 'draft'}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ Contract PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Contract PDF', error: error.message });
    }
    finally {
        if (browser)
            await browser.close();
    }
};
exports.generateLoanContractPDF = generateLoanContractPDF;
const generateRepaymentSchedulePDF = async (req, res) => {
    let browser = null;
    try {
        const { loanData, scheduleRows, totals } = req.body;
        const loanId = loanData?.loan_id;
        // =========================================================
        // 🟢 1. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (loanId) {
            const cacheKey = `cache:pdf:schedule:${loanId}`;
            const cachedPdfBase64 = await redis_service_1.default.get(cacheKey);
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
        const templatePath = path_1.default.join(__dirname, '../templates/repayment-schedule-template.html');
        if (!fs_1.default.existsSync(templatePath))
            throw new Error(`Template file not found at: ${templatePath}`);
        const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
        const fontPath = path_1.default.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
        let htmlContent = templateSource.replace('{{fontPath}}', fontUrl);
        // =========================================================
        // 🟢 2. ໂຫຼດຮູບ QR Code ແປງເປັນ Base64
        // =========================================================
        // ໝາຍເຫດ: ປັບ path ໃຫ້ກົງກັບທີ່ຢູ່ຈິງຂອງໂຟນເດີ public ຂອງທ່ານ
        const qrPath = path_1.default.resolve(__dirname, '../../public/image/qr_code.jpeg');
        let qrCodeBase64 = '';
        if (fs_1.default.existsSync(qrPath)) {
            const qrBuffer = fs_1.default.readFileSync(qrPath);
            qrCodeBase64 = `data:image/jpeg;base64,${qrBuffer.toString('base64')}`;
        }
        else {
            console.warn(`⚠️ ບໍ່ພົບໄຟລ໌ QR Code ຢູ່ທີ່: ${qrPath}`);
        }
        // =========================================================
        const data = {
            interestTypeName: loanData.interest_type === 'effective_rate' ? 'ຫຼຸດຕົ້ນຫຼຸດດອກ' : 'ສະເໝີຕົວ',
            contractNumber: loanData.loan_contract_number || loanData.loan_id || '________________',
            customerName: `${loanData.customer?.first_name || ''} ${loanData.customer?.last_name || ''}`.trim() || '________________',
            customerAddress: loanData.customer?.address || '________________',
            customerPhone: loanData.customer?.phone || '________________',
            productPrice: (0, formatters_1.formatCurrency)(loanData.product?.price || loanData.total_amount),
            downPayment: (0, formatters_1.formatCurrency)(loanData.down_payment),
            approvedAmount: (0, formatters_1.formatCurrency)(Number(loanData.total_amount) - Number(loanData.down_payment || 0)),
            interestRate: loanData.interest_rate_at_apply,
            interestRateType: loanData.interest_rate_type === 'yearly' ? '(ຕໍ່ປີ)' : '(ຕໍ່ເດືອນ)',
            startDate: (0, formatters_1.formatDate)(scheduleRows.length > 0 ? scheduleRows[0].due_date : null),
            endDate: (0, formatters_1.formatDate)(scheduleRows.length > 0 ? scheduleRows[scheduleRows.length - 1].due_date : null),
            paymentDay: loanData.payment_day || '___',
            loanTerm: loanData.loan_period || '___',
            schedule: scheduleRows.map((row) => ({
                installment_number: row.installment_number,
                due_date: (0, formatters_1.formatDate)(row.due_date),
                principal: (0, formatters_1.formatCurrency)(row.principal),
                interest: (0, formatters_1.formatCurrency)(row.interest),
                total_amount: (0, formatters_1.formatCurrency)(row.total_amount),
                remaining_balance: (0, formatters_1.formatCurrency)(row.remaining_balance)
            })),
            totalPrincipal: (0, formatters_1.formatCurrency)(totals.principal),
            totalInterest: (0, formatters_1.formatCurrency)(totals.interest),
            totalAmount: (0, formatters_1.formatCurrency)(totals.amount),
            // 🟢 ສົ່ງ Base64 ຂອງ QR Code ໄປໃຫ້ HTML Template ໃຊ້ງານ
            qrCodeBase64: qrCodeBase64
        };
        const templateCompiled = handlebars_1.default.compile(htmlContent);
        const html = templateCompiled(data);
        browser = await puppeteer_1.default.launch({
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
            await redis_service_1.default.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="schedule-${loanId || 'draft'}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ Schedule PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Schedule PDF', error: error.message });
    }
    finally {
        if (browser)
            await browser.close();
    }
};
exports.generateRepaymentSchedulePDF = generateRepaymentSchedulePDF;
const generateDeliveryReceiptPDF = async (req, res) => {
    let browser = null;
    try {
        const { loanData, receiptData, receiverPhone, deliveryAddress } = req.body;
        const receiptId = receiptData?.receipts_id || loanData?.delivery_receipts?.[0]?.receipts_id;
        // =========================================================
        // 🟢 1. Check Redis Cache ก่อนสร้างใหม่
        // =========================================================
        if (receiptId) {
            const cacheKey = `cache:pdf:receipt:${receiptId}`;
            const cachedPdfBase64 = await redis_service_1.default.get(cacheKey);
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
        const templatePath = path_1.default.join(__dirname, '../templates/loan-receipt-template.html');
        if (!fs_1.default.existsSync(templatePath))
            throw new Error(`Template file not found at: ${templatePath}`);
        const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
        const logoPath = path_1.default.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs_1.default.existsSync(logoPath) ? fs_1.default.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        const fontPath = path_1.default.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
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
        const getVal = (val, defaultStr = '________________') => {
            if (val === null || val === undefined || val === '')
                return defaultStr;
            return val;
        };
        const parseAddress = (addressStr) => {
            const defAddr = { village: '', district: '', province: '' };
            if (!addressStr)
                return defAddr;
            if (addressStr.includes(',')) {
                const parts = addressStr.split(',').map(p => p.trim());
                return { village: parts[0] || '', district: parts[1] || '', province: parts[2] || '' };
            }
            else {
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
            cusDob: getVal((0, formatters_1.formatDate)(customer.date_of_birth)),
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
            workSalary: getVal((0, formatters_1.formatCurrency)(workInfo.salary || customer.income_per_month)),
            prodDesc: getVal(product.product_name),
            prodType: getVal(isGold ? 'ສິນຄ້າຄຳ' : isMoto ? 'ສິນຄ້າລົດຈັກ' : 'ສິນຄ້າທົ່ວໄປ'),
            prodBrand: getVal(product.brand),
            prodModel: getVal(product.model),
            prodPrice: getVal((0, formatters_1.formatCurrency)(price)),
            prodDown: getVal((0, formatters_1.formatCurrency)(downPayment)),
            prodApprove: getVal((0, formatters_1.formatCurrency)(approvedAmount)),
            prodInterest: getVal(loanData?.interest_rate_at_apply, '___'),
            prodTerm: getVal(term, '___'),
            prodTotalInt: getVal((0, formatters_1.formatCurrency)(totalInterest > 0 ? totalInterest : 0)),
            prodFee: getVal((0, formatters_1.formatCurrency)(loanData?.fee)),
            prodMonthly: getVal((0, formatters_1.formatCurrency)(monthlyPay)),
            prodFirstInst: getVal((0, formatters_1.formatCurrency)(loanData?.first_installment_amount)),
            prodPayDay: getVal(loanData?.payment_day, '___'),
            shopName: getVal(partner.shop_name),
            shopBranch: getVal(partner.branch || 'ສຳນັກງານໃຫຍ່'),
            hasGuarantor: guarantor ? '✔' : '',
            hasReference: !guarantor ? '✔' : '',
            guaName: getVal(guarantor ? `${guarantor.first_name || ''} ${guarantor.last_name || ''}`.trim() : null),
            guaDob: getVal((0, formatters_1.formatDate)(guarantor?.date_of_birth)),
            guaPhone: getVal(guarantor?.phone),
            guaIdCard: getVal(guarantor?.identity_number),
            guaVillage: getVal(guaAddr.village, '____________'),
            guaDistrict: getVal(guaAddr.district, '____________'),
            guaProvince: getVal(guaAddr.province, '____________'),
            guaWorkName: getVal(guarantorWork.company_name),
            guaWorkVillage: getVal(guaWorkAddr.village, '____________'),
            guaWorkDistrict: getVal(guaWorkAddr.district, '____________'),
            guaWorkProvince: getVal(guaWorkAddr.province, '____________'),
            guaIncome: getVal((0, formatters_1.formatCurrency)(guarantorWork.salary || guarantor?.salary)),
            guaRelation: getVal(guarantor?.relationship),
            approveChecked: receipt.status === 'approved' ? '✔' : '',
            rejectChecked: receipt.status === 'rejected' ? '✔' : ''
        };
        const templateCompiled = handlebars_1.default.compile(htmlContent);
        const html = templateCompiled(data);
        browser = await puppeteer_1.default.launch({
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
        }
        catch (e) {
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
            await redis_service_1.default.set(cacheKey, pdfBuffer.toString('base64'), 900);
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${receiptId || 'draft'}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ Delivery Receipt PDF Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate Delivery Receipt PDF', error: error.message });
    }
    finally {
        if (browser)
            await browser.close();
    }
};
exports.generateDeliveryReceiptPDF = generateDeliveryReceiptPDF;
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
