export type OrderStatus =
  | "placed"
  | "payment_pending_verification"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Order Placed",
  payment_pending_verification: "Payment Under Verification",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "placed",
  "payment_pending_verification",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price_paise: number;
  moq: number;
  image_url: string | null;
  original_image_url: string | null;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  upi_reference: string | null;
  payment_confirmed_at: string | null;
  payment_confirmed_by: string | null;
  estimated_delivery_days: number | null;
  estimated_delivery_date: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  shiprocket_awb: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  placed_at: string;
  confirmed_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartLine {
  product_id: string;
  name: string;
  unit_price_paise: number;
  image_url: string | null;
  quantity: number;
}
