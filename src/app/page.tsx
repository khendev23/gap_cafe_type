// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
      <main className="min-h-screen bg-amber-50">
        {/* 상단 로고/타이틀 영역 (필요 없으면 제거 가능) */}
        <header className="mx-auto max-w-4xl px-6 pt-10 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
            은혜카페
          </h1>
          <p className="mt-2 text-neutral-600 text-lg md:text-xl">
            무엇을 하시겠어요?
          </p>
        </header>

        {/* 메인 선택 카드 */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* 메뉴 주문 */}
            <Link
                href="/menu"
                className="group relative rounded-3xl bg-white p-8 md:p-10 shadow-xl ring-1 ring-neutral-200 hover:shadow-2xl hover:ring-neutral-300 transition"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                  <span className="text-3xl" aria-hidden>🍹</span>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900">
                    메뉴 주문
                  </h2>
                  <p className="mt-1 text-neutral-600 text-base md:text-lg">
                    키오스크 화면으로 이동합니다
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute right-6 top-6 text-neutral-400 group-hover:text-neutral-600 transition">
                <span className="text-2xl md:text-3xl" aria-hidden>➜</span>
              </div>
            </Link>

            {/* 관리자 */}
            <Link
                href="/newBo"
                className="group relative rounded-3xl bg-white p-8 md:p-10 shadow-xl ring-1 ring-neutral-200 hover:shadow-2xl hover:ring-neutral-300 transition"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                  <span className="text-3xl" aria-hidden>🧑‍🍳</span>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900">
                    관리자
                  </h2>
                  <p className="mt-1 text-neutral-600 text-base md:text-lg">
                    주문 관리/메뉴 컨트롤 화면
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute right-6 top-6 text-neutral-400 group-hover:text-neutral-600 transition">
                <span className="text-2xl md:text-3xl" aria-hidden>➜</span>
              </div>
            </Link>
          </div>
        </section>
      </main>
  );
}
