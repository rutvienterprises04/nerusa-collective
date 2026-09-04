/**
 * Shiprocket integration layer.
 *
 * You don't have a Shiprocket account yet, so this runs in MOCK mode:
 * every function simulates a realistic response so the rest of the app
 * (order flow, tracking page, admin panel) can be built and tested end to
 * end today. Once SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD are set in
 * .env.local, isMockMode() flips to false and these functions should be
 * pointed at the real Shiprocket API (https://apidocs.shiprocket.in/).
 *
 * Nothing outside this file needs to change when you switch over — every
 * call site only depends on the exported function signatures below.
 */

export function isMockMode(): boolean {
  return !process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD;
}

export interface CreateShipmentInput {
  orderNumber: string;
  customer: {
    name: string;
    mobile: string;
    email: string | null;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: { name: string; quantity: number; unitPriceRupees: number }[];
  totalRupees: number;
}

export interface ShipmentResult {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  awb: string | null;
  courierName: string | null;
  trackingUrl: string | null;
}

/** Creates the order on Shiprocket (or simulates it in mock mode). */
export async function createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
  if (isMockMode()) {
    const fakeId = `MOCK-${Date.now()}`;
    return {
      shiprocketOrderId: fakeId,
      shiprocketShipmentId: `${fakeId}-S`,
      awb: null, // assigned once "shipped" — see assignAwb()
      courierName: null,
      trackingUrl: null,
    };
  }

  // --- Real integration (fill in once you have credentials) ---
  // 1. POST /v1/external/auth/login with SHIPROCKET_EMAIL/PASSWORD, cache the token.
  // 2. POST /v1/external/orders/create/adhoc with the order + address + items,
  //    using SHIPROCKET_PICKUP_LOCATION as pickup_location.
  // 3. Return the real order_id / shipment_id from the response.
  throw new Error(
    "Shiprocket live mode is not implemented yet. Add credentials only once you're ready to wire up the real API calls in src/lib/shiprocket.ts."
  );
}

/** Called when admin marks an order "shipped" — assigns a courier + AWB. */
export async function assignAwb(shiprocketShipmentId: string): Promise<{
  awb: string;
  courierName: string;
  trackingUrl: string;
}> {
  if (isMockMode()) {
    const awb = `MOCKAWB${Math.floor(Math.random() * 1_000_000_000)}`;
    return {
      awb,
      courierName: "Mock Courier Co.",
      trackingUrl: `https://example.com/mock-tracking/${awb}`,
    };
  }

  throw new Error("Shiprocket live mode is not implemented yet.");
}

export interface TrackingUpdate {
  status: string;
  location?: string;
  timestamp: string;
}

/** Polled/webhooked to sync real-world courier status into our order status. */
export async function getTrackingUpdates(awb: string): Promise<TrackingUpdate[]> {
  if (isMockMode()) {
    return [
      { status: "Shipment picked up", timestamp: new Date().toISOString() },
    ];
  }

  throw new Error("Shiprocket live mode is not implemented yet.");
}
