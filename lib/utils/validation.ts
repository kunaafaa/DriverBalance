import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().optional().nullable().or(z.literal("")),
  city: z.string().optional().nullable().default("Abu Dhabi"),
  postal_code: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const vehicleSchema = z.object({
  customer_id: z.string().uuid("Invalid customer ID"),
  make: z.string().min(2, "Make required"),
  model: z.string().min(2, "Model required"),
  year: z.coerce.number().min(1900).max(2100),
  vin: z.string().length(17, "VIN must be 17 characters"),
  license_plate: z.string().min(3, "License plate must be at least 3 characters"),
  color: z.string().optional().nullable().or(z.literal("")),
  engine_type: z.enum(["Petrol", "Diesel", "Hybrid"]).optional().nullable().default("Petrol"),
  mileage_at_registration: z.coerce.number().optional().nullable().default(0),
  current_mileage: z.coerce.number().optional().nullable().default(0),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const appointmentSchema = z.object({
  customer_id: z.string().uuid("Invalid customer"),
  vehicle_id: z.string().uuid("Invalid vehicle"),
  scheduled_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  estimated_duration_minutes: z.coerce.number().min(15).default(60),
  services: z.array(z.string().uuid()).min(1, "At least one service required"),
  technician_assigned: z.string().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const inventorySchema = z.object({
  name: z.string().min(2, "Name required"),
  sku: z.string().min(3, "SKU required"),
  category: z.string().optional().nullable().or(z.literal("")),
  quantity_in_stock: z.coerce.number().min(0),
  reorder_level: z.coerce.number().min(0).default(5),
  unit_price: z.coerce.number().min(0),
  supplier: z.string().optional().nullable().or(z.literal("")),
  supplier_contact: z.string().optional().nullable().or(z.literal("")),
});

export const invoiceSchema = z.object({
  appointment_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid("Invalid customer"),
  invoice_number: z.string(),
  issue_date: z.string(),
  due_date: z.string().optional().nullable(),
  items: z.array(z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.coerce.number().min(1),
    unit_price: z.coerce.number().min(0),
    item_type: z.enum(["service", "part", "labor"]),
  })).min(1, "At least one item required"),
  tax_rate: z.coerce.number().default(5),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable().or(z.literal("")),
  payment_method: z.enum(["cash", "card", "bank_transfer", "pending"]).default("pending"),
});
