import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const generatePdfBufferFromData = async (mappedData: any): Promise<Buffer> => {
    let browser = null;
    try {
        const templatePath = path.join(__dirname, '../templates/loan-contract-template.html');
        if (!fs.existsSync(templatePath)) throw new Error(`Template file not found at: ${templatePath}`);

        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const logoPath = path.resolve(__dirname, '../../public/image/LOGO INSEE.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath, 'base64') : '';
        const logoDataUri = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';
        // const fontPath = path.resolve(__dirname, '../assets/fonts/Phetsarath_OT.ttf');
        const fontPath = path.resolve(__dirname, '../assets/fonts/phetsarath_ot.ttf');
        // const fontUrl = `file://${fontPath.replace(/\\/g, '/').replace(/ /g, '%20')}`;
        // 🟢 ອ່ານໄຟລ໌ Font ເປັນ Base64 ຖ້າໄຟລ໌ມີຢູ່ຈິງ
        const fontBase64 = fs.existsSync(fontPath) ? fs.readFileSync(fontPath, 'base64') : '';
        // 🟢 ສ້າງ Data URI ສຳລັບ Font
        const fontUrl = fontBase64 ? `data:font/ttf;charset=utf-8;base64,${fontBase64}` : '';

        let htmlContent = templateSource;
        htmlContent = htmlContent.replace('{{logoPath}}', logoDataUri);
        htmlContent = htmlContent.replace('{{fontPath}}', fontUrl);
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
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const rawPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '25mm', left: '15mm', right: '15mm' },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        return Buffer.from(rawPdf);
    } finally {
        if (browser) await browser.close();
    }
};