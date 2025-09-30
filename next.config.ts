// next.config.ts
import type { NextConfig } from "next";

const nextConfig = {
    images: {
        // HTTPS 도메인은 domains로 간단히 허용
        domains: ["cdn.jsdelivr.net", "gap.synology.me"],
        // HTTP, IP, 포트 등은 remotePatterns로 허용
        remotePatterns: [
            {
                protocol: "http",
                hostname: "192.168.219.177",
                // 필요하면 port: "3000" 같이 지정 가능. 없으면 "" 또는 생략.
                pathname: "**",
            },
            // (선택) HTTPS만 쓰더라도 명시하고 싶다면 아래처럼 추가 가능
            // {
            //   protocol: "https",
            //   hostname: "gap.synology.me",
            //   pathname: "**",
            // },
        ],
    },
} satisfies NextConfig;

export default nextConfig;
