export type DatabaseStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "cancelled";
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type DiagnosticReportStatus = "draft" | "confirmed" | "verified";
export type ItemType = "service" | "part" | "labor";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "pending";

// Bookkeeping layer
export type ExpenseCategory =
  | "rent" | "salaries" | "cogs_parts" | "tools" | "marketing"
  | "utilities" | "subscriptions" | "bank_fees" | "other";
export type BillStatus = "unpaid" | "partial" | "paid";
export type ReceivedPaymentMethod = "cash" | "card" | "bank_transfer";

export interface Expense {
  id: string;
  expense_date: string;
  vendor?: string;
  category: ExpenseCategory;
  amount: number;
  vat_amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  category?: string;
  payment_terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  vendor_id?: string | null;
  bill_number?: string;
  bill_date: string;
  due_date?: string;
  category?: string;
  amount: number;
  vat_amount: number;
  amount_paid: number;
  status: BillStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins
  vendors?: Vendor | null;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method?: ReceivedPaymentMethod;
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city: string;
  postal_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color?: string;
  engine_type?: string;
  mileage_at_registration?: number;
  current_mileage?: number;
  last_service_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  category?: string;
  description?: string;
  base_price: number;
  estimated_duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  customer_id: string;
  vehicle_id: string;
  scheduled_date: string;
  estimated_duration_minutes: number;
  status: DatabaseStatus;
  notes?: string;
  technician_assigned?: string;
  completion_time?: string;
  created_at: string;
  updated_at: string;
  // Joins
  customers?: Customer;
  vehicles?: Vehicle;
  appointment_services?: AppointmentService[];
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_type_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  created_at: string;
  // Joins
  service_types?: ServiceType;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  category?: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_price: number;
  cost_price?: number;
  supplier?: string;
  supplier_contact?: string;
  last_restocked?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  appointment_id?: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  license_plate?: string;
  created_at: string;
  updated_at: string;
  // Joins
  customers?: Customer;
  invoice_items?: InvoiceItem[];
  appointments?: {
    id: string;
    vehicles?: {
      id: string;
      make: string;
      model: string;
      year: number;
      license_plate: string;
    } | null;
  } | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost_price?: number;
  item_type: ItemType;
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  issue_date: string;
  valid_until?: string;
  car_make: string;
  car_model: string;
  car_year: number;
  license_plate: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins
  quotation_items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  item_type: ItemType;
  created_at: string;
}

export interface FaultCode {
  code: string;
  description: string;
}

export interface Measurement {
  parameter: string;
  measured: string;
  spec: string;
  read: string;
}

export interface RequiredPart {
  name: string;
  part_number: string;
  price: number;
}

export interface DiagnosticReport {
  id: string;
  report_number: string;
  customer_id?: string;
  vehicle_id?: string;
  lead_engineer?: string;
  platform?: string;
  status: DiagnosticReportStatus;
  reported_symptom?: string;
  occurs_when?: string;
  prior_workshops?: string;
  brief?: string;
  fault_codes: FaultCode[];
  measurements: Measurement[];
  root_cause?: string;
  required_parts: RequiredPart[];
  labour_hours: number;
  labour_cost: number;
  advisory_notes?: string;
  before_fuel_trim?: string;
  after_fuel_trim?: string;
  verification_status?: string;
  diagnostic_fee: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins
  customers?: Customer;
  vehicles?: Vehicle;
}

export interface ServiceHistory {
  id: string;
  vehicle_id: string;
  appointment_id?: string;
  service_description: string;
  parts_used?: string;
  mileage_at_service?: number;
  date_completed: string;
  total_cost?: number;
  technician?: string;
  notes?: string;
  created_at: string;
}
