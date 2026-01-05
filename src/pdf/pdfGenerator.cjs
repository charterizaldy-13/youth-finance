/**
 * YouthFinance PDF Generator
 * Server-side PDF generation using Puppeteer and Handlebars
 */

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// ============================================
// HANDLEBARS HELPERS
// ============================================

/**
 * Format number as Indonesian Rupiah
 */
Handlebars.registerHelper('formatRupiah', function (amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
    const num = Math.abs(Number(amount));
    const formatted = new Intl.NumberFormat('id-ID').format(Math.round(num));
    const prefix = amount < 0 ? '-Rp ' : 'Rp ';
    return prefix + formatted;
});

/**
 * Format date in Indonesian locale
 */
Handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '-';
    const d = new Date(date);
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
});

/**
 * Format number as percentage
 */
Handlebars.registerHelper('percent', function (value) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${Math.round(Number(value))}%`;
});

/**
 * Safe text - escape HTML and preserve line breaks
 */
Handlebars.registerHelper('safeText', function (text) {
    if (!text) return '';
    // Escape HTML entities
    const escaped = String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    // Convert newlines to <br>
    return new Handlebars.SafeString(escaped.replace(/\n/g, '<br>'));
});

/**
 * Math helpers
 */
Handlebars.registerHelper('multiply', function (a, b) {
    return (Number(a) || 0) * (Number(b) || 0);
});

Handlebars.registerHelper('divide', function (a, b, multiplier = 1) {
    if (!b || b === 0) return 0;
    return ((Number(a) || 0) / Number(b)) * multiplier;
});

Handlebars.registerHelper('min', function (a, b) {
    return Math.min(Number(a) || 0, Number(b) || 0);
});

Handlebars.registerHelper('round', function (value) {
    return Math.round(Number(value) || 0);
});

/**
 * Comparison helpers
 */
Handlebars.registerHelper('gt', function (a, b) {
    return Number(a) > Number(b);
});

Handlebars.registerHelper('gte', function (a, b) {
    return Number(a) >= Number(b);
});

Handlebars.registerHelper('lt', function (a, b) {
    return Number(a) < Number(b);
});

Handlebars.registerHelper('lte', function (a, b) {
    return Number(a) <= Number(b);
});

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

Handlebars.registerHelper('mod', function (a, b) {
    return Number(a) % Number(b);
});

/**
 * Add two numbers
 */
Handlebars.registerHelper('add', function (a, b) {
    return Number(a) + Number(b);
});

/**
 * Grade to text conversion
 */
Handlebars.registerHelper('gradeText', function (grade) {
    const grades = {
        'A': 'Sangat Sehat',
        'B': 'Sehat',
        'C': 'Cukup',
        'D': 'Perlu Perhatian',
        'F': 'Kritis'
    };
    return grades[grade] || 'N/A';
});

/**
 * Convert to lowercase
 */
Handlebars.registerHelper('lowerCase', function (text) {
    if (!text) return '';
    return String(text).toLowerCase();
});

/**
 * Get expense dot color by index
 */
Handlebars.registerHelper('expenseDotColor', function (index) {
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#8b5cf6', // purple
        '#ef4444', // red
        '#06b6d4', // cyan
        '#f97316', // orange
        '#ec4899', // pink
        '#14b8a6', // teal
        '#6366f1', // indigo
        '#84cc16', // lime
    ];
    return colors[index % colors.length];
});

/**
 * Capitalize first letter
 */
Handlebars.registerHelper('capitalize', function (text) {
    if (!text) return '';
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
});

/**
 * Get severity class for styling
 */
Handlebars.registerHelper('severityClass', function (severity) {
    const classes = {
        'kritis': 'card-danger',
        'serius': 'card-warning',
        'moderat': 'card-info',
        'ringan': ''
    };
    return classes[severity] || '';
});

Handlebars.registerHelper('severityBadge', function (severity) {
    const badges = {
        'kritis': 'badge-danger',
        'serius': 'badge-warning',
        'moderat': 'badge-info',
        'ringan': 'badge-success'
    };
    return badges[severity] || 'badge-info';
});

Handlebars.registerHelper('gradeClass', function (grade) {
    const classes = {
        'A': 'badge-success',
        'B': 'badge-success',
        'C': 'badge-warning',
        'D': 'badge-warning',
        'F': 'badge-danger'
    };
    return classes[grade] || 'badge-info';
});

// ============================================
// TEMPLATE LOADING
// ============================================

const PDF_DIR = __dirname; // pdfGenerator.cjs is already in src/pdf/
const PARTIALS_DIR = path.join(PDF_DIR, 'partials');

/**
 * Load CSS styles
 */
function loadStyles() {
    const cssPath = path.join(PDF_DIR, 'pdf.css');
    return fs.readFileSync(cssPath, 'utf-8');
}

/**
 * Load and register all partials
 */
function loadPartials() {
    const partials = [
        'cover',       // Page 1: Cover/Executive Summary
        'diagnosis',   // Page 2: Diagnosis & Prioritas
        'strategy',    // Page 3: Strategi
        'actionPlan',  // Page 4: Rencana Aksi
        'allocation',  // Page 5: Alokasi Keuangan (NEW)
        'goals',       // Page 6: Tujuan & Investasi (NEW)
        'conclusion'   // Page 7: Kesimpulan
    ];

    partials.forEach(name => {
        const partialPath = path.join(PARTIALS_DIR, `${name}.hbs`);
        const partialContent = fs.readFileSync(partialPath, 'utf-8');
        Handlebars.registerPartial(name, partialContent);
    });
}

/**
 * Load master template
 */
function loadMasterTemplate() {
    const masterPath = path.join(PDF_DIR, 'master.hbs');
    const templateContent = fs.readFileSync(masterPath, 'utf-8');
    return Handlebars.compile(templateContent);
}

// ============================================
// SLUGIFY HELPER
// ============================================

/**
 * Slugify user name for filename
 */
function slugifyName(name) {
    if (!name) return 'User';
    return String(name)
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with dashes
        .replace(/[^a-zA-Z0-9\-]/g, '') // Remove non-alphanumeric except dashes
        .replace(/-+/g, '-')            // Replace multiple dashes with single
        .substring(0, 50);              // Limit to 50 chars
}

/**
 * Generate filename
 */
function generateFilename(userName) {
    const slug = slugifyName(userName);
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `Laporan-Keuangan-${slug}-${date}.pdf`;
}

// ============================================
// HTML GENERATION
// ============================================

/**
 * Compile HTML from data
 */
function compileHTML(data) {
    // Load partials
    loadPartials();

    // Load master template
    const template = loadMasterTemplate();

    // Load styles
    const styles = loadStyles();

    // Prepare template data
    const templateData = {
        ...data,
        styles
    };

    // Compile and return HTML
    return template(templateData);
}

// ============================================
// PDF GENERATION
// ============================================

/**
 * Generate PDF from data
 * @param {Object} data - Report data
 * @param {number} timeout - Puppeteer timeout in ms (default 30000)
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDF(data, timeout = 30000) {
    let browser = null;

    try {
        // Import puppeteer dynamically
        const puppeteer = require('puppeteer');

        // Launch browser with timeout
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
            timeout: timeout
        });

        const page = await browser.newPage();

        // Compile HTML
        const html = compileHTML(data);

        // Set content
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: timeout
        });

        // Generate PDF with no margins (full-bleed pages with sidebar)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        return pdfBuffer;

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    generatePDF,
    compileHTML,
    generateFilename,
    slugifyName
};
