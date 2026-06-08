import jsPDF from "jspdf";
import { Invoice, Customer, Vehicle, InvoiceItem, DiagnosticReport, Measurement } from "@/lib/types";
import { formatCurrency, formatDate } from "./formatting";

type RGB = [number, number, number];

// Minimal manual table renderer (jspdf-autotable is not a project dependency)
const drawSimpleTable = (
  doc: any,
  startY: number,
  margin: number,
  tableWidth: number,
  head: string[],
  rows: (string | number)[][],
  colWidths: number[],
  options: {
    align?: ("left" | "right")[];
    headFill?: RGB;
    headTextColor?: RGB;
    rowFill?: (rowIndex: number) => RGB | null;
    rowTextColor?: (rowIndex: number) => RGB | null;
    rowBold?: (rowIndex: number) => boolean;
    wrapColumn?: number;
  } = {}
): number => {
  const rowHeight = 7;
  const lineHeight = 4;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - margin;
  const {
    align = [],
    headFill = [17, 24, 39],
    headTextColor = [255, 255, 255],
    rowFill,
    rowTextColor,
    rowBold,
    wrapColumn,
  } = options;

  let y = startY;

  const drawHead = () => {
    doc.setFillColor(headFill[0], headFill[1], headFill[2]);
    doc.rect(margin, y, tableWidth, rowHeight, "F");
    doc.setTextColor(headTextColor[0], headTextColor[1], headTextColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let x = margin;
    head.forEach((label, i) => {
      const a = align[i] === "right" ? "right" : "left";
      doc.text(label, a === "right" ? x + colWidths[i] - 3 : x + 3, y + 4.8, { align: a });
      x += colWidths[i];
    });
    y += rowHeight;
  };

  drawHead();

  rows.forEach((row, ri) => {
    // Wrap the designated column's text so long content isn't cut off, and grow
    // the row to fit it — other rows/columns keep the fixed single-line height.
    let wrappedLines: string[] | null = null;
    let thisRowHeight = rowHeight;
    if (wrapColumn !== undefined && row[wrapColumn] !== undefined) {
      const lines: string[] = doc.splitTextToSize(String(row[wrapColumn]), colWidths[wrapColumn] - 6);
      wrappedLines = lines;
      thisRowHeight = Math.max(rowHeight, lines.length * lineHeight + 3);
    }

    if (y + thisRowHeight > bottomLimit) {
      doc.addPage();
      y = margin;
      drawHead();
    }
    const fill = rowFill?.(ri);
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(margin, y, tableWidth, thisRowHeight, "F");
    }
    const tc = rowTextColor?.(ri) || [51, 65, 85];
    doc.setTextColor(tc[0], tc[1], tc[2]);
    doc.setFont("helvetica", rowBold?.(ri) ? "bold" : "normal");
    doc.setFontSize(8);
    let x = margin;
    row.forEach((cell, ci) => {
      const a = align[ci] === "right" ? "right" : "left";
      if (ci === wrapColumn && wrappedLines) {
        wrappedLines.forEach((line, li) => {
          doc.text(line, x + 3, y + 4.8 + li * lineHeight, { align: "left" });
        });
      } else {
        doc.text(String(cell), a === "right" ? x + colWidths[ci] - 3 : x + 3, y + 4.8, { align: a });
      }
      x += colWidths[ci];
    });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y + thisRowHeight, margin + tableWidth, y + thisRowHeight);
    y += thisRowHeight;
  });

  return y;
};

