import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import getDbPool from "@/util/dbConnect";

export const runtime = "nodejs";

type Body = { ipAddress?: string };

interface OrderRow extends RowDataPacket {
    ORDER_NO: string;
    ORDERER_NAME: string;
    IS_DONE: number;           // 0/1
    ORDER_DATE: string;        // o.INS_DATE
    ORDER_SEQ: number;

    MENU_ID: string;
    MENU_NAME: string;
    CATEGORY: "COFFEE" | "NON_COFFEE" | "ADE" | "TEA";

    QUANTITY: number;
    TEMP: "HOT" | "ICE" | null;
    ICE_AMT: "적게" | "보통" | "많이" | null;
    COFFEE_SHOT: "적게" | "보통" | "많이" | null;
    SHOT_TOGGLE: "없음" | "추가" | null;
    SWEETNESS: "덜 달게" | "보통" | null;
    ITEM_DATE: string;         // i.INS_DATE
}

export async function POST(req: NextRequest) {
    try {
        const { ipAddress } = (await req.json()) as Body;
        if (!ipAddress) {
            return NextResponse.json({ message: "IP address is required" }, { status: 400 });
        }

        const pool = getDbPool(ipAddress);

        // 새 스키마: GAP_ORDER(헤더) + GAP_ORDER_ITEM(상세) + menu
        const [rows] = await pool.query<OrderRow[]>(
            `
              SELECT
                o.ORDER_NO,
                o.ORDERER_NAME,
                o.IS_DONE,
                o.INS_DATE AS ORDER_DATE,
                i.ORDER_SEQ,
                i.MENU_ID,
                m.NAME AS MENU_NAME,
                m.CATEGORY,
                i.QUANTITY,
                i.TEMP,
                i.ICE_AMT,
                i.COFFEE_SHOT,
                i.SHOT_TOGGLE,
                i.SWEETNESS,
                i.INS_DATE AS ITEM_DATE
              FROM GAP_ORDER o
                JOIN GAP_ORDER_ITEM i ON i.ORDER_NO = o.ORDER_NO
                JOIN menu m ON m.ID = i.MENU_ID
              WHERE o.IS_DONE = 0
              ORDER BY o.INS_DATE ASC, i.ORDER_SEQ ASC
            `
        );

        return NextResponse.json(rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching new orders:", error);
        return NextResponse.json({ message: "Failed to fetch new orders" }, { status: 500 });
    }
}