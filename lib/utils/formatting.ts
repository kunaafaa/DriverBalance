// Format currency in UAE Dirhams
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date in UAE format (DD/MM/YYYY)
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// Format datetime (DD/MM/YYYY HH:mm)
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return "N/A";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Generate invoice number (INV-2025-001)
export function generateInvoiceNumber(index: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(index).padStart(3, "0")}`;
}
