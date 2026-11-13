import React from 'react';
import { Wine, Sparkles, LogOut, UtensilsCrossed, Armchair } from 'lucide-react';
import { PlayerAction, ChairSlot } from '../../types';
import { soundManager } from '../AudioController';

interface ActionOverlayProps {
  currentChair: ChairSlot | null;
  myAction: PlayerAction;
  setMyAction: React.Dispatch<React.SetStateAction<PlayerAction>>;
  onStandUp: () => void;
  broadcastAction: (action: PlayerAction) => void;
  onOpenMenu: () => void;
  servingToast?: string | null;
}

export const ActionOverlay: React.FC<ActionOverlayProps> = ({
  currentChair,
  myAction,
  setMyAction,
  onStandUp,
  broadcastAction,
  onOpenMenu,
  servingToast,
}) => {
  const isSitting = !!currentChair;

  // 건배 / 한잔하기
  const handleCheers = () => {
    soundManager.playCheersSound();
    setMyAction('cheers');
    broadcastAction('cheers');
    setTimeout(() => {
      setMyAction(isSitting ? 'sitting' : 'idle');
      broadcastAction(isSitting ? 'sitting' : 'idle');
    }, 2200);
  };

  // 소주 따르기
  const handlePour = () => {
    soundManager.playPouringSound();
    setMyAction('pouring');
    broadcastAction('pouring');
    setTimeout(() => {
      setMyAction(isSitting ? 'sitting' : 'idle');
      broadcastAction(isSitting ? 'sitting' : 'idle');
    }, 2000);
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center pointer-events-none z-20 px-3 md:px-4">
      {/* 서빙 안내 말풍선 토스트 배지 */}
      {servingToast && (
        <div className="mb-3 px-4 py-2 bg-indigo-950/90 text-amber-200 text-xs md:text-sm font-medium rounded-full shadow-2xl border border-amber-400/30 backdrop-blur-md animate-bounce">
          {servingToast}
        </div>
      )}

      {/* 액션 버튼 그룹 (모바일에서 조이스틱과 간섭 없이 우측 하단/하단 중앙에 편리하게 배치) */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pointer-events-auto mb-2.5 max-w-xl">
        {/* 의자에 앉기 버튼 (비착석 시 터치 한 번으로 착석) */}
        {!isSitting && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pocha_sit_nearest'))}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600/85 hover:bg-blue-600 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-blue-300/30 text-xs md:text-sm cursor-pointer"
            title="가장 가까운 빈 의자에 앉기"
          >
            <Armchair size={17} />
            <span>앉기</span>
          </button>
        )}

        {/* 한잔하기 버튼 */}
        <button
          onClick={handleCheers}
          disabled={myAction === 'cheers'}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/85 hover:bg-amber-500 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-amber-300/30 text-xs md:text-sm cursor-pointer"
        >
          <Wine size={17} />
          <span>한잔 짠!</span>
        </button>

        {/* 잔 채우기 버튼 */}
        <button
          onClick={handlePour}
          disabled={myAction === 'pouring'}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/85 hover:bg-emerald-600 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-emerald-300/30 text-xs md:text-sm cursor-pointer"
        >
          <Sparkles size={17} />
          <span>소주 따르기</span>
        </button>

        {/* 포차 메뉴판 버튼 */}
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600/85 hover:bg-indigo-500 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-indigo-300/30 text-xs md:text-sm cursor-pointer"
        >
          <UtensilsCrossed size={17} />
          <span>메뉴판 (주문)</span>
        </button>

        {/* 일어서기 버튼 (착석 시 표시) */}
        {isSitting && (
          <button
            onClick={onStandUp}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-700/85 hover:bg-gray-700 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-white/20 text-xs md:text-sm cursor-pointer"
          >
            <LogOut size={16} />
            <span>일어서기</span>
          </button>
        )}
      </div>

      {/* 조작 안내 힌트 캡션 */}
      <div className="bg-black/50 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-[11px] md:text-xs text-gray-300/90 select-none text-center">
        {isSitting
          ? '🍶 조용히 혼술을 음미하고 있어요. [일어서기] 버튼을 누르면 일어섭니다.'
          : '🐾 좌하단 조이스틱 / 방향키로 이동 • 빈 의자를 터치하거나 [앉기] 버튼을 누르세요.'}
      </div>
    </div>
  );
};

