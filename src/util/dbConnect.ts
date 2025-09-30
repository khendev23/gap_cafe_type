import mysql, { Pool } from "mysql2/promise";

let localPool: Pool | null = null;
let remotePool: Pool | null = null;

function createPoolFromEnv(prefix: "LOCAL" | "REMOTE"): Pool {
    const host = process.env[`DB_HOST_${prefix}`];
    const user = process.env[`DB_USER_${prefix}`];
    const password = process.env[`DB_PASSWORD_${prefix}`];
    const database = process.env[`DB_DATABASE_${prefix}`];
    const port = Number(process.env[`DB_PORT_${prefix}`] || 3306);

    if (!host || !user || !password || !database) {
        throw new Error(
            `Missing DB env for ${prefix}. Required: DB_HOST_${prefix}, DB_USER_${prefix}, DB_PASSWORD_${prefix}, DB_DATABASE_${prefix}`
        );
    }

    return mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
}

/**
 * ipAddress 기준/환경 기준으로 LOCAL or REMOTE 풀을 '선택'해서
 * 그때 '처음으로' 생성합니다. (지연 생성)
 *
 * - production: 무조건 LOCAL 사용
 * - development: ipAddress가 "49."로 시작하면 LOCAL, 아니면 REMOTE
 *   (REMOTE env 없을 경우 LOCAL로 폴백)
 */
export default function getDbPool(ipAddress?: string): Pool {
    const isProd = process.env.NODE_ENV === "production";

    // prod는 로컬만
    if (isProd || (ipAddress && ipAddress.startsWith("49."))) {
        if (!localPool) localPool = createPoolFromEnv("LOCAL");
        return localPool;
    }

    // dev + 외부 접속 → REMOTE 시도, 없으면 LOCAL로 폴백
    if (!remotePool) {
        try {
            remotePool = createPoolFromEnv("REMOTE");
        } catch (e) {
            // REMOTE env가 없으면 LOCAL로 안전 폴백
            if (!localPool) localPool = createPoolFromEnv("LOCAL");
            return localPool;
        }
    }
    return remotePool;
}