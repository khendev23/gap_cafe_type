// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import getDbPool from "@/util/dbConnect";

export const runtime = "nodejs";

// ----- 타입들 (프론트 페이로드 기준) -----
type Temp = "HOT" | "ICE";
type IceLevel = "적게" | "보통" | "많이";
type CoffeeShot = "적게" | "보통" | "많이";
type ShotToggle = "없음" | "추가";
type Sweetness = "덜 달게" | "보통";
type Category = "COFFEE" | "NON_COFFEE" | "ADE" | "TEA";

interface Options {
    temp?: Temp;
    ice?: IceLevel;
    coffeeShot?: CoffeeShot;  // coffee
    shotToggle?: ShotToggle;  // non-coffee, ade
    sweetness?: Sweetness;    // non-coffee, ade
}

interface ItemNew {
    id: string | number;
    name: string;
    category: Category;
    qty: number;
    options: Options;
}

interface BodyNew {
    ipAddress?: string;
    orderInfo?: { customerName?: string };
    items?: ItemNew[];
}

// 주문번호 생성 (YYYYMMDD + 3자리 시퀀스)
async function generateOrderNumber(pool: Pool): Promise<string> {
    const sql = `
        SELECT MAX(ORDER_NO) AS lastOrderNo
        FROM GAP_ORDER
        WHERE INS_DATE >= CURDATE() AND INS_DATE < CURDATE() + INTERVAL 1 DAY
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql);
    const last = rows?.[0]?.lastOrderNo as string | null;

    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const base = `${y}${m}${day}`;

    if (!last) return `${base}001`;
    const seq = parseInt(last.slice(8), 10) || 0;
    return `${base}${String(seq + 1).padStart(3, "0")}`;
}

// 신규 아이템 → 상세 테이블 컬럼 매핑
function mapItem(item: ItemNew) {
    const isIce = item.options?.temp === "ICE";
    const iceAmt = isIce ? (item.options?.ice ?? "보통") : null;

    let coffeeShot: CoffeeShot | null = null;
    let shotToggle: ShotToggle | null = null;
    let sweetness: Sweetness | null = null;

    switch (item.category) {
        case "COFFEE":
            coffeeShot = item.options?.coffeeShot ?? "보통";
            break;
        case "NON_COFFEE":
        case "ADE":
            shotToggle = item.options?.shotToggle ?? "없음";
            sweetness = item.options?.sweetness ?? "보통";
            break;
        case "TEA":
            // 옵션 없음
            break;
    }

    return {
        MENU_ID: item.id,
        CATEGORY: item.category,
        QUANTITY: item.qty,
        TEMP: item.options?.temp ?? null,
        ICE_AMT: iceAmt,
        COFFEE_SHOT: coffeeShot,
        SHOT_TOGGLE: shotToggle,
        SWEETNESS: sweetness,
        OPTIONS_JSON: JSON.stringify(item.options ?? {}),
    };
}

export async function POST(req: NextRequest) {
    let conn: PoolConnection | null = null;

    try {
        const body = (await req.json()) as BodyNew;
        const ipAddress = body.ipAddress;
        const items = body.items ?? [];
        const ordererName = body.orderInfo?.customerName?.trim() || "손님";

        if (!ipAddress) {
            return NextResponse.json({ message: "IP address is required" }, { status: 400 });
        }
        if (items.length === 0) {
            return NextResponse.json({ message: "No items to order" }, { status: 400 });
        }

        const pool = getDbPool(ipAddress);
        const orderNo = await generateOrderNumber(pool);

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1) 헤더
        await conn.execute(
            `INSERT INTO GAP_ORDER (ORDER_NO, ORDERER_NAME, BELL_NUM, IS_DONE, INS_DATE)
                    VALUES (?, ?, NULL, 0, NOW())`,
            [orderNo, ordererName]
        );

        // 2) 상세
        const insertItemSql = `
            INSERT INTO GAP_ORDER_ITEM
            (ORDER_NO, ORDER_SEQ, MENU_ID, CATEGORY, QUANTITY,
             TEMP, ICE_AMT, COFFEE_SHOT, SHOT_TOGGLE, SWEETNESS,
             OPTIONS_JSON, INS_DATE)
            VALUES
                (?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?,
                 ?, NOW())
        `;

        for (let i = 0; i < items.length; i++) {
            const r = mapItem(items[i]);
            const params = [
                orderNo,
                i + 1,
                r.MENU_ID,
                r.CATEGORY,
                r.QUANTITY,
                r.TEMP,
                r.ICE_AMT,
                r.COFFEE_SHOT,
                r.SHOT_TOGGLE,
                r.SWEETNESS,
                r.OPTIONS_JSON,
            ];
            await conn.execute(insertItemSql, params);
        }

        await conn.commit();
        return NextResponse.json({ success: true, orderNo }, { status: 200 });
    } catch (err) {
        console.error("Order save failed:", err);
        if (conn) {
            try { await conn.rollback(); } catch {}
        }
        return NextResponse.json({ success: false, message: "Failed to save order" }, { status: 500 });
    } finally {
        if (conn) conn.release();
    }
}