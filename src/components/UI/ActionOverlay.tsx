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
  onConsumeDrink?: () => { count: number; isDone: boolean; drinkId?: string };
  onConsumeFood?: () => { count: number; isDone: boolean; foodId?: string };
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
  // 테이블에 아직 소비되지 않은 술 또는 음식이 남아있거나 주문 직후일 때 액션 활성화 (복수 메뉴 지원)
  const hasRemainingDrink =
    currentTableServing?.drinks && currentTableServing.drinks.length > 0
      ? currentTableServing.drinks.some((d) => d.drinkCount > 0)
      : (currentTableServing?.hasDrink ?? false);
  const hasRemainingFood =
    currentTableServing?.foods && currentTableServing.foods.length > 0
      ? currentTableServing.foods.some((f) => f.foodCount > 0)
      : (currentTableServing?.hasFood ?? false);
  const isOrdered = hasOrderedMenu || hasOrderedSoju || hasRemainingDrink || hasRemainingFood;
  // 술과 안주를 모두 비웠는지 여부
  const isAllConsumed = (hasOrderedMenu || hasOrderedSoju) && !hasRemainingDrink && !hasRemainingFood;

  // 현재 테이블 위 첫 번째 활성 음료/주류 판별 (음료는 3모금, 주류는 8잔)
  const activeDrinkItem = currentTableServing?.drinks?.find((d) => d.drinkCount > 0);
  const activeDrinkId = activeDrinkItem ? activeDrinkItem.drinkId : currentTableServing?.drinkId;
  const isBeverage = activeDrinkId?.startsWith('bev_') ?? false;
  const maxDrinkCount = isBeverage ? 3 : 8;
  const drinkUnit = isBeverage ? '모금' : '잔';
  const drinkActionName = isBeverage ? '한모금' : '한잔';
  const activeDrinkCount = activeDrinkItem ? activeDrinkItem.drinkCount : (currentTableServing?.drinkCount ?? maxDrinkCount);

  // 현재 테이블 위 첫 번째 활성 안주 판별
  const activeFoodItem = currentTableServing?.foods?.find((f) => f.foodCount > 0);
  const activeFoodCount = activeFoodItem ? activeFoodItem.foodCount : (currentTableServing?.foodCount ?? 8);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 1. 음료/주류 따르고 홀짝 마시기 & 점진적 소비 로직
  const handleCheers = () => {
    // 1단계: 병/캔을 기울여 잔에 채우는 모션
    soundManager.playPouringSound();
    setMyAction('pouring');
    broadcastAction('pouring');
    setActionFeedback(isBeverage ? '🥤 콸콸... 얼음잔에 시원한 음료를 따릅니다.' : '🍶 쪼르르... 잔에 술을 정성스레 채웁니다.');

    // 2단계: 잔을 들어 시원하게 털어 넣기
    setTimeout(() => {
      soundManager.playCheersSound();
      setMyAction('drinking');
      broadcastAction('drinking');

      if (onConsumeDrink) {
        const res = onConsumeDrink();
        const isCurrentBev = (res.drinkId || activeDrinkId)?.startsWith('bev_') ?? false;
        const currentUnit = isCurrentBev ? '모금' : '잔';
        const currentMax = isCurrentBev ? 3 : 8;

        if (res.isDone) {
          setActionFeedback(
            isCurrentBev
              ? '🥤 캬~ 시원한 음료를 다 비웠습니다! [메뉴판]에서 더 주문해보세요!'
              : '🍶 캬~ 술병을 깨끗하게 다 비웠습니다! [메뉴판]에서 술을 더 주문해보세요!'
          );
        } else {
          setActionFeedback(
            isCurrentBev
              ? `🥤 캬~ 시원하고 톡 쏘는 한 모금! (남은 음료: ${res.count}/${currentMax}${currentUnit})`
              : `🍶 캬~ 시원하게 한잔! 달다 달아~ (남은 술: ${res.count}/${currentMax}${currentUnit})`
          );
        }
      } else {
        setActionFeedback(isBeverage ? '🥤 캬~ 시원하게 음료 한 모금 비웠습니다!' : '🍶 캬~ 시원하게 소주 한잔 비웠습니다!');
      }

      setTimeout(() => {
        setActionFeedback(null);
        setMyAction(isSitting ? 'sitting' : 'idle');
        broadcastAction(isSitting ? 'sitting' : 'idle');
      }, 2600);
    }, 1800);
  };

  // 2. 안주 한 입 맛있게 먹기 & 점진적 소비 로직 (젓가락이 안주에 갔다가 입으로 가는 모션)
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
    }, 2800);
  };

  return (
    <>
      {/* 서빙 및 음식/한잔 인터랙션 피드백 토스트 (화면 상단/중앙 은은한 알림) */}
      {(servingToast || actionFeedback) && (
        <div className="fixed top-20 left-0 right-0 flex justify-center pointer-events-none z-30 px-4">
          <div className="px-4 py-2 bg-indigo-950/90 text-amber-200 text-xs md:text-sm font-bold rounded-full shadow-2xl border border-amber-400/40 backdrop-blur-md animate-bounce">
            {actionFeedback || servingToast}
          </div>
        </div>
      )}

      {/* 1. 사색 모드 작동 중일 때: 화면 우측 상단/사이드로 빼서 전경을 100% 개방 */}
      {isAutoMode ? (
        <div className="fixed right-4 bottom-6 md:bottom-8 pointer-events-auto z-30 animate-fade-in">
          <button
            onClick={onToggleAutoMode}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-950/85 hover:bg-purple-900/95 text-amber-200 border border-amber-300/40 rounded-full backdrop-blur-md shadow-2xl text-xs md:text-sm font-bold cursor-pointer active:scale-95 transition-all"
            title="사색 모드 종료하고 일반 조작으로 돌아가기"
          >
            <Sparkles size={14} className="text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>🧘 사색 모드</span>
            <span className="text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full ml-0.5">해제</span>
          </button>
        </div>
      ) : (
        /* 2. 일반 모드: 
              - 모바일: 우측 사이드 세로 플로팅 도크 (fixed right-3 bottom-6 flex flex-col items-end) 로 배치하여 중앙 하단 전경 100% 시원하게 확보!
              - PC 데스크톱: 화면 중앙 하단(fixed bottom-6 left-0 right-0 flex justify-center items-center)에 가로 바(flex-row)로 우아하게 정렬
        */
        isMobile ? (
          <div
            className="fixed right-3 pointer-events-none z-30"
            style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))' }}
          >
            <div className="flex flex-col items-end gap-2 pointer-events-auto p-1.5 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
              {/* 의자에 앉기 버튼 (비착석 & 모바일 터치 환경에서만 노출) */}
              {!isSitting && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('pocha_sit_nearest'))}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/90 hover:bg-blue-600 active:scale-95 transition-all text-white font-medium rounded-xl text-xs cursor-pointer shadow-lg w-full justify-center"
                  title="가장 가까운 빈 의자에 앉기"
                >
                  <Armchair size={15} />
                  <span>앉기</span>
                </button>
              )}

              {/* 메뉴판에서 주문 완료 이후에만 노출되는 [한잔/한모금] 버튼 (음료는 3모금, 술은 8잔) */}
              {isOrdered && (
                <button
                  onClick={handleCheers}
                  disabled={myAction === 'cheers' || myAction === 'pouring'}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/90 hover:bg-amber-500 active:scale-95 transition-all text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg animate-pulse w-full justify-center"
                  title={hasRemainingDrink ? `시원하게 ${drinkActionName} 마시기 (남은 ${isBeverage ? '음료' : '잔'}: ${activeDrinkCount}/${maxDrinkCount}${drinkUnit})` : `${isBeverage ? '음료' : '술'} 마시기`}
                >
                  <Wine size={15} />
                  <span>{drinkActionName}</span>
                </button>
              )}

              {/* 메뉴판에서 주문 완료 이후에만 노출되는 [먹기] 버튼 (안주가 남아있을 때 클릭 가능) */}
              {isOrdered && (
                <button
                  onClick={handleEat}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 transition-all text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg animate-pulse w-full justify-center"
                  title={hasRemainingFood ? `맛있는 안주 먹기 (남은 안주: ${activeFoodCount}/8입)` : `안주 먹기`}
                >
                  <Utensils size={15} />
                  <span>먹기</span>
                </button>
              )}

              {/* 메뉴 주문 시에만 노출되는 혼술 사색 오토모드 토글 버튼 */}
              {isOrdered && (
                <button
                  onClick={onToggleAutoMode}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/85 hover:bg-purple-900/90 text-purple-200 border border-purple-400/30 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-lg w-full justify-center"
                  title="메뉴 주문 후 혼자 조용히 사색하며 마시는 오토모드 ON/OFF"
                >
                  <Sparkles size={15} className="text-amber-300" />
                  <span>사색</span>
                </button>
              )}

              {/* 포차 메뉴판 버튼 (의자에 앉은 후에만 노출) */}
              {isSitting && (
                <button
                  onClick={onOpenMenu}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 transition-all text-white font-medium rounded-xl text-xs cursor-pointer shadow-lg w-full justify-center"
                >
                  <UtensilsCrossed size={15} />
                  <span>메뉴판</span>
                </button>
              )}

              {/* 일어서기 버튼 (착석 시 표시) */}
              {isSitting && (
                <button
                  onClick={onStandUp}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-700/85 hover:bg-gray-600 active:scale-95 transition-all text-white font-medium rounded-xl text-xs cursor-pointer shadow-lg w-full justify-center"
                >
                  <LogOut size={15} />
                  <span>일어서기</span>
                </button>
              )}

              {/* 다 먹었을 때 또는 귀가 희망 시: [포차 나가기] 버튼 */}
              {(isAllConsumed || isOrdered) && (
                <button
                  onClick={onExitPocha}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-lg w-full justify-center ${
                    isAllConsumed
                      ? 'bg-rose-600/95 hover:bg-rose-600 text-white animate-bounce shadow-rose-500/30'
                      : 'bg-rose-950/85 hover:bg-rose-900/90 text-rose-200 border border-rose-400/30'
                  }`}
                  title="다 마시고 먹었으니 포차 입구 밖으로 걸어나가 귀가하기"
                >
                  <DoorOpen size={15} />
                  <span>나가기</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none z-30">
            <div className="flex flex-row items-center gap-2 pointer-events-auto px-3 py-1.5 bg-black/45 backdrop-blur-xl rounded-full border border-white/15 shadow-2xl">
              {/* 메뉴판에서 주문 완료 이후에만 노출되는 [한잔/한모금] 버튼 (음료는 3모금, 술은 8잔) */}
              {isOrdered && (
                <button
                  onClick={handleCheers}
                  disabled={myAction === 'cheers' || myAction === 'pouring'}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/90 hover:bg-amber-500 active:scale-95 transition-all text-white font-bold rounded-full text-sm cursor-pointer shadow-lg animate-pulse"
                  title={hasRemainingDrink ? `시원하게 ${drinkActionName} 마시기 (남은 ${isBeverage ? '음료' : '잔'}: ${activeDrinkCount}/${maxDrinkCount}${drinkUnit})` : `${isBeverage ? '음료' : '술'} 마시기`}
                >
                  <Wine size={15} />
                  <span>{drinkActionName}</span>
                </button>
              )}

              {/* 메뉴판에서 주문 완료 이후에만 노출되는 [먹기] 버튼 (안주가 남아있을 때 클릭 가능) */}
              {isOrdered && (
                <button
                  onClick={handleEat}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 transition-all text-white font-bold rounded-full text-sm cursor-pointer shadow-lg animate-pulse"
                  title={hasRemainingFood ? `맛있는 안주 먹기 (남은 안주: ${activeFoodCount}/8입)` : `안주 먹기`}
                >
                  <Utensils size={15} />
                  <span>먹기</span>
                </button>
              )}

              {/* 메뉴 주문 시에만 노출되는 혼술 사색 오토모드 토글 버튼 */}
              {isOrdered && (
                <button
                  onClick={onToggleAutoMode}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-950/85 hover:bg-purple-900/90 text-purple-200 border border-purple-400/30 rounded-full text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-lg"
                  title="메뉴 주문 후 혼자 조용히 사색하며 마시는 오토모드 ON/OFF"
                >
                  <Sparkles size={15} className="text-amber-300" />
                  <span>사색</span>
                </button>
              )}

              {/* 포차 메뉴판 버튼 (의자에 앉은 후에만 노출) */}
              {isSitting && (
                <button
                  onClick={onOpenMenu}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 transition-all text-white font-medium rounded-full text-sm cursor-pointer shadow-lg"
                >
                  <UtensilsCrossed size={15} />
                  <span>메뉴판</span>
                </button>
              )}

              {/* 일어서기 버튼 (착석 시 표시) */}
              {isSitting && (
                <button
                  onClick={onStandUp}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-700/85 hover:bg-gray-600 active:scale-95 transition-all text-white font-medium rounded-full text-sm cursor-pointer shadow-lg"
                >
                  <LogOut size={15} />
                  <span>일어서기</span>
                </button>
              )}

              {/* 다 먹었을 때 또는 귀가 희망 시: [포차 나가기] 버튼 */}
              {(isAllConsumed || isOrdered) && (
                <button
                  onClick={onExitPocha}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-lg ${
                    isAllConsumed
                      ? 'bg-rose-600/95 hover:bg-rose-600 text-white animate-bounce shadow-rose-500/30'
                      : 'bg-rose-950/85 hover:bg-rose-900/90 text-rose-200 border border-rose-400/30'
                  }`}
                  title="다 마시고 먹었으니 포차 입구 밖으로 걸어나가 귀가하기"
                >
                  <DoorOpen size={15} />
                  <span>나가기</span>
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* 조작 안내 힌트 캡션 (PC 큰 화면에서만 하단에 은은하게 노출) */}
      <div className="hidden md:flex fixed bottom-2 left-0 right-0 justify-center pointer-events-none z-20">
        <div className="bg-black/45 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 text-[11px] text-gray-300/90 select-none text-center">
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
            ? '📋 [메뉴판]을 열어 메뉴를 주문하시면 [한잔], [먹기], [사색]이 활성화됩니다.'
            : '🐾 방향키 / 마우스로 빈 의자를 클릭하여 착석해보세요.'}
        </div>
      </div>
    </>
  );
};

