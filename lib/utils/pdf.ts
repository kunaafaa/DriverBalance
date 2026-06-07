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
  } = {}
): number => {
  const rowHeight = 7;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - margin;
  const {
    align = [],
    headFill = [17, 24, 39],
    headTextColor = [255, 255, 255],
    rowFill,
    rowTextColor,
    rowBold,
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
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = margin;
      drawHead();
    }
    const fill = rowFill?.(ri);
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }
    const tc = rowTextColor?.(ri) || [51, 65, 85];
    doc.setTextColor(tc[0], tc[1], tc[2]);
    doc.setFont("helvetica", rowBold?.(ri) ? "bold" : "normal");
    doc.setFontSize(8);
    let x = margin;
    row.forEach((cell, ci) => {
      const a = align[ci] === "right" ? "right" : "left";
      doc.text(String(cell), a === "right" ? x + colWidths[ci] - 3 : x + 3, y + 4.8, { align: a });
      x += colWidths[ci];
    });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);
    y += rowHeight;
  });

  return y;
};

export const generateInvoicePDF = (
  invoice: Invoice & { customers?: Customer, vehicles?: Vehicle, invoice_items?: InvoiceItem[] }
) => {
  const doc = new jsPDF() as any;
  const margin = 20;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("DRIVERBALANCE", margin, 25);
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text("AUTO SERVICE & MAINTENANCE", margin, 31);

  // Invoice Label
  doc.setFontSize(30);
  doc.setTextColor(241, 245, 249); // slate-100
  doc.text("INVOICE", 140, 30);

  // Business Info
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Abu Dhabi, UAE", margin, 45);
  doc.text("support@drivermade.co", margin, 50);

  // Invoice Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 45);
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, 140, 50);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 55);

  // Customer Info
  doc.setFontSize(12);
  doc.text("BILL TO:", margin, 70);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customers?.name || "N/A", margin, 76);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customers?.phone || "", margin, 81);

  // Vehicle Info
  doc.setFontSize(12);
  doc.text("VEHICLE:", 110, 70);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.vehicles ? `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` : "N/A", 110, 76);
  doc.setFont("helvetica", "normal");
  doc.text(`Plate: ${invoice.vehicles?.license_plate || "N/A"}`, 110, 81);
  doc.text(`VIN: ${invoice.vehicles?.vin || "N/A"}`, 110, 86);

  // Table
  const tableData = invoice.invoice_items?.map((item, i) => [
    i + 1,
    item.description,
    item.quantity,
    formatCurrency(item.unit_price),
    formatCurrency(item.total)
  ]) || [];

  const tableWidth = 210 - margin * 2;
  const finalY = drawSimpleTable(
    doc,
    100,
    margin,
    tableWidth,
    ["#", "Description", "Qty", "Price", "Total"],
    tableData,
    [15, 55, 30, 35, 35],
    {
      align: ["left", "left", "right", "right", "right"],
      headFill: [37, 99, 235],
      rowFill: (i) => (i % 2 === 1 ? ([248, 250, 252] as RGB) : null),
    }
  ) + 10;

  // Totals
  doc.setFontSize(10);
  doc.text("Subtotal:", 140, finalY);
  doc.text(formatCurrency(invoice.subtotal), 180, finalY, { align: "right" });
  
  doc.text(`VAT (${invoice.tax_rate}%):`, 140, finalY + 7);
  doc.text(formatCurrency(invoice.tax_amount), 180, finalY + 7, { align: "right" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 140, finalY + 17);
  doc.text(formatCurrency(invoice.total), 180, finalY + 17, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for choosing DriverMade! We appreciate your business.", 105, 280, { align: "center" });

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
