import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);
  const touchIdRef = useRef<number | null>(null);

  const RADIUS = 48; // 조이스틱 가동 반경 (px)

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
      className="fixed left-5 bottom-6 z-40 select-none touch-none flex items-center justify-center cursor-pointer pointer-events-auto"
      style={{
        width: '136px',
        height: '136px',
        borderRadius: '50%',
        background: isActive
          ? 'radial-gradient(circle, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.88) 100%)'
          : 'radial-gradient(circle, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.65) 100%)',
        backdropFilter: 'blur(8px)',
        border: '2px solid rgba(255, 255, 255, 0.22)',
        boxShadow: isActive
          ? '0 0 25px rgba(245, 158, 11, 0.45), inset 0 0 15px rgba(0, 0, 0, 0.5)'
          : '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.5)',
      }}
      title="모바일 방향 컨트롤러 (터치/드래그하여 이동)"
    >
      {/* 4방향 가이드 화살표 */}
      <span className="absolute top-2 text-[10px] text-white/40 font-black">▲</span>
      <span className="absolute bottom-2 text-[10px] text-white/40 font-black">▼</span>
      <span className="absolute left-2 text-[10px] text-white/40 font-black">◀</span>
      <span className="absolute right-2 text-[10px] text-white/40 font-black">▶</span>

      {/* 조이스틱 중심 가이드 링 */}
      <div
        className="absolute rounded-full border border-dashed border-white/20 pointer-events-none"
        style={{ width: '64px', height: '64px' }}
      />

      {/* 내부 썸스틱 노브 (움직이는 손잡이) */}
      <div
        className="rounded-full shadow-lg pointer-events-none transition-transform"
        style={{
          width: '52px',
          height: '52px',
          background: isActive
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.85) 0%, rgba(217, 119, 6, 0.85) 100%)',
          border: '2.5px solid #fef3c7',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {/* 노브 중앙 디테일 */}
        <div className="w-full h-full rounded-full flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};

