'use client';

import styles from './page.module.css';
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

    useEffect(() => {
        axios
            .get("https://api.ipify.org?format=json", { timeout: 4000 })
            .then((res) => setIpAddress(res.data.ip))
            .catch((err) => console.error("Error fetching client IP:", err));
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

    // 체크박스 클릭 핸들러
    const handleCheckboxChange = (orderNo: string, orderSeq: number) => {
        const key = `${orderNo}_${orderSeq}`;
        setCheckedMenus((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const isChecked = (orderNo: string, orderSeq: number) =>
        checkedMenus.includes(`${orderNo}_${orderSeq}`);

    const completeOrder = (orderNo: string) => {
        axios.post('/api/new_orders/complete_order', { ipAddress, orderNo })
            .then(() => {
                setOrders((prev) => prev.filter(o => o.ORDER_NO !== orderNo));
                setCheckedMenus((prev) => prev.filter(key => !key.startsWith(`${orderNo}_`)));
            })
            .catch(err => {
                alert("완료 처리 실패");
                console.error(err);
            });
    };

    const getMenuControl = () => {
        if (menuOpen) {
            setMenuOpen(false);
            setMenus([]);
        } else {
            axios.post('/api/menus', { ipAddress })
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
        axios.post('/api/menus/updateMenuUseYn', {
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

    // ORDER_NO 기준으로 그룹화
    const grouped = useMemo(() => {
        const g: Record<string, OrderRow[]> = {};
        orders.forEach(row => {
            (g[row.ORDER_NO] ||= []).push(row);
        });
        return g;
    }, [orders]);

    // 옵션 표시(새 스키마 기준)
    const optionText = (r: OrderRow) => {
        const p: string[] = [];
        if (r.TEMP) p.push(r.TEMP === 'ICE' ? '(ICE)' : '(HOT)');
        if (r.TEMP === 'ICE' && r.ICE_AMT) p.push(`얼음양: ${r.ICE_AMT}`);

        if (r.CATEGORY === 'COFFEE' && r.COFFEE_SHOT) {
            p.push(`샷: ${r.COFFEE_SHOT}`);
        }
        if ((r.CATEGORY === 'NON_COFFEE' || r.CATEGORY === 'ADE') && r.SHOT_TOGGLE) {
            if (r.SHOT_TOGGLE === '추가') p.push('샷 추가');
            // '없음'이면 표시 생략
        }
        if ((r.CATEGORY === 'NON_COFFEE' || r.CATEGORY === 'ADE') && r.SWEETNESS) {
            p.push(`당도: ${r.SWEETNESS}`);
        }

        return p.length ? `- ${p.join(', ')}` : '- 옵션 없음';
    };

    return (
        <div className={styles.boContainer}>
            <div className={styles.boTitle}>
                <h2>은혜카페 • 접수된 주문</h2>
            </div>

            <div className={styles.menuControlBox}>
                <button onClick={getMenuControl}>메뉴 컨트롤</button>
            </div>

            {menuOpen && (
                <div className={styles.menuList}>
                    <table className={styles.menuTable}>
                        <thead>
                        <tr>
                            <th>메뉴명</th>
                            <th>사용 여부</th>
                        </tr>
                        </thead>
                        <tbody>
                        {menus.map((menu, index) => (
                            <tr key={index}>
                                <td>{menu.NAME}</td>
                                <td>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={menu.USE_YN === 'Y'}
                                            onChange={() => toggleUseYN(menu, index)}
                                            className={styles.checkboxLarge}
                                        />
                                    </label>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.ordersBox}>
                {Object.entries(grouped).map(([orderNo, items]) => (
                    <div key={orderNo} className={styles.orderContainer}>
                        <div className={styles.ordererBox}>
                            <h3>주문자 : {items[0].ORDERER_NAME}</h3>
                            <button onClick={() => completeOrder(orderNo)}>완료</button>
                        </div>
                        <hr />
                        <ul>
                            {items.map((r) => (
                                <li key={`${orderNo}_${r.ORDER_SEQ}`}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={isChecked(orderNo, r.ORDER_SEQ)}
                                            onChange={() => handleCheckboxChange(orderNo, r.ORDER_SEQ)}
                                        />
                                        <p className={isChecked(orderNo, r.ORDER_SEQ) ? styles.checkedMenu : ''}>
                                            {r.MENU_NAME} {r.TEMP ? (r.TEMP === 'ICE' ? '(ICE)' : '(HOT)') : ''} X {r.QUANTITY}
                                            <br />
                                            <span className={styles.optValue}>{optionText(r)}</span>
                                        </p>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}