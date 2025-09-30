// app/api/menus/bestMenus/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import getDbPool from "@/util/dbConnect";

export const runtime = "nodejs";

type PostBody = { ipAddress?: string };

interface BestMenuRow extends RowDataPacket {
    MENU_ID: number;
    cnt: number;
}

export async function POST(req: NextRequest) {
    try {
        const { ipAddress } = (await req.json()) as PostBody;

        if (!ipAddress) {
            return NextResponse.json({ message: "IP address is required" }, { status: 400 });
        }

        const pool = getDbPool(ipAddress);

        // 새 스키마: GAP_ORDER_ITEM에서 합산
        const [rows] = await pool.query<BestMenuRow[]>(
            `
                  SELECT MENU_ID, SUM(QUANTITY) AS cnt
                  FROM GAP_ORDER_ITEM
                  GROUP BY MENU_ID
                  ORDER BY cnt DESC
                  LIMIT 3
                `
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching best menus:", error);
        return NextResponse.json({ message: "Failed to fetch best menus" }, { status: 500 });
    }
}