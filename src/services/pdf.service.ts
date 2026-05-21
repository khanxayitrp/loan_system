import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// export const generatePdfBufferFromData = async (mappedData: any): Promise<Buffer> => {
//     let browser = null;
//     try {
//         const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
//         if (!fs.existsSync(templatePath)) throw new Error(`Template file not found at: ${templatePath}`);

//         const templateSource = fs.readFileSync(templatePath, 'utf-8');
//         const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
//         const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
//         const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
//         // const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
//         const fontPath = path.resolve(__dirname, '../assets/fonts/phetsarath_ot.ttf');
//         // const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
//         // 🟢 ອ່ານໄຟລ໌ Font ເປັນ Base64 ຖ້າໄຟລ໌ມີຢູ່ຈິງ
//         const fontBase64 = fs.existsSync(fontPath) ? fs.readFileSync(fontPath, 'base64') : '';
//         // 🟢 ສ້າງ Data URI ສຳລັບ Font
//         const fontUrl = fontBase64 ? `data:font/ttf;charset=utf-8;base64,${fontBase64}` : '';

//         let htmlContent = templateSource;
//         htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
//         htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);
//         const templateCompiled = handlebars.compile(htmlContent);

//         const html = templateCompiled(mappedData);

//         browser = await puppeteer.launch({
//             headless: true,
//             args: [
//                 '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
//                 '--font-render-hinting=none', '--disable-web-security',
//                 '--allow-file-access-from-files', '--allow-file-access',
//                 '--lang=lo-LA,en-US'
//             ]
//         });

//         const page = await browser.newPage();
//         await page.setViewport({ width: 1200, height: 800 });
//         // await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
//         await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
//         // 🟢 เพิ่มบรรทัดนี้เข้าไป เพื่อบังคับให้รอ Base64 Font โหลดเข้าหน้าเว็บเสร็จ 100%
//         await page.evaluateHandle('document.fonts.ready');
//         await new Promise(resolve => setTimeout(resolve, 1000));

//         const rawPdf = await page.pdf({
//             format: 'A4',
//             printBackground: true,
//             margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
//             displayHeaderFooter: false,
//             preferCSSPageSize: true
//         });

//         return Buffer.from(rawPdf);
//     } finally {
//         if (browser) await browser.close();
//     }
// };

export const generatePdfBufferFromData = async (mappedData: any): Promise<Buffer> => {
    let browser = null;
    try {
        const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
        if (!fs.existsSync(templatePath)) throw new Error(`Template file not found at: ${templatePath}`);

        let templateSource = fs.readFileSync(templatePath, 'utf-8');

        // ==========================================
        // 🟢 1. ຈັດການ Font ເປັນ Base64
        // ==========================================
        const fontPath = path.resolve(__dirname, '../assets/fonts/phetsarath_ot.ttf');
        const fontBase64 = fs.existsSync(fontPath) ? fs.readFileSync(fontPath, 'base64') : '';
        const fontUrl = fontBase64 ? `data:font/ttf;charset=utf-8;base64,${fontBase64}` : '';

        // ==========================================
        // 🟢 2. ຈັດການຮູບພາບ Header & Footer ເປັນ Base64
        // (⚠️ ກວດສອບ Path ໃຫ້ກົງກັບໂຟນເດີທີ່ທ່ານເກັບຮູບໄວ້ແທ້ໆ)
        // ==========================================
        const headerPath = path.resolve(__dirname, '../../public/image/latter haed Insee1.png');
        const headerBase64 = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, 'base64') : '';
        const headerDataUri = headerBase64 ? `data:image/png;base64,${headerBase64}` : '';

        const footerPath = path.resolve(__dirname, '../../public/image/footer.png');
        const footerBase64 = fs.existsSync(footerPath) ? fs.readFileSync(footerPath, 'base64') : '';
        const footerDataUri = footerBase64 ? `data:image/png;base64,${footerBase64}` : '';

        // ==========================================
        // 🟢 3. ແທນທີ່ຄ່າຕ່າງໆເຂົ້າໃນ HTML Template
        // ==========================================
        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);
        
        // ເອົາຮູບພາບຍັດໃສ່ mappedData ເພື່ອໃຫ້ Handlebars ດຶງໄປໃຊ້ ({{headerImagePath}} ແລະ {{footerImagePath}})
        mappedData.headerImagePath = headerDataUri;
        mappedData.footerImagePath = footerDataUri;

        const templateCompiled = handlebars.compile(htmlContent);
        const html = templateCompiled(mappedData);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
                '--font-render-hinting=none', '--disable-web-security',
                '--allow-file-access-from-files', '--allow-file-access',
                '--lang=lo-LA,en-US'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // ບັງຄັບໃຫ້ລໍຖ້າ Font ແລະ ຮູບພາບໂຫຼດໃຫ້ສຳເລັດ 100% ກ່ອນພິມ
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ==========================================
        // 🟢 4. ຕັ້ງຄ່າ PDF (ປັບ Margin ເປັນ 0 ເພື່ອໃຫ້ຮູບຕິດຂອບ)
        // ==========================================
        const rawPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', bottom: '0', left: '0', right: '0' }, // 💡 ປ່ຽນເປັນ 0 ໝົດ ເພາະເຮົາໃສ່ Padding ໄວ້ໃນ HTML (body) ແລ້ວ
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        return Buffer.from(rawPdf);
    } finally {
        if (browser) await browser.close();
    }
};