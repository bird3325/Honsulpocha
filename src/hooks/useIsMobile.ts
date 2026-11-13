import { useState, useEffect } from 'react';

/**
 * 모바일 디바이스 또는 모바일 터치 환경인지 감지하는 전역 훅
 * - 일반 PC/노트북(마우스, 키보드 환경): false
 * - 스마트폰, 태블릿, 또는 모바일 에뮬레이션 터치 환경: true
 */
export const useIsMobile = (): boolean => {
  const detectMobile = (): boolean => {
    if (typeof window === 'undefined') return false;

    // 1. User Agent 기반 모바일 판별
    const isMobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // 2. 터치 스크린 지원 여부
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      Boolean((navigator as any).msMaxTouchPoints);

    // 3. 포인터 타입 및 화면 크기 검사
    const isCoarsePointer =
      window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const isSmallScreen =
      window.matchMedia && window.matchMedia('(max-width: 900px)').matches;

    // 모바일 기기이거나, 터치를 지원하면서 화면이 모바일/태블릿 규격인 경우 모바일 모드로 판별
    return isMobileUA || (hasTouch && (isCoarsePointer || isSmallScreen));
  };

  const [isMobile, setIsMobile] = useState<boolean>(detectMobile);

  useEffect(() => {
    const handleCheck = () => {
      setIsMobile(detectMobile());
    };

    window.addEventListener('resize', handleCheck);
    window.addEventListener('orientationchange', handleCheck);

    return () => {
      window.removeEventListener('resize', handleCheck);
      window.removeEventListener('orientationchange', handleCheck);
    };
  }, []);

  return isMobile;
};

