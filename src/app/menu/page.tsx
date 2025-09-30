"use client";
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";

// ========================= Types =========================
export type Category = "COFFEE" | "NON_COFFEE" | "ADE" | "TEA";

export interface MenuItem {
    id: string;
    name: string;
    category: Category;
    imageDataUrl?: string;
}

export type Temp = "HOT" | "ICE";
export type IceLevel = "적게" | "보통" | "많이";
export type CoffeeShot = "적게" | "보통" | "많이";
export type ShotToggle = "없음" | "추가";
export type Sweetness = "덜 달게" | "보통";

export interface Options {
    temp?: Temp;
    ice?: IceLevel;
    coffeeShot?: CoffeeShot;
    shotToggle?: ShotToggle;
    sweetness?: Sweetness;
}

export interface CartEntry {
    item: MenuItem;
    qty: number;
    options: Options;
}

// ========================= Demo Image (fallback) =========================
const demoImg = (label: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'>
      <rect width='160' height='120' rx='16' fill='#efe9dc'/>
      <text x='80' y='70' font-family='sans-serif' font-size='28' fill='#4b473f' text-anchor='middle'>${label}</text>
    </svg>`
    )}`;

const CATEGORIES: { key: Category; label: string }[] = [
    { key: "COFFEE", label: "커피" },
    { key: "NON_COFFEE", label: "논커피" },
    { key: "ADE", label: "에이드" },
    { key: "TEA", label: "차" },
];

// ========================= Component =========================
export default function KioskPage() {
    // ----- UI state -----
    const [active, setActive] = useState<Category>("COFFEE");
    const [cart, setCart] = useState<Record<string, CartEntry>>({});
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Options>({});

    // ----- DB 연동 상태 (이전 키오스크의 fetch 로직 반영) -----
    const [ipAddress, setIpAddress] = useState("");
    const [menusRaw, setMenusRaw] = useState<any[]>([]);
    const [bestRaw, setBestRaw] = useState<any[]>([]);

    // ----- 주문 플로우 상태 -----
    const [isNameModalVisible, setIsNameModalVisible] = useState(false);
    const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
    const [isCompleteVisible, setIsCompleteVisible] = useState(false); // ✅ 완료표시 모달
    const [customerName, setCustomerName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // IP 조회 (이전 코드와 동일한 서비스 사용)
    useEffect(() => {
        axios
            .get("https://geolocation-db.com/json/")
            .then((res) => setIpAddress(res.data?.IPv4 || ""))
            .catch(() => setIpAddress(""));
    }, []);

    // DB에서 메뉴/베스트 동시 조회
    const fetchMenus = async () => {
        try {
            const [menusRes, bestRes] = await Promise.all([
                axios.post("/api/menus", { ipAddress }),
                axios.post("/api/menus/bestMenus", { ipAddress }),
            ]);
            setMenusRaw(Array.isArray(menusRes.data) ? menusRes.data : []);
            setBestRaw(Array.isArray(bestRes.data) ? bestRes.data : []);
        } catch (err) {
            console.error("메뉴 불러오기 실패:", err);
            setMenusRaw([]);
            setBestRaw([]);
        }
    };

    useEffect(() => {
        if (!ipAddress) return;
        void fetchMenus();
    }, [ipAddress]);

    // API 스키마를 현재 컴포넌트의 MenuItem 형태로 매핑
    const ITEMS: MenuItem[] = useMemo(() => {
        const isInternal = ipAddress.startsWith("49.");

        const mapCtgr = (c: string): Category | null => {
            switch ((c || "").toLowerCase()) {
                case "coffee":
                    return "COFFEE";
                case "noncoffee":
                case "non_coffee":
                    return "NON_COFFEE";
                case "ade":
                    return "ADE";
                case "tea":
                    return "TEA";
                default:
                    return null;
            }
        };

        return menusRaw
            .filter((m) => m?.USE_YN !== "N") // 품절 제외 (원하시면 포함 후 클릭만 막도록 변경 가능)
            .map((m) => {
                const category = mapCtgr(m?.CATEGORY);
                const img = isInternal ? m?.IN_GAP_IMG_URL : m?.IMG_URL;
                const item: MenuItem = {
                    id: String(m?.ID ?? m?.id ?? m?.menuId ?? Math.random()),
                    name: String(m?.NAME ?? m?.name ?? "메뉴"),
                    category: (category || "COFFEE") as Category,
                    imageDataUrl: img || demoImg(String(m?.NAME ?? "Menu")),
                };
                return item;
            });
    }, [menusRaw, ipAddress]);

    // 카테고리 필터
    const filtered = useMemo(() => ITEMS.filter((i) => i.category === active), [ITEMS, active]);

    // ---------- Helpers ----------
    const add = (key: string) => setCart((c) => ({ ...c, [key]: { ...c[key], qty: (c[key]?.qty || 0) + 1 } }));

    const sub = (key: string) =>
        setCart((c) => {
            const entry = c[key];
            if (!entry) return c;
            const nextQty = entry.qty - 1;
            const next = { ...c } as Record<string, CartEntry>;
            if (nextQty <= 0) delete next[key];
            else next[key] = { ...entry, qty: nextQty };
            return next;
        });

    const clear = () => setCart({});

    const onMenuClick = (item: MenuItem) => {
        setSelectedItem(item);
        // 카테고리별 기본 옵션 설정 (이전 규칙 유지)
        if (item.category === "ADE") {
            setSelectedOptions({ temp: "ICE", ice: "보통", shotToggle: "없음", sweetness: "보통" });
        } else if (item.category === "NON_COFFEE") {
            setSelectedOptions({ temp: "HOT", shotToggle: "없음", sweetness: "보통" });
        } else if (item.category === "COFFEE") {
            setSelectedOptions({ temp: "HOT", coffeeShot: "보통" });
        } else if (item.category === "TEA") {
            setSelectedOptions({ temp: "HOT" });
        }
    };

    useEffect(() => {
        setSelectedOptions((o) => {
            if (!selectedItem) return o;
            if (selectedItem.category === "ADE" || o.temp === "ICE") {
                return { ...o, ice: o.ice || "보통" };
            }
            if (o.temp === "HOT") {
                const { ice, ...rest } = o;
                return rest as Options;
            }
            return o;
        });
    }, [selectedOptions.temp, selectedItem]);

    const addToOrder = () => {
        if (!selectedItem) return;
        const key = `${selectedItem.id}|${JSON.stringify(selectedOptions)}`;
        setCart((c) => {
            const prev = c[key];
            const entry: CartEntry = prev ? { ...prev, qty: prev.qty + 1 } : { item: selectedItem, qty: 1, options: selectedOptions };
            return { ...c, [key]: entry };
        });
        setSelectedItem(null);
    };

    const optionsLabel = (o: Options) => {
        const parts: string[] = [];
        if (o.temp) parts.push(o.temp === "HOT" ? "HOT" : "ICE");
        if (o.ice) parts.push(`얼음 ${o.ice}`);
        if (o.coffeeShot) parts.push(`샷 ${o.coffeeShot}`);
        if (o.shotToggle) parts.push(`샷 ${o.shotToggle}`);
        if (o.sweetness) parts.push(`당도 ${o.sweetness}`);
        return parts.length ? `(${parts.join(", ")})` : "";
    };

    // 최종 주문 제출 (DB 전송)
    const submitOrder = async () => {
        if (Object.keys(cart).length === 0) return;
        setIsSubmitting(true);
        try {
            const items = Object.values(cart).map((e) => ({
                id: e.item.id,
                name: e.item.name,
                category: e.item.category,
                qty: e.qty,
                options: e.options,
            }));

            await axios.post("/api/orders", {
                orderInfo: { customerName },
                items,
                ipAddress,
            });

            // ✅ 성공 처리: 모달 전환 + 장바구니 비우기
            setCart({});
            setCustomerName("");
            setIsAccountModalVisible(false);
            setIsCompleteVisible(true);  // 완료표시 모달 오픈

            // (선택) 몇 초 뒤 자동 닫기
            setTimeout(() => setIsCompleteVisible(false), 2500);
        } catch (err) {
            console.error("주문 전송 실패", err);
            alert("주문 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <main className="min-h-screen bg-amber-50 text-neutral-900 text-xl">
            {/* Top bar */}
            <div className="mx-auto max-w-5xl px-6 pt-6 pb-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">START ORDER</h1>
                </div>
                <div className="mt-6 flex gap-4">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => setActive(c.key)}
                            className={["rounded-xl px-6 py-3 text-xl font-bold shadow-sm", active === c.key ? "bg-white ring-2 ring-neutral-800" : "bg-neutral-100 hover:bg-neutral-200"].join(" ")}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid (3 columns) */}
            <div className="mx-auto max-w-5xl px-6 pb-56">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {filtered.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onMenuClick(item)}
                            className="group rounded-2xl bg-white p-5 shadow-md ring-1 ring-neutral-200 transition hover:shadow-lg"
                        >
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                                <Image src={item.imageDataUrl || demoImg(item.name)} alt={item.name} fill className="object-contain" />
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-2xl font-bold">{item.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom cart area */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-start gap-6 px-6 py-5">
                    <div className="min-w-0 flex-1 max-h-56 overflow-y-auto pr-2">
                        {Object.keys(cart).length === 0 ? (
                            <p className="truncate text-neutral-500 text-base">선택한 메뉴가 여기에 표시됩니다.</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {Object.entries(cart).map(([key, entry]) => (
                                    <li key={key} className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-4 py-3 text-lg">
                                        <div className="min-w-0">
                                            <div className="font-semibold truncate">{entry.item.name} × {entry.qty}</div>
                                            <div className="text-sm text-neutral-600 truncate">{optionsLabel(entry.options)}</div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button type="button" className="rounded-full bg-white px-3 py-1 ring-1 ring-neutral-300 hover:bg-neutral-50 text-base" onClick={() => sub(key)} aria-label="수량 감소">−</button>
                                            <span className="w-10 text-center text-lg tabular-nums">{entry.qty}</span>
                                            <button type="button" className="rounded-full bg-white px-3 py-1 ring-1 ring-neutral-300 hover:bg-neutral-50 text-base" onClick={() => add(key)} aria-label="수량 증가">+</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <button type="button" className="rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-neutral-300 hover:bg-neutral-100" onClick={clear}>비우기</button>
                        <button type="button" className="rounded-xl bg-neutral-900 px-5 py-3 text-white shadow hover:bg-neutral-800 disabled:opacity-40" onClick={() => setIsNameModalVisible(true)} disabled={Object.keys(cart).length === 0}>주문하기</button>
                    </div>
                </div>
            </div>

            {/* Option Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl text-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-3xl font-extrabold">{selectedItem.name}</h2>
                            <button onClick={() => setSelectedItem(null)} className="rounded-full border border-neutral-400 px-4 py-2 text-xl hover:bg-neutral-100">✕</button>
                        </div>

                        {/* Temperature / ADE ICE only */}
                        {selectedItem.category === "ADE" ? (
                            <div className="mb-8">
                                <h3 className="mb-3 font-bold">온도</h3>
                                <div className="flex gap-4 text-xl">
                                    <button disabled className="px-4 py-3 rounded-xl border bg-neutral-100 text-neutral-500 cursor-not-allowed">HOT</button>
                                    <button className="px-4 py-3 rounded-xl border bg-neutral-900 text-white">ICE</button>
                                </div>
                                <p className="mt-2 text-lg text-neutral-500">에이드는 ICE만 가능합니다.</p>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <h3 className="mb-3 font-bold">온도</h3>
                                <div className="flex gap-4 text-xl">
                                    {["HOT", "ICE"].map((t) => (
                                        <button key={t} onClick={() => setSelectedOptions((o) => ({ ...o, temp: t as Temp }))} className={["px-4 py-3 rounded-xl border", selectedOptions.temp === (t as Temp) ? "bg-neutral-900 text-white" : "bg-white"].join(" ")}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(selectedItem.category === "ADE" || selectedOptions.temp === "ICE") && (
                            <div className="mb-8">
                                <h3 className="mb-3 font-bold">얼음량</h3>
                                <div className="flex gap-4 text-xl">
                                    {["적게", "보통", "많이"].map((lv) => (
                                        <button key={lv} onClick={() => setSelectedOptions((o) => ({ ...o, ice: lv as IceLevel }))} className={["px-4 py-3 rounded-xl border", selectedOptions.ice === lv ? "bg-neutral-900 text-white" : "bg-white"].join(" ")}>{lv}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedItem.category === "COFFEE" && (
                            <div className="mb-8">
                                <h3 className="mb-3 font-bold">샷</h3>
                                <div className="flex gap-4 text-xl">
                                    {["적게", "보통", "많이"].map((s) => (
                                        <button key={s} onClick={() => setSelectedOptions((o) => ({ ...o, coffeeShot: s as CoffeeShot }))} className={["px-4 py-3 rounded-xl border", selectedOptions.coffeeShot === s ? "bg-neutral-900 text-white" : "bg-white"].join(" ")}>{s}</button>
                                    ))}
                                </div>
                                <p className="mt-2 text-lg text-neutral-500">기본값: 보통</p>
                            </div>
                        )}

                        {(selectedItem.category === "NON_COFFEE" || selectedItem.category === "ADE") && (
                            <>
                                <div className="mb-8">
                                    <h3 className="mb-3 font-bold">샷</h3>
                                    <div className="flex gap-4 text-xl">
                                        {["없음", "추가"].map((s) => (
                                            <button key={s} onClick={() => setSelectedOptions((o) => ({ ...o, shotToggle: s as ShotToggle }))} className={["px-4 py-3 rounded-xl border", selectedOptions.shotToggle === s ? "bg-neutral-900 text-white" : "bg-white"].join(" ")}>{s}</button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-lg text-neutral-500">기본값: 없음</p>
                                </div>
                                <div className="mb-8">
                                    <h3 className="mb-3 font-bold">달기 정도</h3>
                                    <div className="flex gap-4 text-xl">
                                        {["덜 달게", "보통"].map((sw) => (
                                            <button key={sw} onClick={() => setSelectedOptions((o) => ({ ...o, sweetness: sw as Sweetness }))} className={["px-4 py-3 rounded-xl border", selectedOptions.sweetness === sw ? "bg-neutral-900 text-white" : "bg-white"].join(" ")}>{sw}</button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-lg text-neutral-500">기본값: 보통</p>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-4 mt-8">
                            <button className="rounded-xl bg-neutral-200 px-6 py-3 text-xl" onClick={() => setSelectedItem(null)}>취소</button>
                            <button className="rounded-xl bg-neutral-900 px-6 py-3 text-xl text-white" onClick={addToOrder}>Add to Order</button>
                        </div>
                    </div>
                </div>
            )}

            {isNameModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">주문자 이름</h3>
                        <input
                            autoFocus
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="이름을 입력하세요"
                            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-neutral-800"
                        />
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                className="rounded-xl bg-neutral-200 px-5 py-3"
                                onClick={() => setIsNameModalVisible(false)}
                            >
                                취소
                            </button>
                            <button
                                className="rounded-xl bg-neutral-900 px-5 py-3 text-white disabled:opacity-40"
                                onClick={() => {
                                    if (!customerName.trim()) return;
                                    setIsNameModalVisible(false);
                                    setIsAccountModalVisible(true); // ✅ 다음 단계
                                }}
                                disabled={!customerName.trim()}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAccountModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-4">입금 안내</h3>
                        <div className="space-y-2 text-lg">
                            <p>카카오뱅크</p>
                            <p className="font-bold text-2xl tabular-nums">
                                0000-00-0000668 <span className="text-base">(이상하)</span>
                            </p>
                            <button
                                className="rounded-lg px-3 py-2 ring-1 ring-neutral-300 hover:bg-neutral-50 text-sm"
                                onClick={() => navigator.clipboard?.writeText("0000-00-0000668 (이상하)").catch(() => {})}
                            >
                                복사
                            </button>
                            <p>입금해주세요. 후원해주신 금액은 선교 후원에 쓰입니다.</p>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                className="rounded-xl bg-neutral-200 px-5 py-3"
                                onClick={() => setIsAccountModalVisible(false)}
                            >
                                닫기
                            </button>
                            <button
                                className="rounded-xl bg-neutral-900 px-5 py-3 text-white disabled:opacity-40"
                                onClick={submitOrder}         // ✅ DB 전송
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "전송 중..." : "확인"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCompleteVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
                    <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-2xl font-bold mb-2">주문 완료</h3>
                        <p className="text-neutral-600">주문이 접수되었습니다. 감사합니다!</p>
                        <div className="mt-6">
                            <button
                                className="rounded-xl bg-neutral-900 px-6 py-3 text-white"
                                onClick={() => setIsCompleteVisible(false)}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}
