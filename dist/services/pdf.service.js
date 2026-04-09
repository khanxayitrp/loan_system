"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfBufferFromData = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generatePdfBufferFromData = async (mappedData) => {
    let browser = null;
    try {
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
        const html = templateCompiled(mappedData);
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
        return Buffer.from(rawPdf);
    }
    finally {
        if (browser)
            await browser.close();
    }
};
exports.generatePdfBufferFromData = generatePdfBufferFromData;
