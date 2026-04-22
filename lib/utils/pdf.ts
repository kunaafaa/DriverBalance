import jsPDF from "jspdf";
import "jspdf-autotable";
import { Invoice, Customer, Vehicle, InvoiceItem } from "@/lib/types";
import { formatCurrency, formatDate } from "./formatting";

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
  doc.text(invoice.customers?.email || "", margin, 86);

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

  doc.autoTable({
    startY: 100,
    head: [["#", "Description", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
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
