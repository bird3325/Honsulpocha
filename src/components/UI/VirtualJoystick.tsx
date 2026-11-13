import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);
  const touchIdRef = useRef<number | null>(null);

  const RADIUS = 40; // 모바일 화면 전경을 가리지 않는 컴팩트 가동 반경 (px)

  const handlePointerStart = (clientX: number, clientY: number, touchId?: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    setIsActive(true);
    if (touchId !== undefined) {
      touchIdRef.current = touchId;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, RADIUS);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setKnobPos({ x: kx, y: ky });
    // 정규화된 벡터 전달 (-1.0 ~ 1.0)
    onMove(kx / RADIUS, ky / RADIUS);
  };

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isActive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, RADIUS);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });
      onMove(kx / RADIUS, ky / RADIUS);
    },
    [isActive, onMove]
  );

  const handlePointerEnd = useCallback(() => {
    setIsActive(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  // 전역 마우스/터치 리스너 (조이스틱 영역을 벗어나 드래그해도 조작 유지)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isActive && touchIdRef.current === null) {
        handlePointerMove(e.clientX, e.clientY);
      }
    };
    const onMouseUp = () => {
      if (isActive && touchIdRef.current === null) {
        handlePointerEnd();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isActive && touchIdRef.current !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            handlePointerMove(e.touches[i].clientX, e.touches[i].clientY);
            break;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isActive && touchIdRef.current !== null) {
        let touchFound = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            touchFound = true;
            break;
          }
        }
        if (!touchFound) {
          handlePointerEnd();
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isActive, handlePointerMove, handlePointerEnd]);

  if (!isMobile) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        e.stopPropagation();
        handlePointerStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        if (e.touches.length > 0) {
          const t = e.touches[0];
          handlePointerStart(t.clientX, t.clientY, t.identifier);
        }
      }}
      className="fixed left-4 z-40 select-none touch-none flex items-center justify-center cursor-pointer pointer-events-auto"
      style={{
        bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
        width: '112px',
        height: '112px',
        borderRadius: '50%',
        background: isActive
          ? 'radial-gradient(circle, rgba(30, 41, 59, 0.65) 0%, rgba(15, 23, 42, 0.78) 100%)'
          : 'radial-gradient(circle, rgba(30, 41, 59, 0.28) 0%, rgba(15, 23, 42, 0.48) 100%)',
        backdropFilter: 'blur(6px)',
        border: '1.5px solid rgba(255, 255, 255, 0.18)',
        boxShadow: isActive
          ? '0 0 20px rgba(245, 158, 11, 0.35), inset 0 0 10px rgba(0, 0, 0, 0.4)'
          : '0 6px 18px rgba(0, 0, 0, 0.3), inset 0 0 8px rgba(0, 0, 0, 0.4)',
      }}
      title="모바일 방향 컨트롤러 (터치/드래그하여 이동)"
    >
      {/* 4방향 가이드 화살표 */}
      <span className="absolute top-1.5 text-[9px] text-white/35 font-black">▲</span>
      <span className="absolute bottom-1.5 text-[9px] text-white/35 font-black">▼</span>
      <span className="absolute left-1.5 text-[9px] text-white/35 font-black">◀</span>
      <span className="absolute right-1.5 text-[9px] text-white/35 font-black">▶</span>

      {/* 조이스틱 중심 가이드 링 */}
      <div
        className="absolute rounded-full border border-dashed border-white/20 pointer-events-none"
        style={{ width: '52px', height: '52px' }}
      />

      {/* 내부 썸스틱 노브 (움직이는 손잡이) */}
      <div
        className="rounded-full shadow-lg pointer-events-none transition-transform"
        style={{
          width: '42px',
          height: '42px',
          background: isActive
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.8) 0%, rgba(217, 119, 6, 0.8) 100%)',
          border: '2px solid #fef3c7',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.5)',
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {/* 노브 중앙 디테일 */}
        <div className="w-full h-full rounded-full flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};

