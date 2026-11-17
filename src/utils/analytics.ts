// Google Analytics (GA4) 연동 유틸리티

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// 환경 변수 또는 직접 지정된 측정 ID (기본값 설정 가능)
const getEnvMeasurementId = (): string => {
  try {
    return (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || 'G-QG0V4G60CL';
  } catch {
    return 'G-QG0V4G60CL';
  }
};

const DEFAULT_MEASUREMENT_ID = getEnvMeasurementId();

/**
 * Google Analytics 4 (gtag.js) 초기화 함수
 * @param customId 사용자가 지정한 측정 ID (예: 'G-XXXXXXXXXX'). 지정하지 않으면 VITE_GA_MEASUREMENT_ID 환경변수 사용
 */
export const initGA = (customId?: string): boolean => {
  const measurementId = customId || DEFAULT_MEASUREMENT_ID;

  // index.html 등에 이미 gtag가 로드되어 있으면 그대로 사용
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    return true;
  }

  if (!measurementId || measurementId.trim() === '' || measurementId === 'G-XXXXXXXXXX') {
    console.info(
      '📊 [Google Analytics] 측정 ID(VITE_GA_MEASUREMENT_ID)가 설정되지 않았습니다. .env 파일에 G-로 시작하는 측정 ID를 설정해주세요.'
    );
    return false;
  }

  // 중복 초기화 방지
  if (document.getElementById('google-analytics-script')) {
    return true;
  }

  try {
    // 1. gtag.js 비동기 스크립트 로드
    const script = document.createElement('script');
    script.id = 'google-analytics-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // 2. dataLayer 및 gtag 함수 정의
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
    });

    console.log(`📊 [Google Analytics] GA4(${measurementId})가 성공적으로 초기화되었습니다.`);
    return true;
  } catch (error) {
    console.error('📊 [Google Analytics] 초기화 중 오류 발생:', error);
    return false;
  }
};

/**
 * 페이지뷰 추적
 */
export const trackPageView = (path?: string, title?: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
    });
  }
};

/**
 * 커스텀 이벤트 추적 (포차 입장, 메뉴 주문, 한잔 마시기 등)
 * @param action 이벤트 이름 (예: 'enter_pocha', 'order_menu', 'drink_soju')
 * @param params 이벤트 세부 매개변수
 */
export const trackEvent = (action: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, params);
  }
};
