import React, { useState } from 'react';
import { Wine, LogOut, UtensilsCrossed, Armchair, Utensils, Sparkles, DoorOpen } from 'lucide-react';
import { PlayerAction, ChairSlot } from '../../types';
import { soundManager } from '../AudioController';
import { TableServing } from '../PochaTable';
import { useIsMobile } from '../../hooks/useIsMobile';

interface ActionOverlayProps {
  currentChair: ChairSlot | null;
  myAction: PlayerAction;
  setMyAction: React.Dispatch<React.SetStateAction<PlayerAction>>;
  onStandUp: () => void;
  broadcastAction: (action: PlayerAction) => void;
  onOpenMenu: () => void;
  servingToast?: string | null;
  hasOrderedMenu?: boolean;
  hasOrderedSoju?: boolean;
  onConsumeDrink?: () => { count: number; isDone: boolean };
  onConsumeFood?: () => { count: number; isDone: boolean };
  currentTableServing?: TableServing;
  isAutoMode?: boolean;
  onToggleAutoMode?: () => void;
  onExitPocha?: () => void;
  isExiting?: boolean;
}

export const ActionOverlay: React.FC<ActionOverlayProps> = ({
  currentChair,
  myAction,
  setMyAction,
  onStandUp,
  broadcastAction,
  onOpenMenu,
  servingToast,
  hasOrderedMenu = false,
  hasOrderedSoju = false,
  onConsumeDrink,
  onConsumeFood,
  currentTableServing,
  isAutoMode = false,
  onToggleAutoMode,
  onExitPocha,
  isExiting = false,
}) => {
  const isMobile = useIsMobile();
  const isSitting = !!currentChair;
  // 테이블에 아직 소비되지 않은 술 또는 음식이 남아있거나 주문 직후일 때 액션 활성화
  const hasRemainingDrink = currentTableServing?.hasDrink ?? false;
  const hasRemainingFood = currentTableServing?.hasFood ?? false;
  const isOrdered = hasOrderedMenu || hasOrderedSoju || hasRemainingDrink || hasRemainingFood;
  // 술과 안주를 모두 비웠는지 여부
  const isAllConsumed = (hasOrderedMenu || hasOrderedSoju) && !hasRemainingDrink && !hasRemainingFood;

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 1. 소주/술 한잔 홀짝 마시기 & 점진적 소비 로직
  const handleCheers = () => {
    soundManager.playCheersSound();
    setMyAction('drinking');
    broadcastAction('drinking');

    // 소비 처리
    if (onConsumeDrink) {
      const res = onConsumeDrink();
      if (res.isDone) {
        setActionFeedback('🍶 캬~ 술병을 깨끗하게 다 비웠습니다! [메뉴판]에서 술을 더 주문해보세요!');
      } else {
        setActionFeedback(`🍶 캬~ 시원하게 한잔! 달다 달아~ (남은 술: ${res.count}/8잔)`);
      }
    } else {
      setActionFeedback('🍶 캬~ 시원하게 소주 한잔 비웠습니다!');
    }

    setTimeout(() => {
      setActionFeedback(null);
    }, 3200);
    setTimeout(() => {
      setMyAction(isSitting ? 'sitting' : 'idle');
      broadcastAction(isSitting ? 'sitting' : 'idle');
    }, 2200);
  };

  // 2. 안주 한 입 맛있게 먹기 & 점진적 소비 로직
  const handleEat = () => {
    soundManager.playEatSound();
    setMyAction('eating');
    broadcastAction('eating');

    // 소비 처리
    if (onConsumeFood) {
      const res = onConsumeFood();
      if (res.isDone) {
        setActionFeedback('🥢 꿀맛 안주를 남김없이 다 먹었습니다! [메뉴판]에서 새 안주를 주문해보세요!');
      } else {
        setActionFeedback(`🥢 냠냠~ 안주를 맛있게 한 입 먹었습니다! (남은 안주: ${res.count}/8입)`);
      }
    } else {
      setActionFeedback('🥢 냠냠~ 안주를 맛있게 한 입 먹었습니다!');
    }

    setTimeout(() => {
      setActionFeedback(null);
    }, 3200);
    setTimeout(() => {
      setMyAction(isSitting ? 'sitting' : 'idle');
      broadcastAction(isSitting ? 'sitting' : 'idle');
    }, 2200);
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center pointer-events-none z-20 px-3 md:px-4">
      {/* 서빙 및 음식/한잔 인터랙션 피드백 토스트 */}
      {(servingToast || actionFeedback) && (
        <div className="mb-3 px-4 py-2 bg-indigo-950/95 text-amber-200 text-xs md:text-sm font-bold rounded-full shadow-2xl border border-amber-400/40 backdrop-blur-md animate-bounce">
          {actionFeedback || servingToast}
        </div>
      )}

      {/* 액션 버튼 그룹 */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pointer-events-auto mb-2.5 max-w-xl">
        {/* 의자에 앉기 버튼 (모바일 터치 환경에서만 노출 - PC는 의자 직접 클릭) */}
        {!isSitting && isMobile && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('pocha_sit_nearest'))}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600/85 hover:bg-blue-600 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-blue-300/30 text-xs md:text-sm cursor-pointer"
            title="가장 가까운 빈 의자에 앉기"
          >
            <Armchair size={17} />
            <span>앉기</span>
          </button>
        )}

        {/* 메뉴판에서 주문 완료 이후에만 노출되는 [한잔] 버튼 (술이 남아있을 때 클릭 가능) */}
        {isOrdered && (
          <button
            onClick={handleCheers}
            disabled={myAction === 'cheers'}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/90 hover:bg-amber-500 active:scale-95 transition-all text-white font-bold rounded-full backdrop-blur-md shadow-lg border border-amber-300/40 text-xs md:text-sm cursor-pointer animate-pulse"
            title={hasRemainingDrink ? `시원하게 한잔 마시기 (남은 잔: ${currentTableServing?.drinkCount ?? 8}/8잔)` : `술 마시기`}
          >
            <Wine size={17} />
            <span>한잔</span>
          </button>
        )}

        {/* 메뉴판에서 주문 완료 이후에만 노출되는 [먹기] 버튼 (안주가 남아있을 때 클릭 가능) */}
        {isOrdered && (
          <button
            onClick={handleEat}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 transition-all text-white font-bold rounded-full backdrop-blur-md shadow-lg border border-emerald-300/40 text-xs md:text-sm cursor-pointer animate-pulse"
            title={hasRemainingFood ? `맛있는 안주 먹기 (남은 안주: ${currentTableServing?.foodCount ?? 8}/8입)` : `안주 먹기`}
          >
            <Utensils size={17} />
            <span>먹기</span>
          </button>
        )}

        {/* 메뉴 주문 시에만 노출되는 혼술 사색 오토모드 토글 버튼 */}
        {isOrdered && (
          <button
            onClick={onToggleAutoMode}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full backdrop-blur-md shadow-lg text-xs md:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
              isAutoMode
                ? 'bg-purple-600/90 text-amber-200 border-2 border-amber-300 animate-pulse shadow-amber-500/25'
                : 'bg-purple-950/75 hover:bg-purple-900/85 text-purple-200 border border-purple-400/30'
            }`}
            title="메뉴 주문 후 혼자 조용히 사색하며 마시는 오토모드 ON/OFF"
          >
            <Sparkles size={16} className={isAutoMode ? 'text-amber-300' : ''} />
            <span>{isAutoMode ? '사색모드 ON' : '사색모드'}</span>
          </button>
        )}

        {/* 포차 메뉴판 버튼 */}
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600/85 hover:bg-indigo-500 active:scale-95 transition-all text-white font-medium rounded-full backdrop-blur-md shadow-lg border border-indigo-300/30 text-xs md:text-sm cursor-pointer"
        >
          <UtensilsCrossed size={17} />
          <span>메뉴판 (주문)</span>
        </button>

        {/* 다 먹었을 때 또는 귀가 희망 시: [포차 나가기] 버튼 (클릭 시 입구 밖으로 걸어나와 로그아웃) */}
        {(isAllConsumed || isOrdered) && (
          <button
            onClick={onExitPocha}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full backdrop-blur-md shadow-lg text-xs md:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
              isAllConsumed
                ? 'bg-rose-600/90 hover:bg-rose-600 text-white border-2 border-amber-300 animate-bounce shadow-rose-500/30'
                : 'bg-rose-950/80 hover:bg-rose-900/90 text-rose-200 border border-rose-400/30'
            }`}
            title="다 마시고 먹었으니 포차 입구 밖으로 걸어나가 귀가하기"
          >
            <DoorOpen size={17} />
            <span>{isAllConsumed ? '🚪 다 먹음! 나가기' : '🚪 나가기'}</span>
          </button>
        )}

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
        {isExiting
          ? '🌙 기분 좋게 취한 발걸음으로 포차를 나서는 중... 오늘 하루도 수고 많으셨습니다.'
          : isAutoMode
          ? '🧘 혼자만의 조용한 사색 모드 작동 중... 비소리와 음악을 들으며 마음을 정리해보세요.'
          : isAllConsumed
          ? '🍽️ 술과 안주를 모두 비웠습니다! [나가기] 버튼을 누르면 포차를 걸어나와 귀가합니다.'
          : isOrdered
          ? hasRemainingDrink || hasRemainingFood
            ? '🍶 술과 안주가 테이블에 준비되었습니다! [한잔]과 [먹기]를 눌러 맛있게 소비해보세요.'
            : '🍽️ 테이블 위의 술과 안주를 모두 비웠습니다! [메뉴판]을 열어 새 메뉴를 주문하거나 [나가기]를 누르세요.'
          : isSitting
          ? '📋 [메뉴판]을 열어 메뉴를 주문하시면 [한잔], [먹기], [사색모드]가 활성화됩니다.'
          : '🐾 좌하단 조이스틱 / 방향키로 이동 • 빈 의자를 터치하거나 [앉기] 버튼을 누르세요.'}
      </div>
    </div>
  );
};

