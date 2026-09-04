import { createServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * Estimated-time-of-delivery engine.
 *
 * Phase 1 (now): no delivery history exists yet, so we fall back to a
 * conservative flat default per zone-type (same city / same state / other).
 *
 * Phase 2 (automatic, no code change needed): once `delivery_stats_by_pincode`
 * has rows — populated by `recomputeDeliveryStats()`, which should be run
 * after every order is marked "delivered" (see order status update route) —
 * the estimate is drawn from your OWN historical accept -> pack -> ship ->
 * deliver durations for that pincode. This is the "learns from past
 * deliveries" piece: it's a running average today, and because it reads from
 * one function, it can be swapped for a weighted/regression model later
 * without touching any call site.
 */

const DEFAULT_ESTIMATE_HOURS = {
  sameCity: 48, // 2 days
  sameState: 96, // 4 days
  other: 144, // 6 days
};

const SHOP_PINCODE_PREFIX = process.env.SHOP_PINCODE?.slice(0, 3) ?? null;

export interface EtaResult {
  estimatedHours: number;
  estimatedDays: number;
  estimatedDate: string; // ISO date
  basis: "historical" | "default";
  sampleSize: number;
}

export async function estimateDeliveryForPincode(pincode: string): Promise<EtaResult> {
  const supabase = createServiceSupabaseClient();

  const { data: stat } = await supabase
    .from("delivery_stats_by_pincode")
    .select("*")
    .eq("pincode", pincode)
    .maybeSingle();

  let hours: number;
  let basis: EtaResult["basis"] = "default";
  let sampleSize = 0;

  // Only trust the historical average once we have a handful of delivered
  // orders for this pincode — otherwise a single fast/slow fluke skews it.
  if (stat && stat.orders_delivered >= 3 && stat.avg_total_hours) {
    hours = Number(stat.avg_total_hours);
    basis = "historical";
    sampleSize = stat.orders_delivered;
  } else {
    hours = fallbackEstimate(pincode);
  }

  const estimatedDate = new Date(Date.now() + hours * 60 * 60 * 1000);

  return {
    estimatedHours: Math.round(hours),
    estimatedDays: Math.round((hours / 24) * 10) / 10,
    estimatedDate: estimatedDate.toISOString().slice(0, 10),
    basis,
    sampleSize,
  };
}

function fallbackEstimate(pincode: string): number {
  if (!SHOP_PINCODE_PREFIX) return DEFAULT_ESTIMATE_HOURS.other;
  if (pincode.slice(0, 3) === SHOP_PINCODE_PREFIX) return DEFAULT_ESTIMATE_HOURS.sameCity;
  if (pincode.slice(0, 1) === SHOP_PINCODE_PREFIX.slice(0, 1)) return DEFAULT_ESTIMATE_HOURS.sameState;
  return DEFAULT_ESTIMATE_HOURS.other;
}

/**
 * Recompute the rolling per-pincode averages from delivered orders.
 * Call this (e.g. from the admin "mark delivered" action) so the estimate
 * keeps improving as more real deliveries complete.
 */
export async function recomputeDeliveryStats(pincode: string) {
  const supabase = createServiceSupabaseClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "placed_at, confirmed_at, packed_at, shipped_at, delivered_at, customers!inner(pincode)"
    )
    .eq("status", "delivered")
    .eq("customers.pincode", pincode)
    .limit(200);

  if (error || !orders || orders.length === 0) return;

  const durations = orders
    .map((o) => {
      const placed = new Date(o.placed_at).getTime();
      const confirmed = o.confirmed_at ? new Date(o.confirmed_at).getTime() : null;
      const packed = o.packed_at ? new Date(o.packed_at).getTime() : null;
      const shipped = o.shipped_at ? new Date(o.shipped_at).getTime() : null;
      const delivered = o.delivered_at ? new Date(o.delivered_at).getTime() : null;
      if (!delivered) return null;

      const hrs = (a: number | null, b: number | null) =>
        a !== null && b !== null ? (b - a) / (1000 * 60 * 60) : null;

      return {
        accept: hrs(placed, confirmed),
        pack: hrs(confirmed, packed),
        ship: hrs(packed, shipped),
        transit: hrs(shipped, delivered),
        total: hrs(placed, delivered),
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const avg = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v !== null);
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  await supabase.from("delivery_stats_by_pincode").upsert({
    pincode,
    orders_delivered: durations.length,
    avg_accept_hours: avg(durations.map((d) => d.accept)),
    avg_pack_hours: avg(durations.map((d) => d.pack)),
    avg_ship_hours: avg(durations.map((d) => d.ship)),
    avg_transit_hours: avg(durations.map((d) => d.transit)),
    avg_total_hours: avg(durations.map((d) => d.total)),
    updated_at: new Date().toISOString(),
  });
}
