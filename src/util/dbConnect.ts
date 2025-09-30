// util/dbConnect.ts
import type { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";

// Next.js는 기본적으로 env를 로드합니다. (dotenv 불필요)
// .env 로컬에서 직접 로드가 꼭 필요하면 주석 해제하세요.
// import dotenv from "dotenv";
// dotenv.config();

type RequiredEnv =
| "DB_HOST_LOCAL"
| "DB_USER_LOCAL"
| "DB_PASSWORD_LOCAL"
| "DB_DATABASE_LOCAL"
| "DB_HOST_REMOTE"
| "DB_USER_REMOTE"
| "DB_PASSWORD_REMOTE"
| "DB_DATABASE_REMOTE";

function env(name: RequiredEnv): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing environment variable: ${name}`);
    return v;
}

// dev/HMR 환경에서 풀 중복 생성을 막기 위해 global 캐시 사용
// (Next.js 개발 서버는 모듈을 여러 번 로드할 수 있음)
declare global {
    // eslint-disable-next-line no-var
    var __DB_POOLS__: {
        local?: Pool;
        remote?: Pool;
    } | undefined;
}

const pools =
    global.__DB_POOLS__ ??
    (() => {
        const local = mysql.createPool({
            host: env("DB_HOST_LOCAL"),
            user: env("DB_USER_LOCAL"),
            password: env("DB_PASSWORD_LOCAL"),
            database: env("DB_DATABASE_LOCAL"),
            port: 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        const remote = mysql.createPool({
            host: env("DB_HOST_REMOTE"),
            user: env("DB_USER_REMOTE"),
            password: env("DB_PASSWORD_REMOTE"),
            database: env("DB_DATABASE_REMOTE"),
            port: 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        return { local, remote };
    })();

// 개발 환경에서만 global에 저장(프로덕션은 단일 인스턴스라 필요 없음)
if (process.env.NODE_ENV !== "production") {
    global.__DB_POOLS__ = pools;
}

/**
 * 클라이언트 IP 기준으로 사용할 풀 선택
 * - 프로덕션: 무조건 localPool
 * - 개발: '49.'로 시작하면 localPool, 아니면 remotePool
 */
export default function getDbPool(ipAddress: string): Pool {
    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
        return pools.local!;
    }

    if (ipAddress.startsWith("49.")) {
        return pools.local!;
    }
    return pools.remote!;
}
