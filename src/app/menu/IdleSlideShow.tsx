'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
    ipAddress: string;
    onActive?: () => void;
    onIdle?: () => void;
    visible: boolean;
};

export default function IdleSlideshow({ ipAddress, onActive, onIdle, visible }: Props) {
    const [isIdle, setIsIdle] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const isInternal = ipAddress.startsWith('49.');
    const baseURL = isInternal ? 'http://192.168.219.177' : 'https://cdn.jsdelivr.net/gh/khendev23/gapCdn-assets@main';

    const slideImages = [
        `${baseURL}/kelly/IMG_9459.jpeg`,
        `${baseURL}/kelly/IMG_9460.jpeg`,
        `${baseURL}/kelly/IMG_9461.jpeg`,
        `${baseURL}/kelly/kelly240603.jpg`,
        `${baseURL}/kelly/kelly240701.jpg`,
    ];

    const enterIdleMode = () => {
        setIsIdle(true);
        onIdle?.();
    };

    const exitIdleMode = () => {
        setIsIdle(false);
        onActive?.();
        resetIdleTimer();
    };

    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => enterIdleMode(), 30_000); // 30s
    };

    useEffect(() => {
        const handleActivity = () => {
            if (isIdle) exitIdleMode();
            else resetIdleTimer();
        };
        document.addEventListener('mousemove', handleActivity);
        document.addEventListener('click', handleActivity);
        document.addEventListener('touchstart', handleActivity);

        resetIdleTimer();
        return () => {
            document.removeEventListener('mousemove', handleActivity);
            document.removeEventListener('click', handleActivity);
            document.removeEventListener('touchstart', handleActivity);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
        };
    }, [isIdle]);

    useEffect(() => {
        if (isIdle) {
            slideshowTimerRef.current = setInterval(() => {
                setCurrentSlideIndex((prev) => (prev + 1) % slideImages.length);
            }, 8000);
        } else {
            if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
            setCurrentSlideIndex(0);
        }
    }, [isIdle]);

    useEffect(() => {
        const overlayEl = overlayRef.current;
        if (!isIdle || !overlayEl) return;

        const handleTouch = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            // @ts-ignore
            e.stopImmediatePropagation?.();
            exitIdleMode();
        };

        overlayEl.addEventListener('touchstart', handleTouch, { passive: false, capture: true });
        overlayEl.addEventListener('mousedown', handleTouch as any, { passive: false, capture: true });

        return () => {
            overlayEl.removeEventListener('touchstart', handleTouch as any, { capture: true });
            overlayEl.removeEventListener('mousedown', handleTouch as any, { capture: true });
        };
    }, [isIdle]);

    if (!visible) return null;

    return (
        <div
            ref={overlayRef}
            onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onActive?.();
            }}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#000',
                zIndex: 10_000,
                cursor: 'pointer',
                overflow: 'hidden',
                touchAction: 'none',
            }}
        >
            {slideImages.map((src, idx) => (
                <img
                    key={idx}
                    src={src}
                    alt={`slide-${idx}`}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: currentSlideIndex === idx ? 1 : 0,
                        transition: 'opacity 1.2s ease-in-out',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    width: '100%',
                    textAlign: 'center',
                    color: '#fff',
                    fontSize: '1.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px',
                    zIndex: 10_001,
                }}
            >
                화면을 터치하면 돌아갑니다
            </div>
        </div>
    );
}
