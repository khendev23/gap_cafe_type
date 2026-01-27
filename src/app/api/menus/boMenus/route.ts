// app/api/menus/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Pool, RowDataPacket } from "mysql2/promise";
import getDbPool from "@/util/dbConnect"; // ← TS라면 .js 빼세요. JS면 그대로 사용 가능

// mysql2 사용 시 Edge 런타임 불가 -> Node.js 런타임 강제
export const runtime = "nodejs";

// (선택) 빌드 캐시 회피가 필요하면 주석 해제
// export const dynamic = "force-dynamic";

type PostBody = {
    ipAddress?: string;
};

// 필요한 컬럼을 알고 있으면 여기에 명시적으로 정의하세요.
interface MenuRow extends RowDataPacket {
    ID: number;
    NAME: string;
    CATEGORY: string;
    USE_YN: "Y" | "N";
    IMG_URL?: string | null;
    IN_GAP_IMG_URL?: string | null;
    // ... 기타 컬럼 추가
}

export async function POST(req: NextRequest) {
    try {
        const { ipAddress } = (await req.json()) as PostBody;

        if (!ipAddress) {
            return NextResponse.json(
                { message: "IP address is required" },
                { status: 400 }
            );
        }

        const pool: Pool = getDbPool(ipAddress);

        const [rows] = await pool.query<MenuRow[]>(
            "SELECT * FROM menu ORDER BY USE_YN DESC, ID ASC"
        );

        return NextResponse.json(rows, {
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching menus:", error);
        return NextResponse.json(
            { message: "Failed to fetch menus" },
            { status: 500 }
        );
    }
}
