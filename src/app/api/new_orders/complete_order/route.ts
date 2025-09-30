import { NextRequest, NextResponse } from "next/server";
import getDbPool from "@/util/dbConnect";

export const runtime = "nodejs";

type Body = { ipAddress?: string; orderNo?: string };

export async function POST(req: NextRequest) {
    try {
        const { ipAddress, orderNo } = (await req.json()) as Body;

        if (!ipAddress) {
            return NextResponse.json({ message: "IP address is required" }, { status: 400 });
        }
        if (!orderNo) {
            return NextResponse.json({ message: "orderNo is required" }, { status: 400 });
        }

        const pool = getDbPool(ipAddress);
        await pool.execute(
            `UPDATE GAP_ORDER SET IS_DONE = 1, UPDATED_AT = NOW() WHERE ORDER_NO = ?`,
            [orderNo]
        );

        return NextResponse.json({ success: true, orderNo }, { status: 200 });
    } catch (error) {
        console.error("Error completing order:", error);
        return NextResponse.json({ success: false, message: "Failed to complete order" }, { status: 500 });
    }
}