// Recreates the "Classic Corporate Design" invoice document (see the BILL TO /
// VEHICLE / INVOICE # layout in app/(dashboard)/invoices/[id]/page.tsx) as a PDF.
export const generateInvoicePDF = async (
  invoice: Invoice & { customers?: Customer, invoice_items?: InvoiceItem[] }
) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 24;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin - 10) {
      doc.addPage();
      y = 24;
    }
  };

  const loadImageDataUrl = (src: string): Promise<string | null> =>
    fetch(src)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => null);

  const [sixthGearLogo, dmLogo, signature] = await Promise.all([
    loadImageDataUrl("/sixth-gear-logo.png"),
    loadImageDataUrl("/dm.png"),
    loadImageDataUrl("/sign.png"),
  ]);

  // ===== Branding row — Sixth Gear Garage (left) / DriverMade logo (right) =====
  // Text x-position is derived from the logo's own width (plus a fixed gap) so the
  // name/subtitle never sit under the logo, however large or small it is drawn.
  const sgLogoSize = 16;
  const brandTextX = margin + sgLogoSize + 6;
  if (sixthGearLogo) doc.addImage(sixthGearLogo, "PNG", margin, y - 7, sgLogoSize, sgLogoSize);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 13, 13);
  doc.text("Sixth Gear Garage", brandTextX, y - 2);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(107, 114, 128);
  doc.text("ABU DHABI, UAE", brandTextX, y + 3.5);

  if (dmLogo) {
    const dmHeight = 26.5;
    const dmWidth = dmHeight * (1280 / 1804);
    doc.addImage(dmLogo, "PNG", pageWidth - margin - dmWidth, y - 12.25, dmWidth, dmHeight);
  }

  y += 17;

  // ===== TRN =====
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("TRN: 100234567800003", margin, y);

  y += 11;

  // ===== Three-column info section: BILL TO / VEHICLE / INVOICE DETAILS =====
  const colWidth = contentWidth / 3;
  const col1X = margin;
  const col2X = margin + colWidth + 4;
  const col3Right = pageWidth - margin;
  const infoTop = y;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("BILL TO", col1X, y);
  doc.setFontSize(9.5);
  const nameLines = doc.splitTextToSize(invoice.customers?.name || "N/A", colWidth - 4);
  doc.text(nameLines, col1X, y + 5.5);
  const nameOffset = (nameLines.length - 1) * 4.5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customers?.phone || "", col1X, y + 9.5 + nameOffset);
  doc.text(invoice.customers?.address || "Abu Dhabi, UAE", col1X, y + 13.5 + nameOffset);

  if (invoice.car_make || invoice.car_model || invoice.car_year || invoice.license_plate) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("VEHICLE", col2X, y);
    let vy = y + 5.5;
    if (invoice.car_make || invoice.car_model || invoice.car_year) {
      doc.setFontSize(9.5);
      doc.text(
        `${invoice.car_year || ""} ${invoice.car_make || ""} ${invoice.car_model || ""}`.replace(/\s+/g, " ").trim(),
        col2X,
        vy
      );
      vy += 4;
    }
    if (invoice.license_plate) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Plate: ${invoice.license_plate}`, col2X, vy + 3.5);
    }
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  const labelX = col3Right - 26;
  doc.text("INVOICE #", labelX, y, { align: "right" });
  doc.text("DATE ISSUED", labelX, y + 5, { align: "right" });
  doc.text("DUE DATE", labelX, y + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoice_number, col3Right, y, { align: "right" });
  doc.text(formatDate(invoice.issue_date), col3Right, y + 5, { align: "right" });
  doc.text("Upon receipt", col3Right, y + 10, { align: "right" });

  y = infoTop + 24;

  // ===== Items table — dark header row =====
  const tableData = (invoice.invoice_items || []).map((item, i) => [
    i + 1,
    item.description,
    item.quantity,
    formatCurrency(item.unit_price),
    formatCurrency(item.total)
  ]);

  y = drawSimpleTable(
    doc,
    y,
    margin,
    contentWidth,
    ["SR.NO", "DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"],
    tableData,
    [contentWidth * 0.06, contentWidth * 0.62, contentWidth * 0.06, contentWidth * 0.13, contentWidth * 0.13],
    {
      align: ["left", "left", "right", "right", "right"],
      headFill: [17, 24, 39],
      wrapColumn: 1,
    }
  ) + 12;

  // ===== Totals (right) + "Thank you" (left) =====
  ensureSpace(50);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(107, 114, 128);
  doc.text("Thank you for your business!", margin, y + 14);

  const totalsLabelX = pageWidth - margin - 34;
  const totalsValueX = pageWidth - margin;
  let ty = y;

  const totalsRow = (label: string, value: string, valueColor: RGB = [17, 24, 39], labelColor: RGB = [107, 114, 128]) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(label, totalsLabelX, ty, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    doc.text(value, totalsValueX, ty, { align: "right" });
    ty += 5.5;
  };

  totalsRow("SUBTOTAL", formatCurrency(invoice.subtotal));
  totalsRow("TAX RATE", "5%");
  totalsRow("TAX", formatCurrency(invoice.tax_amount));
  if (invoice.discount > 0) {
    totalsRow("DISCOUNT", `-${formatCurrency(invoice.discount)}`, [220, 38, 38], [220, 38, 38]);
  }

  // TOTAL row — purple filled background, matching the on-page highlight
  const totalBoxWidth = 46;
  doc.setFillColor(168, 85, 247);
  doc.rect(totalsValueX - totalBoxWidth, ty - 4, totalBoxWidth, 7, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("TOTAL", totalsLabelX, ty, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(invoice.total), totalsValueX - 3, ty, { align: "right" });

  y = ty + 20;

  // ===== Signature block =====
  ensureSpace(36);
  const sigRight = pageWidth - margin;
  const sigWidth = 32;
  if (signature) {
    const sigHeight = sigWidth * (370 / 675);
    doc.addImage(signature, "PNG", sigRight - sigWidth, y - sigHeight, sigWidth, sigHeight);
  }
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(0.6);
  doc.line(sigRight - sigWidth, y + 2, sigRight, y + 2);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("AUTHORIZED SIGNATURE", sigRight - sigWidth / 2, y + 6, { align: "center" });

  y += 18;

  // ===== Terms & Conditions =====
  ensureSpace(46);
  doc.setDrawColor(34, 34, 34);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("TERMS & CONDITIONS", margin, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(31, 41, 55);
  [
    "Please make bank transfers payable to:",
    "SIXTH GEAR AUTO WORKSHOP LLC SPC",
    "Bank Name: ABU DHABI COMMERCIAL BANK",
    "Account Number: 14387056920001",
    "IBAN: AE850030014387056920001",
    "SWIFT/BIC: ADCBAEAAXXX",
    `Reference: ${invoice.invoice_number}`,
  ].forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });

  // ===== Top purple/dark bar + bottom black bar on every page =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(168, 85, 247);
    doc.rect(0, 0, pageWidth, 3, "F");
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 3, pageWidth, 3, "F");
    doc.setFillColor(0, 0, 0);
    doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  }

  doc.save(`${invoice.invoice_number}.pdf`);
};

export const generateDiagnosticReportPDF = (
  report: DiagnosticReport & { customers?: Customer; vehicles?: Vehicle }
) => {
  const doc = new jsPDF() as any;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const colGap = 12;
  const halfWidth = (contentWidth - colGap) / 2;
  let y = 25;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin - 12) {
      doc.addPage();
      y = 25;
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(16);
    doc.setFillColor(168, 85, 247);
    doc.rect(margin, y, 3, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 6, y + 5);
    y += 12;
  };

  const emptyNote = (text: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text(text, margin, y);
    y += 10;
  };

  const fieldBlock = (label: string, value: string, width = contentWidth) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "—", width);
    ensureSpace(lines.length * 4 + 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), margin, y);
    y += 4.5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 6;
  };

  const badge = (text: string, x: number, baselineY: number, positive: boolean) => {
    const fill: RGB = positive ? [220, 252, 231] : [254, 249, 195];
    const textColor: RGB = positive ? [22, 101, 52] : [161, 98, 7];
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const w = doc.getTextWidth(text) + 8;
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(x - w, baselineY - 4.5, w, 6.5, 3, 3, "F");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(text, x - w + 4, baselineY);
    return w;
  };

  // ===== Header — branding, report number, status, lead engineer, platform, date =====
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("DRIVERMADE", margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(168, 85, 247);
  doc.text("WORKSHOP DIAGNOSTIC REPORT", margin, y + 6);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(report.report_number, pageWidth - margin, y, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Status: ${report.status.toUpperCase()}`, pageWidth - margin, y + 6, { align: "right" });
  doc.text(`Lead Engineer: ${report.lead_engineer || "—"}`, pageWidth - margin, y + 11, { align: "right" });
  doc.text(`Platform: ${report.platform || "—"}`, pageWidth - margin, y + 16, { align: "right" });
  doc.text(`Date: ${formatDate(report.created_at)}`, pageWidth - margin, y + 21, { align: "right" });

  y += 32;
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ===== Customer & Vehicle =====
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CUSTOMER", margin, y);
  doc.text("VEHICLE", margin + halfWidth + colGap, y);
  y += 5.5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(report.customers?.name || "N/A", margin, y);
  const vehicleLine = report.vehicles
    ? `${report.vehicles.year || ""} ${report.vehicles.make || ""} ${report.vehicles.model || ""}`.replace(/\s+/g, " ").trim()
    : "";
  doc.text(vehicleLine || "N/A", margin + halfWidth + colGap, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(report.customers?.phone || "—", margin, y);
  doc.text(`Plate: ${report.vehicles?.license_plate || "—"}   VIN: ${report.vehicles?.vin || "—"}`, margin + halfWidth + colGap, y);
  y += 14;

  // ===== Section 01 — The Case =====
  sectionTitle("01 · THE CASE");
  fieldBlock("Reported Symptom", report.reported_symptom || "");
  fieldBlock("Occurs When", report.occurs_when || "");
  fieldBlock("Prior Workshops", report.prior_workshops || "");
  fieldBlock("Brief", report.brief || "");

  // ===== Section 02 — Fault Codes =====
  sectionTitle("02 · FAULT CODES");
  if (report.fault_codes?.length) {
    ensureSpace(7 + Math.min(report.fault_codes.length, 3) * 7);
    y = drawSimpleTable(
      doc, y, margin, contentWidth,
      ["CODE", "DESCRIPTION"],
      report.fault_codes.map((fc) => [fc.code || "—", fc.description || "—"]),
      [40, contentWidth - 40]
    ) + 10;
  } else {
    emptyNote("No fault codes recorded.");
  }

  // ===== Section 03 — Measurements (highlight LEAN/LEAK/FAULT rows) =====
  sectionTitle("03 · MEASUREMENTS");
  const flagPattern = /LEAN|LEAK|FAULT/i;
  const isFlagged = (m: Measurement) =>
    flagPattern.test(m.measured || "") || flagPattern.test(m.read || "") || flagPattern.test(m.spec || "");
  if (report.measurements?.length) {
    ensureSpace(7 + Math.min(report.measurements.length, 3) * 7);
    y = drawSimpleTable(
      doc, y, margin, contentWidth,
      ["PARAMETER", "MEASURED", "SPEC / EXPECTED", "READ"],
      report.measurements.map((m) => [m.parameter || "—", m.measured || "—", m.spec || "—", m.read || "—"]),
      [contentWidth * 0.28, contentWidth * 0.24, contentWidth * 0.24, contentWidth * 0.24],
      {
        rowFill: (i) => (isFlagged(report.measurements[i]) ? ([254, 226, 226] as RGB) : (i % 2 === 1 ? ([248, 250, 252] as RGB) : null)),
        rowTextColor: (i) => (isFlagged(report.measurements[i]) ? ([185, 28, 28] as RGB) : null),
        rowBold: (i) => isFlagged(report.measurements[i]),
      }
    ) + 10;
  } else {
    emptyNote("No measurements recorded.");
  }

  // ===== Section 04 — Root Cause (confirmed box + badge) =====
  sectionTitle("04 · ROOT CAUSE");
  const isConfirmed = report.status === "confirmed" || report.status === "verified";
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const rcLines = doc.splitTextToSize(report.root_cause || "—", contentWidth - 8);
  const rootCauseBoxHeight = Math.max(22, rcLines.length * 4 + 18);
  ensureSpace(rootCauseBoxHeight + 6);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, rootCauseBoxHeight, 2, 2);
  doc.setTextColor(30, 41, 59);
  doc.text(rcLines, margin + 4, y + 7);
  badge(isConfirmed ? "ROOT CAUSE CONFIRMED" : "NOT YET CONFIRMED", margin + contentWidth - 4, y + rootCauseBoxHeight - 7, isConfirmed);
  y += rootCauseBoxHeight + 12;

  // ===== Section 05 — Recommended Intervention =====
  sectionTitle("05 · RECOMMENDED INTERVENTION");
  const partsTotal = (report.required_parts || []).reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  if (report.required_parts?.length) {
    const rows = report.required_parts.map((p) => [p.name || "—", p.part_number || "—", formatCurrency(Number(p.price) || 0)]);
    rows.push(["Parts Subtotal", "", formatCurrency(partsTotal)]);
    ensureSpace(7 + Math.min(rows.length, 3) * 7);
    y = drawSimpleTable(
      doc, y, margin, contentWidth,
      ["PART", "PART NUMBER", "PRICE"],
      rows,
      [contentWidth * 0.45, contentWidth * 0.3, contentWidth * 0.25],
      {
        align: ["left", "left", "right"],
        rowBold: (i) => i === rows.length - 1,
      }
    ) + 8;
  } else {
    emptyNote("No parts required.");
  }

  fieldBlock("Labour", `${report.labour_hours || 0} hours • ${formatCurrency(report.labour_cost || 0)}`);
  fieldBlock("Advisory Notes", report.advisory_notes || "");

  const interventionTotal = partsTotal + (Number(report.labour_cost) || 0);
  ensureSpace(16);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL RECOMMENDED SPEND", margin, y);
  doc.setTextColor(168, 85, 247);
  doc.text(formatCurrency(interventionTotal), margin + contentWidth, y, { align: "right" });
  y += 14;

  // ===== Section 06 — Verification (before/after fuel trim, status, resolved badge) =====
  sectionTitle("06 · VERIFICATION");
  const isResolved = report.status === "verified" || /resolved|fixed|pass(ed)?|no fault/i.test(report.verification_status || "");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("BEFORE FUEL TRIM", margin, y);
  doc.text("AFTER FUEL TRIM", margin + halfWidth + colGap, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(report.before_fuel_trim || "—", margin, y);
  doc.text(report.after_fuel_trim || "—", margin + halfWidth + colGap, y);
  y += 11;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("VERIFICATION STATUS", margin, y);
  badge(isResolved ? "RESOLVED" : "PENDING VERIFICATION", margin + contentWidth, y, isResolved);

  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  const vsLines = doc.splitTextToSize(report.verification_status || "—", contentWidth);
  ensureSpace(vsLines.length * 4 + 16);
  doc.text(vsLines, margin, y);
  y += vsLines.length * 4 + 6;

  fieldBlock("Diagnostic Fee", formatCurrency(report.diagnostic_fee || 0), halfWidth);

  // ===== Footer (every page) — branding + location =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("DRIVERMADE", margin, pageHeight - 12);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Musaffah, Abu Dhabi, UAE", pageWidth - margin, pageHeight - 12, { align: "right" });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: "center" });
  }

  doc.save(`DM-${report.report_number}-diagnostic-report.pdf`);
};
