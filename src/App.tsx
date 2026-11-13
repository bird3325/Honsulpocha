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
import { useIsMobile } from './hooks/useIsMobile';
import { ChairSlot, PlayerAction, WeatherMood, PochaMenuItem } from './types';
import { TableServing } from './components/PochaTable';
import { soundManager } from './components/AudioController';

export const App: React.FC = () => {
  const isMobile = useIsMobile();
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

  // 상태 업데이트 시 리렌더링과 무관하게 항상 최신 상태를 참조하기 위한 Ref
  const tableServingsRef = React.useRef(tableServings);
  tableServingsRef.current = tableServings;

  const currentChairRef = React.useRef(currentChair);
  currentChairRef.current = currentChair;

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
              drinkCount: 8, // 혼자서 한 병 기준 8잔
            },
          };
        } else {
          return {
            ...prev,
            [targetTableId]: {
              ...current,
              hasFood: true,
              foodId: item.id,
              foodCount: 8, // 메뉴 한 개 기준 8입
            },
          };
        }
      });
      // 테이블에 메뉴가 배달되면 한잔/먹기 버튼 활성화
      setHasOrderedAfterMenu(true);
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

  // 메뉴판에서 주문 완료 후 한잔/먹기 버튼 활성화 상태
  const [hasOrderedAfterMenu, setHasOrderedAfterMenu] = useState<boolean>(false);

  // 포차 나가기(퇴장 후 로그아웃) 상태
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // 혼술 사색 오토모드 상태 및 독백 텍스트
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false);
  const [autoThought, setAutoThought] = useState<string | null>(null);

  // 사색 모드 독백 문구 모음 (홀짝 마시기 / 안주 먹기 / 조용한 생각)
  const DRINK_THOUGHTS = [
    "홀짝... 캬~ 시원하다. 오늘따라 술이 참 달다.",
    "꿀꺽... 술 한 모금에 하루 시름이 싹 씻겨 내려가네.",
    "홀짝... 빗소리 들으며 조용히 마시는 이 한잔이 큰 위로가 된다.",
    "캬아... 차가운 소주가 가슴을 뜨겁게 적셔주네.",
  ];

  const EAT_THOUGHTS = [
    "우물우물... 크, 역시 포차 안주가 최고야. 속이 든든하네.",
    "냠냠... 따끈한 온기가 입안 가득 퍼진다. 참 맛있다.",
    "쩝쩝... 안주 한 점에 소주 한잔, 이보다 완벽할 순 없지.",
  ];

  const CONTEMPLATION_THOUGHTS = [
    "오늘 하루도 참 고생 많았다...",
    "가끔은 이렇게 혼자 조용히 있는 시간이 필요해.",
    "내일은 또 내일의 태양이 뜨겠지...",
    "복잡한 생각은 잠시 비워두고 이 포근한 밤에 집중하자.",
    "세상이 아무리 바빠도, 여기선 시간이 멈춘 것만 같아.",
    "조용한 혼술의 여운이 가슴 깊이 스며든다...",
  ];

  // 오토모드 (혼술 사색 모드) - 혼자서 술잔과 안주를 홀짝홀짝 먹는 감성 스케줄러
  React.useEffect(() => {
    if (!isAutoMode) {
      setAutoThought(null);
      return;
    }

    // 비착석 상태라면 자동으로 가장 가까운 빈 의자에 착석
    if (!currentChairRef.current) {
      window.dispatchEvent(new CustomEvent('pocha_sit_nearest'));
    }

    let cycleStep = 0;
    // ★ 실제 포차 혼술의 여유로운 템포: 14초 간격의 5단계 순환 (술 한잔 음미 -> 깊은 사색 -> 안주 한점 -> 멍때리기 -> 감상)
    // 술 한잔과 다음 술잔 사이에 1분 이상의 충분한 사색 여운을 두어 서두르지 않고 느긋하게 힐링
    const interval = setInterval(() => {
      const targetTableId = currentChairRef.current ? currentChairRef.current.tableId : 't1';
      const serving = tableServingsRef.current[targetTableId];
      const hasDrink = (serving?.drinkCount ?? 8) > 0 && serving?.hasDrink !== false;
      const hasFood = (serving?.foodCount ?? 8) > 0 && serving?.hasFood !== false;

      // 술과 안주를 모두 다 비웠으면 사색 모드 자연 종료
      if (!hasDrink && !hasFood) {
        setAutoThought("🍶 술병과 접시를 깨끗하게 다 비웠습니다. [나가기]를 누르거나 새 메뉴를 주문해보세요.");
        setTimeout(() => {
          setAutoThought(null);
          setIsAutoMode(false);
        }, 5000);
        return;
      }

      const step = cycleStep % 5;

      if (step === 0) {
        // 1. 혼자서 술잔 채우고 홀짝 마시기 (술병 기울여 따르기 -> 잔 들어 마시기)
        if (hasDrink) {
          soundManager.playPouringSound();
          setMyAction('pouring');
          setAutoThought("쪼르르... 조용히 잔에 술을 채운다.");

          setTimeout(() => {
            soundManager.playCheersSound();
            setMyAction('drinking');
            const res = handleConsumeDrink();
            const thought = DRINK_THOUGHTS[Math.floor(Math.random() * DRINK_THOUGHTS.length)];
            setAutoThought(`${thought} (${res.count}/8잔)`);

            setTimeout(() => {
              setMyAction(currentChairRef.current ? 'sitting' : 'idle');
              setAutoThought(null);
            }, 4500);
          }, 2200);
        } else {
          // 술이 없으면 안주 먹기로 대체
          soundManager.playEatSound();
          setMyAction('eating');
          const res = handleConsumeFood();
          const thought = EAT_THOUGHTS[Math.floor(Math.random() * EAT_THOUGHTS.length)];
          setAutoThought(`${thought} (${res.count}/8입)`);
          setTimeout(() => {
            setMyAction(currentChairRef.current ? 'sitting' : 'idle');
            setAutoThought(null);
          }, 5500);
        }
      } else if (step === 1) {
        // 2. 술 한잔 후 빗소리와 함께 첫 번째 여운 사색
        const randomThought =
          CONTEMPLATION_THOUGHTS[Math.floor(Math.random() * CONTEMPLATION_THOUGHTS.length)];
        setAutoThought(randomThought);
        setTimeout(() => setAutoThought(null), 6000);
      } else if (step === 2) {
        // 3. 따뜻한 안주 냠냠 먹기 (Eating)
        if (hasFood) {
          soundManager.playEatSound();
          setMyAction('eating');
          const res = handleConsumeFood();
          const thought = EAT_THOUGHTS[Math.floor(Math.random() * EAT_THOUGHTS.length)];
          setAutoThought(`${thought} (${res.count}/8입)`);
          setTimeout(() => {
            setMyAction(currentChairRef.current ? 'sitting' : 'idle');
            setAutoThought(null);
          }, 5500);
        } else {
          // 안주가 없으면 술 마시기로 대체
          soundManager.playCheersSound();
          setMyAction('drinking');
          const res = handleConsumeDrink();
          const thought = DRINK_THOUGHTS[Math.floor(Math.random() * DRINK_THOUGHTS.length)];
          setAutoThought(`${thought} (${res.count}/8잔)`);
          setTimeout(() => {
            setMyAction(currentChairRef.current ? 'sitting' : 'idle');
            setAutoThought(null);
          }, 5500);
        }
      } else if (step === 3) {
        // 4. 안주 먹은 후 밖의 골목과 비/눈을 조용히 바라보며 멍때리기
        const thoughts = [
          "세상이 아무리 바빠도, 여기선 시간이 멈춘 것만 같아.",
          "따끈한 국물과 온기 덕분에 마음이 차분해진다...",
          "조용한 혼술의 여운이 가슴 깊이 스며드네.",
        ];
        setAutoThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
        setTimeout(() => setAutoThought(null), 6000);
      } else {
        // 5. 다음 잔을 마시기 전 깊은 생각과 마음 비우기
        const thoughts = [
          "복잡한 생각은 잠시 비워두고 이 포근한 밤에 집중하자.",
          "오늘 하루도 참 고생 많았다...",
          "내일은 또 내일의 태양이 뜨겠지...",
        ];
        setAutoThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
        setTimeout(() => setAutoThought(null), 6000);
      }

      cycleStep++;
    }, 14000);

    return () => clearInterval(interval);
  }, [isAutoMode]);

  // 사장님 메뉴 주문 & 서빙 요청 핸들러 (복수 선택 주문 지원)
  const handleOrderMenu = (items: PochaMenuItem[]) => {
    if (items.length === 0) return;

    // 메뉴판에서 주문 완료 시 즉시 [한잔] 및 [먹기] 버튼 활성화
    setHasOrderedAfterMenu(true);

    let targetPos: [number, number, number] = [0, 0, 0];
    let tableName = '테이블';
    const targetTableId = currentChair ? currentChair.tableId : 't1';

    // 포차 테이블 10개 좌표 맵
    const TABLE_POS_MAP: Record<string, [number, number, number]> = {
      t1: [-3.8, 0, 3.4],
      t2: [3.8, 0, 3.4],
      t3: [-3.8, 0, 1.7],
      t4: [3.8, 0, 1.7],
      t5: [-3.8, 0, 0.0],
      t6: [3.8, 0, 0.0],
      t7: [-3.8, 0, -1.7],
      t8: [3.8, 0, -1.7],
      t9: [-3.8, 0, -3.2],
      t10: [3.8, 0, -3.2],
    };

    if (currentChair) {
      // 착석 중인 경우: 캐릭터가 앉아 있는 의자 방향을 감지하여 캐릭터가 없는 빈 방향으로 서빙!
      const tbl = TABLE_POS_MAP[currentChair.tableId] || [-3.8, 0, 3.4];
      const isLeftTable = tbl[0] < 0;
      const chairPos = currentChair.position;

      // 테이블 중심 대비 착석 의자의 상대적 위치
      const chairRelX = chairPos[0] - tbl[0];
      const chairRelZ = chairPos[2] - tbl[2];

      // 기본적으로 중앙 복도 쪽 통로 서빙 좌표
      let serveX = isLeftTable ? tbl[0] + 1.25 : tbl[0] - 1.25;
      let serveZ = tbl[2];

      // 캐릭터가 중앙 복도 쪽 의자(isLeftTable ? chairRelX > 0.4 : chairRelX < -0.4)에 앉아 있다면?
      // 사장님이 캐릭터와 겹치지 않도록 테이블의 앞쪽(남쪽)이나 뒤쪽(북쪽) 빈 공간으로 서빙 위치를 지능적으로 우회
      const isSittingOnCorridorSide = isLeftTable ? chairRelX > 0.4 : chairRelX < -0.4;
      if (isSittingOnCorridorSide) {
        // Z축 상단/하단 중 캐릭터가 없는 빈 방향 선택
        if (chairRelZ >= 0) {
          // 캐릭터가 남쪽/중앙에 있으면 북쪽(뒤편) 빈 공간으로 서빙
          serveX = isLeftTable ? tbl[0] + 0.8 : tbl[0] - 0.8;
          serveZ = tbl[2] - 1.05;
        } else {
          // 캐릭터가 북쪽에 있으면 남쪽(앞편) 빈 공간으로 서빙
          serveX = isLeftTable ? tbl[0] + 0.8 : tbl[0] - 0.8;
          serveZ = tbl[2] + 1.05;
        }
      } else {
        // 캐릭터가 외벽/상/하단 의자에 앉아 있으면 중앙 복도 쪽 서빙 위치에서 안전하게 서빙
        // Z축 의자에 앉아 있는 경우 미세 오프셋 회피
        if (Math.abs(chairRelZ) > 0.4) {
          serveZ = tbl[2] - Math.sign(chairRelZ) * 0.35;
        }
      }

      targetPos = [serveX, 0, serveZ];
      tableName = `${currentChair.tableId.replace('t', '')}번 테이블`;
    } else {
      // 서 있는 경우: 서 있는 플레이어의 실시간 위치와 겹치지 않도록 플레이어 정면 1.2m 앞 복도 지점에 서빙
      const px = myRealtimePos.current[0];
      const pz = myRealtimePos.current[2];

      // 플레이어가 서 있는 위치에서 1.2m 앞쪽으로 안전 거리 확보
      const serveX = Math.max(-2.2, Math.min(2.2, px));
      const serveZ = pz < -1.5 ? pz + 1.2 : pz - 1.2;
      targetPos = [serveX, 0, Math.max(-3.3, Math.min(3.8, serveZ))];
    }

    // 사장님 NPC 서빙 이벤트 발송 (복수 메뉴 한 번에 전달)
    window.dispatchEvent(
      new CustomEvent('pocha_serve_order', {
        detail: {
          item: items[0],
          items,
          targetPos,
          tableName,
          tableId: targetTableId,
        },
      })
    );

    const namesText = items.map((i) => i.name).join(', ');
    setServingToast(`👵 사장님이 주문하신 [${namesText}]을(를) 직접 가져오고 계십니다...`);
    setTimeout(() => {
      setServingToast(null);
    }, 6500);
  };

  // 1. 술 한잔 소비 핸들러 (마실 때마다 잔 수 감소 -> 다 마시면 테이블에서 비워짐)
  const handleConsumeDrink = (): { count: number; isDone: boolean } => {
    const targetTableId = currentChairRef.current ? currentChairRef.current.tableId : 't1';
    let resultCount = 0;
    let resultDone = false;

    setTableServings((prev) => {
      const cur = prev[targetTableId] || { hasDrink: false, hasFood: false };
      const curCount = cur.drinkCount ?? 8;
      resultCount = Math.max(0, curCount - 1);
      resultDone = resultCount <= 0;

      const updated = {
        ...prev,
        [targetTableId]: {
          ...cur,
          hasDrink: !resultDone,
          drinkCount: resultCount,
        },
      };
      if (resultDone && !cur.hasFood) {
        setHasOrderedAfterMenu(false);
        setIsAutoMode(false);
      }
      return updated;
    });

    return { count: resultCount, isDone: resultDone };
  };

  // 2. 안주 한 입 소비 핸들러 (먹을 때마다 입 수 감소 -> 다 먹으면 접시 깨끗이 비워짐)
  const handleConsumeFood = (): { count: number; isDone: boolean } => {
    const targetTableId = currentChairRef.current ? currentChairRef.current.tableId : 't1';
    let resultCount = 0;
    let resultDone = false;

    setTableServings((prev) => {
      const cur = prev[targetTableId] || { hasDrink: false, hasFood: false };
      const curCount = cur.foodCount ?? 8;
      resultCount = Math.max(0, curCount - 1);
      resultDone = resultCount <= 0;

      const updated = {
        ...prev,
        [targetTableId]: {
          ...cur,
          hasFood: !resultDone,
          foodCount: resultCount,
        },
      };
      if (resultDone && !cur.hasDrink) {
        setHasOrderedAfterMenu(false);
        setIsAutoMode(false);
      }
      return updated;
    });

    return { count: resultCount, isDone: resultDone };
  };

  // 메뉴 주문 완료 시에만 사색모드 토글 가능
  const handleToggleAutoMode = () => {
    const targetTableId = currentChair ? currentChair.tableId : 't1';
    const serving = tableServings[targetTableId];
    const hasItemsOnTable = serving?.hasDrink || serving?.hasFood;

    if (!hasOrderedAfterMenu && !hasItemsOnTable) {
      setServingToast("📋 메뉴판에서 메뉴를 먼저 주문하셔야 사색모드를 즐기실 수 있습니다.");
      setTimeout(() => setServingToast(null), 3500);
      return;
    }

    setIsAutoMode((prev) => !prev);
  };

  // 3. 포차 나가기 시작 핸들러 (의자에서 일어나 포차 입구 밖으로 걸어나감)
  const handleExitPocha = () => {
    if (isExiting) return;
    setIsExiting(true);
    setIsAutoMode(false);
    setServingToast("👵 사장님: '손님, 오늘 하루도 참 고생 많으셨어요! 조심히 들어가시고 또 들러주세요~'");
    setTimeout(() => {
      setServingToast(null);
    }, 6000);
  };

  // 4. 포차 밖 도달 시 최종 로그아웃 완료 핸들러 (첫 입장 화면으로 복귀)
  const handleExitComplete = () => {
    setIsExiting(false);
    setHasEntered(false); // 로그아웃 처리 -> 감성 WelcomeModal로 복귀
    setCurrentChair(null);
    setHasOrderedAfterMenu(false);
    setIsAutoMode(false);
    setTableServings({});
    myRealtimePos.current = [0, 0, 4.6];
    myRealtimeRot.current = Math.PI;
    setServingToast(null);
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
      style={{
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        position: 'relative',
      }}
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
            autoThought={autoThought}
            isExiting={isExiting}
            onExitComplete={handleExitComplete}
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

      {/* 4. 모바일 가상 조이스틱 (모바일 터치 환경에서만 렌더링) */}
      {hasEntered && !isExiting && isMobile && (
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
          hasOrderedMenu={hasOrderedAfterMenu}
          onConsumeDrink={handleConsumeDrink}
          onConsumeFood={handleConsumeFood}
          currentTableServing={tableServings[currentChair ? currentChair.tableId : 't1']}
          isAutoMode={isAutoMode}
          onToggleAutoMode={handleToggleAutoMode}
          onExitPocha={handleExitPocha}
          isExiting={isExiting}
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
