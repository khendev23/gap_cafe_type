'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type Category = 'COFFEE' | 'NON_COFFEE' | 'ADE' | 'TEA';

type OrderRow = {
    ORDER_NO: string;
    ORDERER_NAME: string;
    IS_DONE: 0 | 1;
    ORDER_DATE: string;
    ORDER_SEQ: number;

    MENU_ID: number;
    MENU_NAME: string;
    CATEGORY: Category;

    QUANTITY: number;
    TEMP: 'HOT' | 'ICE' | null;
    ICE_AMT: '적게' | '보통' | '많이' | null;
    COFFEE_SHOT: '적게' | '보통' | '많이' | null;
    SHOT_TOGGLE: '없음' | '추가' | null;
    SWEETNESS: '덜 달게' | '보통' | null;
    ITEM_DATE: string;
};

export default function BO() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [checkedMenus, setCheckedMenus] = useState<string[]>([]);
    const [ipAddress, setIpAddress] = useState('');
    const [menus, setMenus] = useState<any[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get('https://api.ipify.org?format=json', { timeout: 4000 })
            .then((res) => setIpAddress(res.data.ip))
            .catch((err) => console.error('Error fetching client IP:', err));
    }, []);

    useEffect(() => {
        if (!ipAddress) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.post('/api/new_orders/orders', { ipAddress });
                if (Array.isArray(res.data)) setOrders(res.data);
            } catch (err) {
                console.error('주문 조회 실패:', err);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [ipAddress]);

    const handleCheckboxChange = (orderNo: string, orderSeq: number) => {
        const key = `${orderNo}_${orderSeq}`;
        setCheckedMenus((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };
    const isChecked = (orderNo: string, orderSeq: number) =>
        checkedMenus.includes(`${orderNo}_${orderSeq}`);

    const completeOrder = async (orderNo: string) => {
        try {
            setSubmitting(orderNo);
            await axios.post('/api/new_orders/complete_order', { ipAddress, orderNo });
            setOrders((prev) => prev.filter((o) => o.ORDER_NO !== orderNo));
            setCheckedMenus((prev) => prev.filter((key) => !key.startsWith(`${orderNo}_`)));
        } catch (err) {
            alert('완료 처리 실패');
            console.error(err);
        } finally {
            setSubmitting(null);
        }
    };

    const getMenuControl = () => {
        if (menuOpen) {
            setMenuOpen(false);
            setMenus([]);
        } else {
            axios
                .post('/api/menus', { ipAddress })
                .then((res) => {
                    setMenus(Array.isArray(res.data) ? res.data : []);
                    setMenuOpen(true);
                })
                .catch((err) => {
                    console.error('메뉴 조회 실패:', err);
                    setMenus([]);
                });
        }
    };

    const toggleUseYN = (menu: any, index: number) => {
        const newStatus = menu.USE_YN === 'Y' ? 'N' : 'Y';
        axios
            .post('/api/menus/updateMenuUseYn', {
                menuId: menu.ID,
                useYN: newStatus,
                ipAddress,
            })
            .then(() => {
                setMenus((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...menu, USE_YN: newStatus };
                    return updated;
                });
            })
            .catch((err) => {
                console.error('메뉴 상태 변경 실패:', err);
                alert('사용 여부 변경 오류');
            });
    };

    const grouped = useMemo(() => {
        const g: Record<string, OrderRow[]> = {};
        orders.forEach((row) => {
            (g[row.ORDER_NO] ||= []).push(row);
        });
        console.log(g);
        return g;
    }, [orders]);

    const optionText = (r: OrderRow) => {
        const p: string[] = [];
        // if (r.TEMP) p.push(r.TEMP === 'ICE' ? 'ICE' : 'HOT');
        if (r.TEMP === 'ICE' && r.ICE_AMT !== '보통') p.push(`얼음 ${r.ICE_AMT}`);
        if (r.CATEGORY === 'COFFEE' && r.COFFEE_SHOT !== '보통') p.push(`샷 ${r.COFFEE_SHOT}`);
        if ((r.CATEGORY === 'NON_COFFEE' || r.CATEGORY === 'ADE') && r.SHOT_TOGGLE === '추가') p.push('샷 추가');
        if ((r.CATEGORY === 'NON_COFFEE' || r.CATEGORY === 'ADE') && r.SWEETNESS !== '보통') p.push(`당도 ${r.SWEETNESS}`);
        return p.length ? p.join(' · ') : '';
    };

    const formatHm = (val?: string) => {
        if (!val) return '';

        // 공백 구분을 ISO 형태로 변환
        const base = val.includes('T') ? val : val.replace(' ', 'T');

        // 타임존 오프셋/UTC 표기가 없으면 KST로 간주(+09:00)
        const hasTZ = /([zZ])|([+\-]\d{2}:?\d{2})$/.test(base);
        const isoKst = hasTZ ? base : `${base}+09:00`;

        // Asia/Seoul로 포맷 (어떤 기기 타임존이든 KST로 고정 표기)
        const d = new Date(isoKst);
        return new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Seoul',
        }).format(d);
    };

    return (
        <div className="min-h-dvh flex flex-col bg-[#faf7f2] dark:bg-[#faf7f2]">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eae6de] bg-white px-5 py-3.5 dark:border-[#eae6de] dark:bg-white">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-[22px] font-extrabold text-black dark:text-black">은혜카페 • 주문관리</h1>
                    <span className="rounded-full border border-[#e6e1d6] bg-[#f3f0ea] px-2 py-0.5 text-[13px] text-black dark:text-black dark:border-[#e6e1d6] dark:bg-[#f3f0ea]">
            대기 {Object.keys(grouped).length}건
          </span>
                </div>
                <div>
                    <button
                        onClick={getMenuControl}
                        className="rounded-xl bg-neutral-900 px-4 py-2 text-white font-bold hover:bg-neutral-800 dark:bg-neutral-900 dark:text-white"
                    >
                        메뉴 컨트롤
                    </button>
                </div>
            </header>

            {/* Menu Control Panel */}
            {menuOpen && (
                <section className="border-b border-[#eae6de] bg-white text-black dark:border-[#eae6de] dark:bg-white dark:text-black">
                    <div className="px-5 py-3.5">
                        <h2 className="mb-2 text-lg font-extrabold">메뉴 사용여부</h2>

                        {/* ✅ 모바일: 카드형 리스트 (스크롤 없음) */}
                        <div className="md:hidden">
                            <ul className="divide-y divide-[#eee7da] dark:divide-[#eee7da]">
                                {menus.map((menu, index) => (
                                    <li key={menu.ID ?? index} className="flex items-center justify-between py-3">
                                        <span className="pr-3 text-[15px] leading-snug truncate">{menu.NAME}</span>
                                        {/* Toggle */}
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={menu.USE_YN === 'Y'}
                                                onChange={() => toggleUseYN(menu, index)}
                                            />
                                            <div className="h-6 w-11 rounded-full bg-[#ddd6c8] transition-colors peer-checked:bg-neutral-900 dark:bg-[#ddd6c8] dark:peer-checked:bg-neutral-900" />
                                            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 dark:bg-white" />
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ✅ 데스크탑: 기존 테이블 유지 */}
                        <div className="hidden md:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-[560px] w-full border-collapse text-[14px]">
                                    <thead>
                                    <tr className="text-left">
                                        <th className="border-b border-[#eee7da] px-3 py-2 dark:border-[#eee7da]">메뉴명</th>
                                        <th className="border-b border-[#eee7da] px-3 py-2 dark:border-[#eee7da]">사용</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {menus.map((menu, index) => (
                                        <tr key={menu.ID ?? index}>
                                            <td className="border-b border-[#eee7da] px-3 py-2 dark:border-[#eee7da]">{menu.NAME}</td>
                                            <td className="border-b border-[#eee7da] px-3 py-2 dark:border-[#eee7da]">
                                                {/* Toggle */}
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={menu.USE_YN === 'Y'}
                                                        onChange={() => toggleUseYN(menu, index)}
                                                    />
                                                    <div className="h-6 w-11 rounded-full bg-[#ddd6c8] transition-colors peer-checked:bg-neutral-900 dark:bg-[#ddd6c8] dark:peer-checked:bg-neutral-900" />
                                                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 dark:bg-white" />
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Orders Grid */}
            <main className="grid flex-1 grid-cols-3 gap-4 px-5 pb-6 pt-4
                        max-[1200px]:grid-cols-2
                        max-[820px]:grid-cols-1">
                {Object.entries(grouped).map(([orderNo, items]) => {
                    const first = items[0];
                    const totalCount = items.reduce((sum, r) => sum + (r.QUANTITY || 0), 0);
                    return (
                        <article
                            key={orderNo}
                            className="flex flex-col overflow-hidden rounded-2xl border border-[#e6e1d6] bg-white shadow-sm dark:border-[#e6e1d6] dark:bg-white"
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-dashed border-[#efe9dc] px-4 pb-2 pt-3.5 dark:border-[#efe9dc]">
                                <div className="flex flex-col gap-1">
                                    <div className="text-[18px] font-extrabold text-black dark:text-black">{first.ORDERER_NAME}</div>
                                    <div className="flex items-center gap-2 text-[13px] text-[#6b665d] dark:text-[#6b665d]">
                                        <span className="font-bold">#{orderNo}</span>
                                        <span className="inline-block h-1 w-1 rounded-full bg-[#c8c2b6] dark:bg-[#c8c2b6]" />
                                        <span className="tracking-tight">{formatHm(first.ORDER_DATE)}</span>
                                    </div>
                                </div>
                                <div>
                                  <span className="rounded-full border border-[#ffe3a1] bg-[#fff6e3] px-2 py-1 text-xs font-bold text-black dark:text-black dark:border-[#ffe3a1] dark:bg-[#fff6e3]">
                                    총 {totalCount}잔
                                  </span>
                                </div>
                            </div>

                            {/* Items */}
                            <ul className="flex flex-col gap-2.5 px-3.5 py-2.5">
                                {items.map((r) => {
                                    const key = `${orderNo}_${r.ORDER_SEQ}`;
                                    const checked = isChecked(orderNo, r.ORDER_SEQ);
                                    return (
                                        <li key={key}>
                                            <label className="flex items-start gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => handleCheckboxChange(orderNo, r.ORDER_SEQ)}
                                                    className="mt-1.5 h-4 w-4"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div
                                                        className={[
                                                            'flex items-center gap-1.5 font-bold leading-snug',
                                                            checked ? 'line-through opacity-55' : '',
                                                        ].join(' ')}
                                                    >
                                                        <span className="max-w-[65%] truncate text-black dark:text-black">{r.MENU_NAME}</span>
                                                        {r.TEMP === 'ICE' && (
                                                            <span className="rounded-full border border-[#b5d8ff] bg-[#eef6ff] px-1.5 text-[11px] font-bold text-[#184b8c] dark:border-[#b5d8ff] dark:bg-[#eef6ff] dark:text-[#184b8c]">
                                                                {r.TEMP}
                                                            </span>
                                                        )}
                                                        {r.TEMP === 'HOT' && (
                                                            <span className="rounded-full border border-[pink] bg-[#eef6ff] px-1.5 text-[11px] font-bold text-[red] dark:border-[pink] dark:bg-[#eef6ff] dark:text-[red]">
                                                                {r.TEMP}
                                                            </span>
                                                        )}
                                                        <span className="opacity-60 text-black dark:text-black">×</span>
                                                        <span className="w-6 text-center text-black dark:text-black">{r.QUANTITY}</span>
                                                    </div>
                                                    <div className="mt-0.5 text-[13px] leading-tight text-[#6b665d] dark:text-[#6b665d]">
                                                        {optionText(r)}
                                                    </div>
                                                </div>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Footer */}
                            <div className="mt-auto border-t border-dashed border-[#efe9dc] px-4 py-3 text-right dark:border-[#efe9dc]">
                                <button
                                    onClick={() => completeOrder(orderNo)}
                                    disabled={submitting === orderNo}
                                    className="rounded-xl bg-neutral-900 px-4 py-2 font-extrabold text-white enabled:hover:bg-neutral-800 disabled:opacity-50 dark:text-white dark:enabled:hover:bg-neutral-800"
                                >
                                    {submitting === orderNo ? '처리 중…' : '주문 완료'}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </main>
        </div>
    );
}
