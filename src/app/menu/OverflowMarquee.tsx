'use client';
import { useEffect, useRef, useState } from 'react';

export default function OverflowMarquee({
                                            children,
                                            speed = 35, // px/s
                                        }: {
    children: string;
    speed?: number;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [marquee, setMarquee] = useState(false);
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(8);

    useEffect(() => {
        const measure = () => {
            const wrap = wrapRef.current;
            const text = textRef.current;
            if (!wrap || !text) return;

            // 측정 모드로 전환: 실제 길이 재기 위해
            const prevWidth = text.style.width;
            text.style.width = 'max-content';      // 내용의 실제 너비
            const full = text.scrollWidth;         // 전체 텍스트 너비
            const box = wrap.clientWidth;          // 박스 너비
            const overflow = full > box + 1;

            setMarquee(overflow);
            if (overflow) {
                const dist = full - box + 24;        // 끝 여유
                setDistance(dist);
                setDuration(Math.max(dist / speed, 4)); // px / (px/s)
            }

            // 원상복귀 (표시 모드는 클래스가 담당)
            text.style.width = prevWidth;
        };

        // 초기 + 리사이즈 + 폰트 적용 이후 타이밍 보정
        const raf = requestAnimationFrame(() => measure());
        const ro = new ResizeObserver(() => measure());
        if (wrapRef.current) ro.observe(wrapRef.current);
        if (textRef.current) ro.observe(textRef.current);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [children, speed]);

    return (
        <div
            ref={wrapRef}
            className="relative w-full overflow-hidden leading-tight min-h-[1.4em]"
            style={{ height: '1.75rem' }} // 프로젝트 폰트에 맞게 조정
            aria-label={children}
        >
            <div
                ref={textRef}
                className={[
                    "whitespace-nowrap font-bold inline-block text-base md:text-2xl",
                    marquee ? "omq-run" : "truncate",
                ].join(' ')}
                style={
                    marquee
                        ? ({
                            ['--omq-distance' as any]: `${distance}px`,
                            ['--omq-duration' as any]: `${duration}s`,
                        } as React.CSSProperties)
                        : undefined
                }
            >
                {children}
            </div>
        </div>
    );
}
