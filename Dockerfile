# =========================
# 1단계: 빌드(Stage)
# =========================
FROM node:20-alpine AS builder

# sharp 등 네이티브 모듈의 런타임 호환을 위해 필요
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 패키지 메타만 먼저 복사 (캐시 최적화)
COPY package.json package-lock.json ./

# 프로덕션용 환경변수가 빌드에 필요한 경우만 복사 (선택 사항)
# 빌드 타임에 NEXT_PUBLIC_* 만 사용해야 하며, 서버 시크릿은 넣지 마세요.
COPY .env.production .env

# 의존성 설치 (CI 환경에 적합, lockfile 준수)
RUN npm ci

# 앱 소스 복사
COPY . .

# Next.js 빌드 (standalone 산출)
RUN npm run build

# =========================
# 2단계: 실행(Stage)
# =========================
FROM node:20-alpine AS runner

# sharp 런타임 호환
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# 런타임 환경변수 파일 (필요 시)
COPY .env.production .env

# ✅ standalone 서버와 정적 파일만 복사 → 이미지 슬림
# - standalone 안에는 필요한 node_modules만 포함됨
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# public 정적 리소스
COPY --from=builder /app/public ./public

# 헬스체크(선택): 컨테이너가 제대로 뜨는지 확인하고 싶다면 주석 해제
# HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
#   CMD wget -qO- http://127.0.0.1:${PORT}/ || exit 1

EXPOSE 3000

# ✅ standalone의 엔트리포인트(server.js) 실행
CMD ["node", "server.js"]