// app/api/menus/updateMenuUseYn/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Pool } from "mysql2/promise";
import getDbPool from "@/util/dbConnect";

export const runtime = "nodejs";

type Body = {
    menuId?: string;
    useYN?: "Y" | "N" | string;
    ipAddress?: string;
};

export async function POST(req: NextRequest) {
    try {
        const { menuId, useYN, ipAddress } = (await req.json()) as Body;

        // 기본 검증
        if (!ipAddress) {
            return NextResponse.json({ message: "IP address is required" }, { status: 400 });
        }
        if (menuId === undefined || menuId === null) {
            return NextResponse.json({ message: "menuId is invalid" }, { status: 400 });
        }
        if (useYN !== "Y" && useYN !== "N") {
            return NextResponse.json({ message: "useYN must be 'Y' or 'N'" }, { status: 400 });
        }

        const pool: Pool = getDbPool(ipAddress);

        console.log(useYN, menuId)
        // Prepared Statement
        const sql = "UPDATE menu SET USE_YN = ? WHERE ID = ?";
        const params = [useYN, menuId];

        await pool.execute(sql, params);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Update menu USE_YN failed:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update menu useYN" },
            { status: 500 }
        );
    }
}