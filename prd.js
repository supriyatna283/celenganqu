const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, PageNumber, TabStopType, TabStopPosition, PageBreak,
    Header, Footer
} = require('docx');
const fs = require('fs');

const BLUE = "1A56A0";
const LIGHT_BLUE = "D6E4F7";
const DARK = "1A1A2E";
const GRAY = "F5F7FA";
const BORDER_COLOR = "CCCCCC";
const GREEN = "1D6F42";
const LIGHT_GREEN = "E8F5EE";
const RED = "C0392B";
const LIGHT_RED = "FDECEA";

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 160 },
        children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: "Arial" })]
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text, bold: true, size: 26, color: DARK, font: "Arial" })]
    });
}

function h3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text, bold: true, size: 22, color: "374151", font: "Arial" })]
    });
}

function body(text, opts = {}) {
    return new Paragraph({
        spacing: { before: 60, after: 100 },
        children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
    });
}

function bullet(text, level = 0) {
    return new Paragraph({
        numbering: { reference: "bullets", level },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, size: 22, font: "Arial" })]
    });
}

function numbered(text, level = 0) {
    return new Paragraph({
        numbering: { reference: "numbers", level },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, size: 22, font: "Arial" })]
    });
}

function space(n = 1) {
    return Array(n).fill(new Paragraph({ children: [new TextRun("")], spacing: { before: 0, after: 80 } }));
}

function divider() {
    return new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 1 } },
        spacing: { before: 100, after: 100 },
        children: [new TextRun("")]
    });
}

function headerRow(cells, widths) {
    return new TableRow({
        tableHeader: true,
        children: cells.map((text, i) => new TableCell({
            borders: allBorders,
            shading: { fill: BLUE, type: ShadingType.CLEAR },
            width: { size: widths[i], type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })]
        }))
    });
}

