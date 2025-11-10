# [은혜카페 키오스크]

## 개요
- 사용자가 메뉴를 선택해 **주문**을 생성하고, 관리자 화면에서 **주문 상태를 Polling**으로 확인하는 키오스크입니다.
- 교회 내부 사용으로 결제 기능은 포함하지 않습니다.
- 개인 개발로 시작해 현재 실제 운영(교회 내부 키오스크) 중입니다.

## 기술 스택
| 구분        | 사용 기술                                    | 비고                     |
|-----------|------------------------------------------|------------------------|
| Fullstack | Next.js 15 (App Router, Route Handlers)  | 별도 서버 없음               |
| Language  | TypeScript                               |                        |
| Database  | MariaDB 10.x                             | `mysql2/promise` 직접 연결 |
| Styling   | TailwindCSS                              | 반응형 UI                 |
| Infra     | Synology NAS + Container Manager(Docker) | 운영 환경                  |
| Realtime  | API Polling                              | 2초 주기 기본값              |

## 시스템 구조
Next.js 단일 코드베이스에서 UI와 API(Route Handlers)를 함께 운영합니다. DB는 Synology NAS MariaDB에 직접 연결합니다.

[Next.js (App Router)]

├─ /app (UI)

└─ /app/api/* (Route Handlers; REST)

↕ (mysql2/promise)

[MariaDB 10.x]

- 실시간은 WebSocket 대신 **API Polling**을 사용합니다(단순·안정).

## 주요 기능
- 카테고리별 메뉴 조회
- 주문 상품 옵션 선택
- 장바구니 담기/수정/삭제
- 주문 생성(결제 제외)
- 주문 상태 조회(폴링)
- 관리자 화면(주문 리스트 / 상태 확인 / 메뉴 제어)


## 실행 방법
### 1) 환경 변수
`.env.development`

NODE_ENV=development

DB_HOST_LOCAL=

DB_USER_LOCAL=

DB_PASSWORD_LOCAL=

DB_DATABASE_LOCAL=

DB_HOST_REMOTE=

DB_USER_REMOTE=

DB_PASSWORD_REMOTE=

DB_DATABASE_REMOTE=

### 2) 설치

```bash
npm install
```

### 3) 개발 서버
```bash
npm run dev
```

## API 개요
| Method   | Endpoint             | 설명           |
|----------|----------------------|--------------|
| GET      | /api/menus           | 메뉴 목록 조회     |
| GET      | /api/menus/bestMenus | 베스트 메뉴 목록 조회 |
| POST     | /api/orders          | 주문 생성        |
| POST     | /api/new_orders/orders          | 주문 내역 조회     |
| POST     | /api/new_orders/complete_order          | 주문 완료 처리     |
| POST     | /api/menus/updateMenuUseYn          | 메뉴 제어        |

## Polling 전략
- 기본 주기: 2000ms
- 선택 이유: 운영 환경(NAS)에서 구현 단순성, 안정성 우선
  - 웹소켓 선택시 별도 웹소켓 서버 필요
  - 현재 사용 트래픽 기준 웹소켓 보다 polling이 비용 절감 효과 있음

## 향후 개선
- 주문 통계 / 대시보드
- 메뉴 간편 등록
- 고객 이벤트 추가(n번째 주문시 무료 음료 등)

## 정보(Author)
- Developer: 유성근
- Email: khendev23@gmail.com
- Github: https://github.com/khendev23
- 운영 상태 : 실제 환경에서 사용 중