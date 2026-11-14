import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Maximize } from 'lucide-react';

export const RotateOrientationOverlay: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia('(max-width: 900px)').matches && 'ontouchstart' in window);

      const isPortrait = window.innerHeight > window.innerWidth;

      setIsPortraitMobile(isMobile && isPortrait);

      // 사용자가 실제로 기기를 가로로 돌렸을 때는 dismiss 상태를 초기화하여
      // 나중에 다시 세로로 돌렸을 때 필요하면 안내할 수 있게 함
      if (!isPortrait) {
        setIsDismissed(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }

      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {
      // 일부 브라우저(iOS Safari 등)의 보안 정책상 lock 미지원 시에는 물리적 회전 안내
    } finally {
      // 모바일 기기에서 전체화면 시도 후 화면이 차단되지 않도록 오버레이 해제
      setIsDismissed(true);
    }
  };

  // 세로 모드가 아니거나 사용자가 닫은 경우 표시하지 않음
  if (!isPortraitMobile || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0e1117]/95 backdrop-blur-md px-6 text-center select-none text-white">
      {/* 회전 애니메이션 아이콘 */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center animate-pulse">
          <Smartphone size={38} className="text-amber-300 transform rotate-0 transition-transform duration-700" />
        </div>
        <RotateCw size={26} className="absolute -top-1 -right-1 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
      </div>

      <h2 className="text-xl font-bold text-amber-300 mb-2">
        화면을 가로로 돌려주세요
      </h2>

      <p className="text-sm text-gray-300 leading-relaxed mb-6 max-w-xs">
        혼술포차는 <span className="text-white font-medium">가로 화면(16:9)</span>에서 가장 넓고 따뜻한 감성으로 감상하실 수 있습니다.
      </p>

      {/* 가로 전환 및 전체화면 시도 버튼 */}
      <button
        onClick={handleRequestLandscape}
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all"
      >
        <Maximize size={18} />
        <span>가로 전체화면 모드 실행</span>
      </button>

      {/* 세로 화면으로도 즉시 플레이할 수 있도록 해제 옵션 제공 */}
      <button
        onClick={() => setIsDismissed(true)}
        className="mt-4 text-xs text-gray-400 underline underline-offset-4 hover:text-gray-200 active:text-white transition-colors cursor-pointer bg-transparent border-0"
      >
        세로 화면으로 계속 즐기기
      </button>
    </div>
  );
};