function dataRow(cells, widths, shade = false) {
    return new TableRow({
        children: cells.map((text, i) => new TableCell({
            borders: allBorders,
            shading: { fill: shade ? "F9FAFB" : "FFFFFF", type: ShadingType.CLEAR },
            width: { size: widths[i], type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial" })] })]
        }))
    });
}

function badgeCell(text, color, bgColor, width) {
    return new TableCell({
        borders: allBorders,
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        width: { size: width, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", color, bold: true })] })]
    });
}

function infoBox(label, text) {
    return new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1440, 7920],
        rows: [new TableRow({
            children: [
                new TableCell({
                    borders: allBorders,
                    shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
                    width: { size: 1440, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial", color: BLUE })] })]
                }),
                new TableCell({
                    borders: allBorders,
                    shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                    width: { size: 7920, type: WidthType.DXA },
                    margins: { top: 100, bottom: 100, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial" })] })]
                })
            ]
        })]
    });
}

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "bullets", levels: [
                    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                    { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
                ]
            },
            {
                reference: "numbers", levels: [
                    { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                    { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
                ]
            },
        ]
    },
    styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
        paragraphStyles: [
            {
                id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 32, bold: true, font: "Arial", color: BLUE },
                paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 }
            },
            {
                id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 26, bold: true, font: "Arial", color: DARK },
                paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
            },
            {
                id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 22, bold: true, font: "Arial", color: "374151" },
                paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
            },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
            }
        },
        headers: {
            default: new Header({
                children: [new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
                    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                    spacing: { before: 0, after: 120 },
                    children: [
                        new TextRun({ text: "duitku — Product Requirements Document", size: 18, color: "6B7280", font: "Arial" }),
                        new TextRun({ text: "\t", size: 18, font: "Arial" }),
                        new TextRun({ text: "Confidential", size: 18, color: "6B7280", font: "Arial", italics: true }),
                    ]
                })]
            })
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB", space: 1 } },
                    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                    spacing: { before: 120, after: 0 },
                    children: [
                        new TextRun({ text: "© 2025 duitku. All rights reserved.", size: 18, color: "9CA3AF", font: "Arial" }),
                        new TextRun({ text: "\t", size: 18, font: "Arial" }),
                        new TextRun({ text: "Halaman ", size: 18, color: "9CA3AF", font: "Arial" }),
                        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "9CA3AF", font: "Arial" }),
                    ]
                })]
            })
        },
        children: [
            // ─── COVER ───────────────────────────────────────────────────
            new Paragraph({ spacing: { before: 2400, after: 0 }, children: [new TextRun("")] }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 120 },
                children: [new TextRun({ text: "duitku", size: 72, bold: true, color: BLUE, font: "Arial" })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 240 },
                children: [new TextRun({ text: "Financial Tracker — Aplikasi Manajemen Keuangan Pribadi", size: 26, color: "6B7280", font: "Arial", italics: true })]
            }),
            new Table({
                width: { size: 4000, type: WidthType.DXA },
                columnWidths: [2000, 2000],
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Versi", bold: true, size: 20, color: BLUE, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1.0.0", size: 20, font: "Arial" })] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tanggal", bold: true, size: 20, color: BLUE, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Juni 2025", size: 20, font: "Arial" })] })] }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Status", bold: true, size: 20, color: BLUE, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: LIGHT_GREEN, type: ShadingType.CLEAR }, width: { size: 2000, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Draft Aktif", size: 20, color: GREEN, bold: true, font: "Arial" })] })] }),
                        ]
                    }),
                ]
            }),
            ...space(12),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 1. IKHTISAR PRODUK ───────────────────────────────────────
            h1("1. Ikhtisar Produk"),
            divider(),

            h2("1.1 Ringkasan Eksekutif"),
            body("duitku adalah aplikasi web manajemen keuangan pribadi berbasis React.js yang memungkinkan pengguna mencatat, memantau, dan menganalisis pemasukan dan pengeluaran secara real-time. Aplikasi dirancang khusus untuk pengguna Indonesia dengan dukungan mata uang Rupiah, kategori keuangan lokal, dan antarmuka yang ramah pengguna."),
            ...space(1),

            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2340, 7020],
                rows: [
                    headerRow(["Atribut", "Detail"], [2340, 7020]),
                    dataRow(["Nama Produk", "duitku — Financial Tracker"], [2340, 7020], false),
                    dataRow(["Tipe Aplikasi", "Web Application (Single Page Application)"], [2340, 7020], true),
                    dataRow(["Frontend", "React.js 18 + Vite + Tailwind CSS"], [2340, 7020], false),
                    dataRow(["Backend", "Node.js + Express.js (REST API)"], [2340, 7020], true),
                    dataRow(["Database", "MySQL 8.0"], [2340, 7020], false),
                    dataRow(["Target Pengguna", "Individu 18–45 tahun di Indonesia"], [2340, 7020], true),
                    dataRow(["Platform", "Web (Desktop & Mobile Responsive)"], [2340, 7020], false),
                    dataRow(["Bahasa", "Bahasa Indonesia"], [2340, 7020], true),
                    dataRow(["Mata Uang", "IDR (Rupiah)"], [2340, 7020], false),
                ]
            }),
            ...space(1),

            h2("1.2 Pernyataan Masalah"),
            body("Mayoritas masyarakat Indonesia tidak memiliki sistem pencatatan keuangan yang konsisten. Aplikasi keuangan yang ada umumnya terlalu kompleks, berbahasa asing, atau tidak mendukung kebutuhan spesifik pengguna lokal seperti kategori belanja pasar, cicilan kendaraan, dan kos/kontrakan."),
            ...space(1),

            h2("1.3 Tujuan Produk"),
            numbered("Menyediakan platform pencatatan keuangan yang mudah dan cepat digunakan."),
            numbered("Membantu pengguna memahami pola pengeluaran dengan visualisasi data yang jelas."),
            numbered("Memotivasi pengguna mencapai tujuan keuangan melalui fitur goals tracking."),
            numbered("Memberikan saran finansial otomatis berbasis data transaksi pengguna."),
            numbered("Mendukung multi-akun (tabungan, dompet, investasi) dalam satu dashboard."),
            ...space(1),

            h2("1.4 Indikator Keberhasilan (KPI)"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [3500, 2800, 3060],
                rows: [
                    headerRow(["Metrik", "Target (3 Bulan)", "Target (12 Bulan)"], [3500, 2800, 3060]),
                    dataRow(["Pengguna Terdaftar", "500 pengguna", "5.000 pengguna"], [3500, 2800, 3060], false),
                    dataRow(["Daily Active Users (DAU)", "30% dari total", "40% dari total"], [3500, 2800, 3060], true),
                    dataRow(["Retensi 30 Hari", "≥ 40%", "≥ 55%"], [3500, 2800, 3060], false),
                    dataRow(["Transaksi Dicatat/Hari", "≥ 3 per pengguna aktif", "≥ 5 per pengguna aktif"], [3500, 2800, 3060], true),
                    dataRow(["Rating App (skala 5)", "≥ 4.2", "≥ 4.5"], [3500, 2800, 3060], false),
                ]
            }),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 2. PENGGUNA ──────────────────────────────────────────────
            h1("2. Pengguna & Persona"),
            divider(),

            h2("2.1 Segmen Pengguna"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1800, 2800, 2400, 2360],
                rows: [
                    headerRow(["Segmen", "Deskripsi", "Kebutuhan Utama", "Prioritas"], [1800, 2800, 2400, 2360]),
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Fresh Graduate", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "22–26 tahun, baru kerja, gaji pertama", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Belajar menabung & budgeting", size: 20, font: "Arial" })] })] }),
                            badgeCell("Tinggi", "1D6F42", LIGHT_GREEN, 2360),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Profesional Muda", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "27–35 tahun, pendapatan ganda, punya tanggungan", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Tracking multi-akun & cicilan", size: 20, font: "Arial" })] })] }),
                            badgeCell("Tinggi", "1D6F42", LIGHT_GREEN, 2360),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Wirausaha", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "30–45 tahun, pendapatan tidak tetap", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Pisah keuangan pribadi & bisnis", size: 20, font: "Arial" })] })] }),
                            badgeCell("Menengah", "92400E", "FEF3C7", 2360),
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Ibu Rumah Tangga", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "28–42 tahun, mengelola keuangan keluarga", size: 20, font: "Arial" })] })] }),
                            new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Catat belanja harian & kebutuhan anak", size: 20, font: "Arial" })] })] }),
                            badgeCell("Menengah", "92400E", "FEF3C7", 2360),
                        ]
                    }),
                ]
            }),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 3. FITUR & REQUIREMENTS ─────────────────────────────────
            h1("3. Fitur & Persyaratan Fungsional"),
            divider(),

            h2("3.1 Modul Autentikasi"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [900, 4500, 1800, 2160],
                rows: [
                    headerRow(["ID", "Fitur", "Prioritas", "Status"], [900, 4500, 1800, 2160]),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 900, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "AU-01", size: 20, font: "Arial", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 4500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Registrasi dengan email & password", size: 20, font: "Arial" })] })] }), badgeCell("Wajib", "1D6F42", LIGHT_GREEN, 1800), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "MVP", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 900, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "AU-02", size: 20, font: "Arial", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 4500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Login dengan JWT Token (access + refresh)", size: 20, font: "Arial" })] })] }), badgeCell("Wajib", "1D6F42", LIGHT_GREEN, 1800), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "MVP", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 900, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "AU-03", size: 20, font: "Arial", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 4500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Reset password via email OTP", size: 20, font: "Arial" })] })] }), badgeCell("Wajib", "1D6F42", LIGHT_GREEN, 1800), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "MVP", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 900, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "AU-04", size: 20, font: "Arial", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 4500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Login dengan Google OAuth 2.0", size: 20, font: "Arial" })] })] }), badgeCell("Penting", "92400E", "FEF3C7", 1800), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "v1.1", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 900, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "AU-05", size: 20, font: "Arial", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 4500, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Two-Factor Authentication (2FA) via email", size: 20, font: "Arial" })] })] }), badgeCell("Opsional", "1E40AF", "DBEAFE", 1800), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2160, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "v2.0", size: 20, font: "Arial" })] })] })] }),
                ]
            }),
            ...space(1),

            h2("3.2 Modul Transaksi"),
            bullet("Tambah transaksi manual (jenis: pemasukan / pengeluaran / transfer)"),
            bullet("Edit dan hapus transaksi yang sudah ada"),
            bullet("Pilih kategori dari daftar bawaan atau buat kategori kustom"),
            bullet("Tambah catatan dan lampiran foto (struk belanja)"),
            bullet("Filter dan pencarian transaksi berdasarkan tanggal, kategori, akun, jumlah"),
            bullet("Ekspor transaksi ke format CSV / PDF"),
            bullet("Import transaksi massal dari file CSV"),
            bullet("Transaksi berulang / recurring (harian, mingguan, bulanan)"),
            ...space(1),

            h2("3.3 Modul Dashboard & Analitik"),
            bullet("Ringkasan bulanan: total pemasukan, pengeluaran, tabungan"),
            bullet("Grafik tren pemasukan vs pengeluaran (6–12 bulan)"),
            bullet("Donut chart distribusi pengeluaran per kategori"),
            bullet("Perbandingan bulan ini vs bulan lalu (persentase perubahan)"),
            bullet("Heatmap aktivitas transaksi harian"),
            bullet("Laporan mingguan otomatis via notifikasi email"),
            ...space(1),

            h2("3.4 Modul Anggaran (Budgeting)"),
            bullet("Buat anggaran bulanan per kategori"),
            bullet("Progress bar real-time penggunaan anggaran"),
            bullet("Notifikasi in-app saat anggaran mencapai 80% dan 100%"),
            bullet("Riwayat penggunaan anggaran per bulan"),
            bullet("Salin anggaran bulan sebelumnya"),
            ...space(1),

            h2("3.5 Modul Tujuan Keuangan (Goals)"),
            bullet("Buat goals dengan nama, target nominal, dan target tanggal"),
            bullet("Tracking progress dengan progress bar persentase"),
            bullet("Tambah dana ke goal secara manual atau otomatis dari tabungan"),
            bullet("Proyeksi waktu pencapaian goal berdasarkan rata-rata tabungan"),
            bullet("Notifikasi milestone (25%, 50%, 75%, 100%)"),
            ...space(1),

            h2("3.6 Modul Multi-Akun"),
            bullet("Kelola beberapa akun: tabungan, dompet, kartu kredit, investasi"),
            bullet("Transfer antar akun dengan pencatatan otomatis"),
            bullet("Saldo real-time per akun"),
            bullet("Net worth dashboard (total aset − total utang)"),
            ...space(1),

            h2("3.7 Modul Saran Finansial (AI Insights)"),
            bullet("Deteksi pengeluaran tidak biasa / anomali"),
            bullet("Saran penghematan berbasis pola pengeluaran 3 bulan terakhir"),
            bullet("Perbandingan pengeluaran vs rata-rata kategori sejenis"),
            bullet("Proyeksi saldo akhir bulan berdasarkan transaksi berjalan"),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 4. ARSITEKTUR TEKNIS ─────────────────────────────────────
            h1("4. Arsitektur Teknis"),
            divider(),

            h2("4.1 Stack Teknologi"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1800, 3060, 4500],
                rows: [
                    headerRow(["Layer", "Teknologi", "Keterangan"], [1800, 3060, 4500]),
                    dataRow(["Frontend", "React.js 18 + Vite", "SPA dengan code splitting dan lazy loading"], [1800, 3060, 4500], false),
                    dataRow(["UI Framework", "Tailwind CSS 3 + shadcn/ui", "Design system yang konsisten dan accessible"], [1800, 3060, 4500], true),
                    dataRow(["State Management", "Zustand + React Query", "Global state ringan + server state caching"], [1800, 3060, 4500], false),
                    dataRow(["Routing", "React Router v6", "Client-side routing dengan protected routes"], [1800, 3060, 4500], true),
                    dataRow(["Charts", "Recharts + Chart.js", "Visualisasi data interaktif"], [1800, 3060, 4500], false),
                    dataRow(["Backend", "Node.js 20 + Express.js", "RESTful API dengan middleware chain"], [1800, 3060, 4500], true),
                    dataRow(["ORM", "Sequelize v6", "MySQL ORM dengan migration dan seeding"], [1800, 3060, 4500], false),
                    dataRow(["Database", "MySQL 8.0", "Relational database utama aplikasi"], [1800, 3060, 4500], true),
                    dataRow(["Cache", "Redis 7", "Session, rate limiting, query caching"], [1800, 3060, 4500], false),
                    dataRow(["Auth", "JWT + bcrypt", "Stateless authentication dengan refresh token"], [1800, 3060, 4500], true),
                    dataRow(["File Storage", "AWS S3 / MinIO", "Penyimpanan lampiran struk"], [1800, 3060, 4500], false),
                    dataRow(["Email", "Nodemailer + SMTP", "Notifikasi dan OTP email"], [1800, 3060, 4500], true),
                    dataRow(["Deployment", "Docker + Nginx", "Containerized deployment"], [1800, 3060, 4500], false),
                ]
            }),
            ...space(1),

            h2("4.2 Struktur Proyek Frontend (React.js)"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [3500, 5860],
                rows: [
                    headerRow(["Path / File", "Deskripsi"], [3500, 5860]),
                    dataRow(["src/components/", "Komponen reusable (Button, Modal, Chart, dll)"], [3500, 5860], false),
                    dataRow(["src/pages/", "Halaman utama: Dashboard, Transaksi, Budget, Goals"], [3500, 5860], true),
                    dataRow(["src/hooks/", "Custom hooks: useAuth, useTransaction, useBudget"], [3500, 5860], false),
                    dataRow(["src/store/", "Zustand stores: authStore, uiStore"], [3500, 5860], true),
                    dataRow(["src/services/", "API service layer: axios instance + endpoints"], [3500, 5860], false),
                    dataRow(["src/utils/", "Helper: formatRupiah, dateUtils, validators"], [3500, 5860], true),
                    dataRow(["src/contexts/", "React Context: ThemeContext, AuthContext"], [3500, 5860], false),
                ]
            }),
            ...space(1),

            h2("4.3 Skema Database MySQL"),
            h3("Tabel: users"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2000, 1800, 1200, 4360],
                rows: [
                    headerRow(["Kolom", "Tipe", "Constraint", "Keterangan"], [2000, 1800, 1200, 4360]),
                    dataRow(["id", "BIGINT UNSIGNED", "PK, AI", "Primary key auto increment"], [2000, 1800, 1200, 4360], false),
                    dataRow(["uuid", "CHAR(36)", "UNIQUE, NN", "UUID v4 untuk public identifier"], [2000, 1800, 1200, 4360], true),
                    dataRow(["name", "VARCHAR(100)", "NOT NULL", "Nama lengkap pengguna"], [2000, 1800, 1200, 4360], false),
                    dataRow(["email", "VARCHAR(255)", "UNIQUE, NN", "Email sebagai username"], [2000, 1800, 1200, 4360], true),
                    dataRow(["password_hash", "VARCHAR(255)", "NOT NULL", "Hash bcrypt (rounds: 12)"], [2000, 1800, 1200, 4360], false),
                    dataRow(["avatar_url", "VARCHAR(500)", "NULLABLE", "URL foto profil"], [2000, 1800, 1200, 4360], true),
                    dataRow(["currency", "CHAR(3)", "DEFAULT 'IDR'", "Mata uang default"], [2000, 1800, 1200, 4360], false),
                    dataRow(["is_active", "TINYINT(1)", "DEFAULT 1", "Status akun aktif/nonaktif"], [2000, 1800, 1200, 4360], true),
                    dataRow(["email_verified_at", "TIMESTAMP", "NULLABLE", "Waktu verifikasi email"], [2000, 1800, 1200, 4360], false),
                    dataRow(["created_at", "TIMESTAMP", "DEFAULT NOW", "Waktu registrasi"], [2000, 1800, 1200, 4360], true),
                    dataRow(["updated_at", "TIMESTAMP", "ON UPDATE", "Waktu update terakhir"], [2000, 1800, 1200, 4360], false),
                ]
            }),
            ...space(1),

            h3("Tabel: accounts (multi-akun)"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2000, 1800, 1200, 4360],
                rows: [
                    headerRow(["Kolom", "Tipe", "Constraint", "Keterangan"], [2000, 1800, 1200, 4360]),
                    dataRow(["id", "BIGINT UNSIGNED", "PK, AI", "Primary key"], [2000, 1800, 1200, 4360], false),
                    dataRow(["user_id", "BIGINT UNSIGNED", "FK → users", "Relasi ke pemilik akun"], [2000, 1800, 1200, 4360], true),
                    dataRow(["name", "VARCHAR(100)", "NOT NULL", "Nama akun (misal: BCA, GoPay)"], [2000, 1800, 1200, 4360], false),
                    dataRow(["type", "ENUM", "NOT NULL", "savings/wallet/credit/investment"], [2000, 1800, 1200, 4360], true),
                    dataRow(["balance", "DECIMAL(15,2)", "DEFAULT 0", "Saldo akun saat ini"], [2000, 1800, 1200, 4360], false),
                    dataRow(["color", "CHAR(7)", "NULLABLE", "Warna akun untuk UI (#HEX)"], [2000, 1800, 1200, 4360], true),
                    dataRow(["is_active", "TINYINT(1)", "DEFAULT 1", "Status akun"], [2000, 1800, 1200, 4360], false),
                    dataRow(["created_at", "TIMESTAMP", "DEFAULT NOW", "Waktu pembuatan"], [2000, 1800, 1200, 4360], true),
                ]
            }),
            ...space(1),

            h3("Tabel: transactions"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2000, 1800, 1200, 4360],
                rows: [
                    headerRow(["Kolom", "Tipe", "Constraint", "Keterangan"], [2000, 1800, 1200, 4360]),
                    dataRow(["id", "BIGINT UNSIGNED", "PK, AI", "Primary key"], [2000, 1800, 1200, 4360], false),
                    dataRow(["user_id", "BIGINT UNSIGNED", "FK → users", "Pemilik transaksi"], [2000, 1800, 1200, 4360], true),
                    dataRow(["account_id", "BIGINT UNSIGNED", "FK → accounts", "Akun yang digunakan"], [2000, 1800, 1200, 4360], false),
                    dataRow(["category_id", "BIGINT UNSIGNED", "FK → categories", "Kategori transaksi"], [2000, 1800, 1200, 4360], true),
                    dataRow(["type", "ENUM", "NOT NULL", "income/expense/transfer"], [2000, 1800, 1200, 4360], false),
                    dataRow(["amount", "DECIMAL(15,2)", "NOT NULL", "Nominal transaksi"], [2000, 1800, 1200, 4360], true),
                    dataRow(["description", "VARCHAR(500)", "NULLABLE", "Deskripsi/catatan transaksi"], [2000, 1800, 1200, 4360], false),
                    dataRow(["attachment_url", "VARCHAR(500)", "NULLABLE", "URL foto struk"], [2000, 1800, 1200, 4360], true),
                    dataRow(["transaction_date", "DATE", "NOT NULL", "Tanggal transaksi terjadi"], [2000, 1800, 1200, 4360], false),
                    dataRow(["is_recurring", "TINYINT(1)", "DEFAULT 0", "Flag transaksi berulang"], [2000, 1800, 1200, 4360], true),
                    dataRow(["recurring_id", "BIGINT UNSIGNED", "NULLABLE, FK", "Relasi ke jadwal recurring"], [2000, 1800, 1200, 4360], false),
                    dataRow(["created_at", "TIMESTAMP", "DEFAULT NOW", "Waktu input"], [2000, 1800, 1200, 4360], true),
                ]
            }),
            ...space(1),

            h3("Tabel: budgets"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2000, 1800, 1200, 4360],
                rows: [
                    headerRow(["Kolom", "Tipe", "Constraint", "Keterangan"], [2000, 1800, 1200, 4360]),
                    dataRow(["id", "BIGINT UNSIGNED", "PK, AI", "Primary key"], [2000, 1800, 1200, 4360], false),
                    dataRow(["user_id", "BIGINT UNSIGNED", "FK → users", "Pemilik anggaran"], [2000, 1800, 1200, 4360], true),
                    dataRow(["category_id", "BIGINT UNSIGNED", "FK → categories", "Kategori anggaran"], [2000, 1800, 1200, 4360], false),
                    dataRow(["amount_limit", "DECIMAL(15,2)", "NOT NULL", "Batas anggaran (Rp)"], [2000, 1800, 1200, 4360], true),
                    dataRow(["period_month", "TINYINT UNSIGNED", "NOT NULL", "Bulan (1–12)"], [2000, 1800, 1200, 4360], false),
                    dataRow(["period_year", "SMALLINT UNSIGNED", "NOT NULL", "Tahun anggaran"], [2000, 1800, 1200, 4360], true),
                    dataRow(["created_at", "TIMESTAMP", "DEFAULT NOW", "Waktu pembuatan"], [2000, 1800, 1200, 4360], false),
                ]
            }),
            ...space(1),

            h3("Tabel: goals"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2000, 1800, 1200, 4360],
                rows: [
                    headerRow(["Kolom", "Tipe", "Constraint", "Keterangan"], [2000, 1800, 1200, 4360]),
                    dataRow(["id", "BIGINT UNSIGNED", "PK, AI", "Primary key"], [2000, 1800, 1200, 4360], false),
                    dataRow(["user_id", "BIGINT UNSIGNED", "FK → users", "Pemilik goal"], [2000, 1800, 1200, 4360], true),
                    dataRow(["name", "VARCHAR(100)", "NOT NULL", "Nama tujuan keuangan"], [2000, 1800, 1200, 4360], false),
                    dataRow(["target_amount", "DECIMAL(15,2)", "NOT NULL", "Target nominal yang ingin dicapai"], [2000, 1800, 1200, 4360], true),
                    dataRow(["current_amount", "DECIMAL(15,2)", "DEFAULT 0", "Dana yang sudah terkumpul"], [2000, 1800, 1200, 4360], false),
                    dataRow(["target_date", "DATE", "NULLABLE", "Target tanggal pencapaian"], [2000, 1800, 1200, 4360], true),
                    dataRow(["color", "CHAR(7)", "NULLABLE", "Warna indikator goal (#HEX)"], [2000, 1800, 1200, 4360], false),
                    dataRow(["is_completed", "TINYINT(1)", "DEFAULT 0", "Flag goal selesai"], [2000, 1800, 1200, 4360], true),
                    dataRow(["created_at", "TIMESTAMP", "DEFAULT NOW", "Waktu pembuatan"], [2000, 1800, 1200, 4360], false),
                ]
            }),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 5. API ENDPOINTS ─────────────────────────────────────────
            h1("5. Desain API (RESTful)"),
            divider(),

            h2("5.1 Base URL & Konvensi"),
            infoBox("Base URL", "https://api.duitku.id/v1"),
            ...space(1),
            infoBox("Auth Header", "Authorization: Bearer <access_token>"),
            ...space(1),
            infoBox("Format", "Content-Type: application/json | Semua response dalam bahasa Indonesia"),
            ...space(1),

            h2("5.2 Endpoint Utama"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1200, 3200, 2200, 2760],
                rows: [
                    headerRow(["Method", "Endpoint", "Auth", "Deskripsi"], [1200, 3200, 2200, 2760]),
                    // Auth
                    new TableRow({ children: [badgeCell("POST", "FFFFFF", LIGHT_GREEN, 1200), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/auth/register", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Tidak perlu", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Registrasi pengguna baru", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("POST", "FFFFFF", LIGHT_GREEN, 1200), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/auth/login", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Tidak perlu", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Login, return JWT token", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("POST", "FFFFFF", LIGHT_GREEN, 1200), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/auth/refresh", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Refresh Token", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Perbarui access token", size: 20, font: "Arial" })] })] })] }),
                    // Transactions
                    new TableRow({ children: [badgeCell("GET", "FFFFFF", LIGHT_BLUE, 1200), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/transactions", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "List transaksi (filter & paginate)", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("POST", "FFFFFF", LIGHT_GREEN, 1200), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/transactions", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Buat transaksi baru", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("PUT", "FFFFFF", "FEF3C7", 1200), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/transactions/:id", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Update transaksi berdasarkan ID", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("DELETE", "FFFFFF", LIGHT_RED, 1200), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/transactions/:id", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Hapus transaksi (soft delete)", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("GET", "FFFFFF", LIGHT_BLUE, 1200), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/dashboard/summary", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "KPI summary bulan ini", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("GET", "FFFFFF", LIGHT_BLUE, 1200), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/budgets", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Daftar anggaran bulan aktif", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("GET", "FFFFFF", LIGHT_BLUE, 1200), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/goals", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Daftar tujuan keuangan", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [badgeCell("GET", "FFFFFF", LIGHT_BLUE, 1200), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "/reports/export?format=csv", size: 20, font: "Courier New", color: BLUE })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bearer JWT", size: 20, font: "Arial", color: "6B7280" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Ekspor laporan CSV/PDF", size: 20, font: "Arial" })] })] })] }),
                ]
            }),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 6. NON-FUNCTIONAL ────────────────────────────────────────
            h1("6. Persyaratan Non-Fungsional"),
            divider(),

            h2("6.1 Performa"),
            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [3500, 2800, 3060],
                rows: [
                    headerRow(["Metrik", "Target", "Alat Ukur"], [3500, 2800, 3060]),
                    dataRow(["API Response Time (P95)", "< 200ms", "Datadog / New Relic"], [3500, 2800, 3060], false),
                    dataRow(["Page Load Time (LCP)", "< 2.5 detik", "Google Lighthouse"], [3500, 2800, 3060], true),
                    dataRow(["First Contentful Paint (FCP)", "< 1.5 detik", "Web Vitals"], [3500, 2800, 3060], false),
                    dataRow(["Concurrent Users", "≥ 500 simultan", "Load testing (k6)"], [3500, 2800, 3060], true),
                    dataRow(["Database Query Time", "< 50ms per query", "MySQL slow log"], [3500, 2800, 3060], false),
                    dataRow(["Uptime SLA", "99.9% per bulan", "Uptime monitoring"], [3500, 2800, 3060], true),
                ]
            }),
            ...space(1),

            h2("6.2 Keamanan"),
            bullet("Semua data sensitif dienkripsi at-rest (AES-256) dan in-transit (TLS 1.3)"),
            bullet("Password di-hash dengan bcrypt (12 rounds)"),
            bullet("JWT access token expired dalam 15 menit, refresh token 30 hari"),
            bullet("Rate limiting: 100 request/menit per IP, 1000 request/jam per user"),
            bullet("Input validation dan sanitasi menggunakan Joi/Zod di backend"),
            bullet("SQL injection prevention via Sequelize ORM parameterized queries"),
            bullet("CORS policy terbatas pada domain yang diizinkan"),
            bullet("Audit log untuk setiap aksi CRUD pada data transaksi"),
            bullet("GDPR-ready: pengguna dapat export dan delete semua data mereka"),
            ...space(1),

            h2("6.3 Aksesibilitas"),
            bullet("Memenuhi standar WCAG 2.1 Level AA"),
            bullet("Dukungan screen reader (aria-label, role semantik)"),
            bullet("Responsive design: optimal di layar 320px hingga 2560px"),
            bullet("Color contrast ratio minimal 4.5:1 untuk teks normal"),
            bullet("Navigasi penuh via keyboard (Tab, Enter, Escape, Arrow keys)"),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 7. ROADMAP ───────────────────────────────────────────────
            h1("7. Roadmap & Milestone"),
            divider(),

            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [1440, 1800, 3360, 2760],
                rows: [
                    headerRow(["Fase", "Timeline", "Deliverable", "Status"], [1440, 1800, 3360, 2760]),
                    new TableRow({ children: [badgeCell("MVP", "1D6F42", LIGHT_GREEN, 1440), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bulan 1–2", size: 20, font: "Arial" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Auth, CRUD Transaksi, Dashboard, Budget dasar", size: 20, font: "Arial" })] })] }), badgeCell("In Progress", "1E40AF", "DBEAFE", 2760)] }),
                    new TableRow({ children: [badgeCell("v1.0", "1A56A0", LIGHT_BLUE, 1440), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bulan 3–4", size: 20, font: "Arial" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Goals, Multi-akun, Ekspor CSV, Recurring TX", size: 20, font: "Arial" })] })] }), badgeCell("Planned", "5B21B6", "EDE9FE", 2760)] }),
                    new TableRow({ children: [badgeCell("v1.1", "92400E", "FEF3C7", 1440), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bulan 5–6", size: 20, font: "Arial" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Google OAuth, Laporan PDF, Notifikasi email, AI Insights", size: 20, font: "Arial" })] })] }), badgeCell("Planned", "5B21B6", "EDE9FE", 2760)] }),
                    new TableRow({ children: [badgeCell("v2.0", "5B21B6", "EDE9FE", 1440), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 1800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Bulan 7–9", size: 20, font: "Arial" })] })] }), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3360, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Mobile app (React Native), 2FA, Investasi tracking, Open Banking API", size: 20, font: "Arial" })] })] }), badgeCell("Backlog", "374151", "F3F4F6", 2760)] }),
                ]
            }),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 8. RISIKO ────────────────────────────────────────────────
            h1("8. Analisis Risiko"),
            divider(),

            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2800, 1400, 1400, 3760],
                rows: [
                    headerRow(["Risiko", "Kemungkinan", "Dampak", "Mitigasi"], [2800, 1400, 1400, 3760]),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Kebocoran data pengguna", size: 20, font: "Arial" })] })] }), badgeCell("Rendah", "1D6F42", LIGHT_GREEN, 1400), badgeCell("Kritis", "C0392B", LIGHT_RED, 1400), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Enkripsi AES-256, audit log, penetration testing rutin", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "MySQL performance di skala besar", size: 20, font: "Arial" })] })] }), badgeCell("Menengah", "92400E", "FEF3C7", 1400), badgeCell("Tinggi", "92400E", "FEF3C7", 1400), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Index optimization, query caching Redis, read replica", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Adopsi pengguna lambat", size: 20, font: "Arial" })] })] }), badgeCell("Menengah", "92400E", "FEF3C7", 1400), badgeCell("Menengah", "92400E", "FEF3C7", 1400), new TableCell({ borders: allBorders, shading: { fill: "FFFFFF", type: ShadingType.CLEAR }, width: { size: 3760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Onboarding wizard, push notif, referral program", size: 20, font: "Arial" })] })] })] }),
                    new TableRow({ children: [new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Scope creep & keterlambatan delivery", size: 20, font: "Arial" })] })] }), badgeCell("Tinggi", "C0392B", LIGHT_RED, 1400), badgeCell("Menengah", "92400E", "FEF3C7", 1400), new TableCell({ borders: allBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR }, width: { size: 3760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Agile sprint 2 minggu, MoSCoW prioritization, daily standup", size: 20, font: "Arial" })] })] })] }),
                ]
            }),
            ...space(1),
            new Paragraph({ children: [new PageBreak()] }),

            // ─── 9. GLOSSARY ─────────────────────────────────────────────
            h1("9. Glosarium"),
            divider(),

            new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [2200, 7160],
                rows: [
                    headerRow(["Istilah", "Definisi"], [2200, 7160]),
                    dataRow(["JWT", "JSON Web Token — standar autentikasi stateless berbasis token"], [2200, 7160], false),
                    dataRow(["ORM", "Object-Relational Mapping — abstraksi database agar bisa diakses sebagai objek"], [2200, 7160], true),
                    dataRow(["SPA", "Single Page Application — aplikasi web yang tidak reload halaman saat navigasi"], [2200, 7160], false),
                    dataRow(["REST API", "Representational State Transfer — gaya arsitektur API berbasis HTTP"], [2200, 7160], true),
                    dataRow(["Redis", "Remote Dictionary Server — in-memory key-value store untuk caching"], [2200, 7160], false),
                    dataRow(["MVP", "Minimum Viable Product — versi minimal produk yang bisa dirilis ke pengguna"], [2200, 7160], true),
                    dataRow(["DAU", "Daily Active Users — jumlah pengguna unik yang aktif dalam satu hari"], [2200, 7160], false),
                    dataRow(["LCP", "Largest Contentful Paint — metrik performa waktu loading elemen terbesar"], [2200, 7160], true),
                    dataRow(["Soft Delete", "Penghapusan data secara logis (flag deleted_at) tanpa menghapus dari database"], [2200, 7160], false),
                    dataRow(["bcrypt", "Algoritma hashing password yang aman dengan salt otomatis"], [2200, 7160], true),
                ]
            }),
            ...space(2),

            divider(),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 80 },
                children: [new TextRun({ text: "Dokumen ini bersifat rahasia dan hanya untuk keperluan internal tim pengembangan.", size: 18, color: "9CA3AF", italics: true, font: "Arial" })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "duitku © 2025 — Versi 1.0.0 — Juni 2025", size: 18, color: "9CA3AF", font: "Arial" })]
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('./duitku-PRD.docx', buffer);
    console.log('Done');
});