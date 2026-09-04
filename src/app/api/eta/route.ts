import { NextRequest, NextResponse } from "next/server";
import { estimateDeliveryForPincode } from "@/lib/eta";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode");
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Provide a valid 6-digit pincode" }, { status: 400 });
  }

  try {
    const eta = await estimateDeliveryForPincode(pincode);
    return NextResponse.json(eta);
  } catch {
    return NextResponse.json({ error: "Could not estimate delivery time" }, { status: 500 });
  }
}
