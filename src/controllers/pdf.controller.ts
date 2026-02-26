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
        // const templatePath = path.join(__dirname, '../templates/loan-form-template.html');
        const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
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