import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PochaScene } from './components/PochaScene';
import { Header } from './components/UI/Header';
import { ActionOverlay } from './components/UI/ActionOverlay';
import { WelcomeModal } from './components/UI/WelcomeModal';
import { JoinTableModal } from './components/UI/JoinTableModal';
import { MenuModal } from './components/UI/MenuModal';
import { RotateOrientationOverlay } from './components/UI/RotateOrientationOverlay';
import { VirtualJoystick } from './components/UI/VirtualJoystick';
import { useMultiplayer } from './hooks/useMultiplayer';
import { ChairSlot, PlayerAction, WeatherMood, PochaMenuItem } from './types';
import { TableServing } from './components/PochaTable';
import { soundManager } from './components/AudioController';

export const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [weatherMood, setWeatherMood] = useState<WeatherMood>('rainy');
  const [myAction, setMyAction] = useState<PlayerAction>('idle');
  const [currentChair, setCurrentChair] = useState<ChairSlot | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [servingToast, setServingToast] = useState<string | null>(null);
  const myRealtimePos = React.useRef<[number, number, number]>([0, 0, 4.6]);
  const myRealtimeRot = React.useRef<number>(Math.PI);
  const joystickVector = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 테이블별 서빙 상태: 초기에는 NPC들이 앉아있는 테이블만 술과 안주가 있고, 빈 테이블은 아무것도 없음!
  const [tableServings, setTableServings] = useState<Record<string, TableServing>>({
    t4: { hasDrink: true, drinkId: 'soju_chamisul', hasFood: true, foodId: 'food_fishcake' },
    t6: { hasDrink: true, drinkId: 'soju_jinro', hasFood: true, foodId: 'food_tteokbokki' },
    t7: { hasDrink: true, drinkId: 'soju_chamisul', hasFood: true, foodId: 'food_mussel' },
    t8: { hasDrink: true, drinkId: 'beer_draft', hasFood: true, foodId: 'food_seafood_pancake' },
    t9: { hasDrink: true, drinkId: 'soju_chamisul', hasFood: true, foodId: 'food_ramen' },
    // 빈 테이블인 t1, t2, t3, t5, t10은 완전 깨끗한 빈 테이블!
  });

  // 사장님이 손님 테이블에 도착하여 배달 완료 시 해당 테이블에 메뉴 세팅
  React.useEffect(() => {
    const handleTableDelivered = (e: Event) => {
      const customEvent = e as CustomEvent<{ tableId?: string; item: PochaMenuItem }>;
      if (!customEvent.detail) return;
      const { tableId, item } = customEvent.detail;
      const targetTableId = tableId || (currentChair ? currentChair.tableId : 't1');

      setTableServings((prev) => {
        const current = prev[targetTableId] || { hasDrink: false, hasFood: false };
        if (item.category === 'drink') {
          return {
            ...prev,
            [targetTableId]: {
              ...current,
              hasDrink: true,
              drinkId: item.id,
            },
          };
        } else {
          return {
            ...prev,
            [targetTableId]: {
              ...current,
              hasFood: true,
              foodId: item.id,
            },
          };
        }
      });
    };

    window.addEventListener('pocha_table_delivered', handleTableDelivered);
    return () => window.removeEventListener('pocha_table_delivered', handleTableDelivered);
  }, [currentChair]);

  const [joinModalInfo, setJoinModalInfo] = useState<{
    chair: ChairSlot;
    hostNickname: string;
    onAccept: () => void;
  } | null>(null);

  // 멀티플레이어 상태 훅
  const { myPlayer, otherPlayers, sendUpdate } = useMultiplayer({
    onMyPlayerCreated: () => { },
  });

  // 사장님 메뉴 주문 & 서빙 요청 핸들러
  const handleOrderMenu = (item: PochaMenuItem) => {
    let targetPos: [number, number, number] = [0, 0, 0];
    let tableName = '테이블';
    const targetTableId = currentChair ? currentChair.tableId : 't1';

    if (currentChair) {
      // 착석 중인 경우: 의자 바로 앞(테이블과의 사이)으로 서빙
      targetPos = [
        currentChair.position[0] + Math.sin(currentChair.rotation) * 0.45,
        0,
        currentChair.position[2] + Math.cos(currentChair.rotation) * 0.45,
      ];
      tableName = `${currentChair.tableId.replace('t', '')}번 테이블`;
    } else {
      // 서 있는 경우: 내 현재 실시간 위치 앞 0.8m 지점으로 서빙
      targetPos = [
        myRealtimePos.current[0] + Math.sin(myRealtimeRot.current) * 0.8,
        0,
        myRealtimePos.current[2] + Math.cos(myRealtimeRot.current) * 0.8,
      ];
    }

    // 사장님 NPC 서빙 이벤트 발송
    window.dispatchEvent(
      new CustomEvent('pocha_serve_order', {
        detail: { item, targetPos, tableName, tableId: targetTableId },
      })
    );

    setServingToast(`👵 사장님이 주문하신 [${item.name}]을 직접 가져오고 계십니다...`);
    setTimeout(() => {
      setServingToast(null);
    }, 6500);
  };

  // 다른 유저들에게 내 이동/액션 브로드캐스트 & 내 실시간 위치 갱신
  const handleUpdatePlayer = (
    pos: [number, number, number],
    rot: number,
    action: PlayerAction,
    chairId: string | null
  ) => {
    myRealtimePos.current = pos;
    myRealtimeRot.current = rot;
    sendUpdate(pos, rot, action, chairId);
  };

  const handleBroadcastAction = (action: PlayerAction) => {
    if (myPlayer) {
      sendUpdate(
        myPlayer.position,
        myPlayer.rotation,
        action,
        currentChair ? currentChair.id : null
      );
    }
  };

  // 일어서기
  const handleStandUp = () => {
    setCurrentChair(null);
    setMyAction('idle');
    if (myPlayer) {
      sendUpdate(myPlayer.position, myPlayer.rotation, 'idle', null);
    }
  };

  const handleWeatherMoodChange = (mood: WeatherMood) => {
    setWeatherMood(mood);
    soundManager.setWeatherMood(mood);
  };

  const playerCount = 1 + otherPlayers.size;

  return (
    <div
      className="relative w-screen h-screen bg-[#0b0c10] overflow-hidden select-none"
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
    >
      {/* 1. 상단 감성 헤더 */}
      <Header
        playerCount={playerCount}
        myNickname={myPlayer?.nickname || '조용한 소주'}
        weatherMood={weatherMood}
        onWeatherMoodChange={handleWeatherMoodChange}
      />

      {/* 2. 3D WebGL Canvas (전체 화면 100vw x 100vh 풀스크린) */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Canvas
          shadows
          camera={{ position: [0, 2.8, 6.6], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <PochaScene
            myPlayer={myPlayer}
            otherPlayers={otherPlayers}
            onUpdatePlayer={handleUpdatePlayer}
            myAction={myAction}
            setMyAction={setMyAction}
            currentChair={currentChair}
            setCurrentChair={setCurrentChair}
            onRequestJoinTable={(chair, hostNickname, onAccept) => {
              setJoinModalInfo({ chair, hostNickname, onAccept });
            }}
            weatherMood={weatherMood}
            tableServings={tableServings}
            joystickVector={joystickVector}
          />
        </Canvas>
      </div>

      {/* 3. 합석 요청 확인 모달 */}
      {joinModalInfo && (
        <JoinTableModal
          targetChair={joinModalInfo.chair}
          hostNickname={joinModalInfo.hostNickname}
          onConfirm={() => {
            const acceptFn = joinModalInfo.onAccept;
            setJoinModalInfo(null);
            acceptFn();
          }}
          onCancel={() => {
            setJoinModalInfo(null);
          }}
        />
      )}

      {/* 4. 모바일 가상 조이스틱 (터치 및 마우스 아날로그 360도 이동) */}
      {hasEntered && (
        <VirtualJoystick
          onMove={(x, y) => {
            joystickVector.current = { x, y };
          }}
        />
      )}

      {/* 5. 하단 상호작용 오버레이 */}
      {hasEntered && (
        <ActionOverlay
          currentChair={currentChair}
          myAction={myAction}
          setMyAction={setMyAction}
          onStandUp={handleStandUp}
          broadcastAction={handleBroadcastAction}
          onOpenMenu={() => setIsMenuOpen(true)}
          servingToast={servingToast}
        />
      )}

      {/* 5. 포차 차림표 (메뉴판) 모달 */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOrder={handleOrderMenu}
        isServing={!!servingToast}
      />

      {/* 6. 감성 입장 모달 (브라우저 오디오 권한 획득 & 첫 입장) */}
      {!hasEntered && (
        <WelcomeModal
          nickname={myPlayer?.nickname || '조용한 소주'}
          onEnter={() => setHasEntered(true)}
        />
      )}

      {/* 7. 모바일 세로 모드 시 가로 화면 유도 오버레이 */}
      <RotateOrientationOverlay />
    </div>
  );
};
