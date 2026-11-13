import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PochaTent } from './PochaTent';
import { PochaTable, TableServing } from './PochaTable';
import { StreetEnvironment } from './StreetEnvironment';
import { NightCityBuildings } from './NightCityBuildings';
import { ParkEnvironment } from './ParkEnvironment';
import { RoadTraffic } from './RoadTraffic';
import { RainEffect } from './RainEffect';
import { Avatar } from './Avatar';
import { OtherAvatars } from './OtherAvatars';
import { GrandmaBoss } from './GrandmaBoss';
import { Player, ChairSlot, PlayerAction, WeatherMood } from '../types';
import { useKeyboard } from '../hooks/useKeyboard';
import { soundManager } from './AudioController';

interface PochaSceneProps {
  myPlayer: Player | null;
  otherPlayers: Map<string, Player>;
  onUpdatePlayer: (
    pos: [number, number, number],
    rot: number,
    action: PlayerAction,
    chairId: string | null
  ) => void;
  myAction: PlayerAction;
  setMyAction: React.Dispatch<React.SetStateAction<PlayerAction>>;
  currentChair: ChairSlot | null;
  setCurrentChair: React.Dispatch<React.SetStateAction<ChairSlot | null>>;
  onRequestJoinTable?: (
    chair: ChairSlot,
    hostNickname: string,
    onAccept: () => void
  ) => void;
  weatherMood?: WeatherMood;
  tableServings?: Record<string, TableServing>;
  joystickVector?: React.MutableRefObject<{ x: number; y: number }>;
  autoThought?: string | null;
  isExiting?: boolean;
  onExitComplete?: () => void;
}

export const PochaScene: React.FC<PochaSceneProps> = ({
  myPlayer,
  otherPlayers,
  onUpdatePlayer,
  myAction,
  setMyAction,
  currentChair,
  setCurrentChair,
  onRequestJoinTable,
  weatherMood = 'rainy',
  tableServings,
  joystickVector,
  autoThought = null,
  isExiting = false,
  onExitComplete,
}) => {
  const keys = useKeyboard();
  const playerPos = useRef<[number, number, number]>([0, 0, 4.6]); // 처음 시작 시 포장마차 입구 중앙에 배치
  const playerRot = useRef<number>(Math.PI); // 포차 안쪽(테이블과 주방)을 바라보는 정면 방향
  const targetPos = useRef<[number, number, number] | null>(null);
  const targetChairRef = useRef<ChairSlot | null>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // 주인장 배달(서빙) 시 카메라 자동 포커싱을 위한 사장님 위치 및 상태 Ref
  const bossPosRef = useRef<[number, number, number]>([0, 0, -4.8]);
  const [isBossServing, setIsBossServing] = useState<boolean>(false);
  const wasBossServingRef = useRef<boolean>(false);
  const resetToPlayerFrontRef = useRef<boolean>(false);

  const lastInteractRef = useRef<boolean>(false);

  // 날씨 및 분위기 테마별 조명/안개 감성 파라미터 구성
  const moodConfig = useMemo(() => {
    switch (weatherMood) {
      case 'snowy':
        return {
          fogColor: '#161f28',
          fogNear: 22,
          fogFar: 85,
          ambientColor: '#c5d1de',
          ambientIntensity: 1.25,
          dirLightColor: '#ffffff',
          dirLightIntensity: 1.45,
          dirLightPos: [8, 14, 10] as [number, number, number],
          pochaLightColor: '#ff9f43',
          pochaLightIntensity: 2.8,
        };
      case 'autumn':
        return {
          fogColor: '#1a1412',
          fogNear: 22,
          fogFar: 90,
          ambientColor: '#f39c12',
          ambientIntensity: 1.2,
          dirLightColor: '#f39c12',
          dirLightIntensity: 1.5,
          dirLightPos: [9, 13, 8] as [number, number, number],
          pochaLightColor: '#e67e22',
          pochaLightIntensity: 2.9,
        };
      case 'sunset':
        return {
          fogColor: '#2d142c',
          fogNear: 25,
          fogFar: 95,
          ambientColor: '#e056fd',
          ambientIntensity: 1.15,
          dirLightColor: '#ff7675',
          dirLightIntensity: 1.5,
          dirLightPos: [12, 7, 10] as [number, number, number],
          pochaLightColor: '#f0932b',
          pochaLightIntensity: 2.5,
        };
      case 'starry':
        return {
          fogColor: '#070b14',
          fogNear: 28,
          fogFar: 110,
          ambientColor: '#70a1ff',
          ambientIntensity: 1.05,
          dirLightColor: '#c7ecee',
          dirLightIntensity: 1.25,
          dirLightPos: [8, 14, 10] as [number, number, number],
          pochaLightColor: '#f9ca24',
          pochaLightIntensity: 2.6,
        };
      case 'rainy':
      default:
        return {
          fogColor: '#0e1117',
          fogNear: 24,
          fogFar: 90,
          ambientColor: '#ffb169',
          ambientIntensity: 1.25,
          dirLightColor: '#fff2cc',
          dirLightIntensity: 1.45,
          dirLightPos: [8, 14, 10] as [number, number, number],
          pochaLightColor: '#f39c12',
          pochaLightIntensity: 3.2,
        };
    }
  }, [weatherMood]);

  // 테이블 10개 구성 (확장된 포장마차 공간에 맞춘 2열 5행 정감 있는 빨강/파랑 테이블)
  const tables = useMemo(() => [
    { id: 't1', name: '1번 테이블', position: [-3.8, 0, 3.4] as [number, number, number], color: '#d63031' },
    { id: 't2', name: '2번 테이블', position: [3.8, 0, 3.4] as [number, number, number], color: '#0984e3' },
    { id: 't3', name: '3번 테이블', position: [-3.8, 0, 1.7] as [number, number, number], color: '#0984e3' },
    { id: 't4', name: '4번 테이블', position: [3.8, 0, 1.7] as [number, number, number], color: '#d63031' },
    { id: 't5', name: '5번 테이블', position: [-3.8, 0, 0.0] as [number, number, number], color: '#d63031' },
    { id: 't6', name: '6번 테이블', position: [3.8, 0, 0.0] as [number, number, number], color: '#0984e3' },
    { id: 't7', name: '7번 테이블', position: [-3.8, 0, -1.7] as [number, number, number], color: '#0984e3' },
    { id: 't8', name: '8번 테이블', position: [3.8, 0, -1.7] as [number, number, number], color: '#d63031' },
    { id: 't9', name: '9번 테이블', position: [-3.8, 0, -3.2] as [number, number, number], color: '#d63031' },
    { id: 't10', name: '10번 테이블', position: [3.8, 0, -3.2] as [number, number, number], color: '#0984e3' },
  ], []);

  // 의자 슬롯 정의 (10개 테이블 x 4개 의자 = 총 40개 좌석)
  const chairSlots = useMemo<ChairSlot[]>(() => {
    const occupiedSet = new Set<string>();
    otherPlayers.forEach((p) => {
      if (p.seatedChairId) occupiedSet.add(p.seatedChairId);
    });

    const baseSlots: ChairSlot[] = tables.flatMap((t) => {
      const [tx, , tz] = t.position;
      return [
        { id: `${t.id}_c1`, tableId: t.id, position: [tx, 0, tz - 0.85] as [number, number, number], rotation: 0, isOccupied: false },
        { id: `${t.id}_c2`, tableId: t.id, position: [tx - 0.85, 0, tz] as [number, number, number], rotation: Math.PI / 2, isOccupied: false },
        { id: `${t.id}_c3`, tableId: t.id, position: [tx, 0, tz + 0.85] as [number, number, number], rotation: Math.PI, isOccupied: false },
        { id: `${t.id}_c4`, tableId: t.id, position: [tx + 0.85, 0, tz] as [number, number, number], rotation: -Math.PI / 2, isOccupied: false },
      ];
    });

    return baseSlots.map((slot) => ({
      ...slot,
      isOccupied: occupiedSet.has(slot.id),
    }));
  }, [tables, otherPlayers]);

  // 초기 위치 세팅
  useEffect(() => {
    if (myPlayer) {
      playerPos.current = [...myPlayer.position];
      playerRot.current = myPlayer.rotation;
      if (controlsRef.current) {
        controlsRef.current.target.set(myPlayer.position[0], 0.7, myPlayer.position[2] - 0.2);
        controlsRef.current.update();
      }
    }
  }, [myPlayer?.id]);

  // 실제 착석 이동 수행 (걸어가서 앉기)
  const executeSitChair = (chair: ChairSlot) => {
    if (currentChair) {
      setCurrentChair(null);
      setMyAction('idle');
      playerPos.current = [
        playerPos.current[0] + Math.sin(playerRot.current) * 0.3,
        0,
        playerPos.current[2] + Math.cos(playerRot.current) * 0.3,
      ];
    }

    // 플레이어와 의자 간의 거리 측정
    const dist = Math.hypot(
      chair.position[0] - playerPos.current[0],
      chair.position[2] - playerPos.current[2]
    );

    if (dist < 0.25) {
      // 이미 의자 바로 앞이면 즉시 착석
      setCurrentChair(chair);
      setMyAction('sitting');
      playerPos.current = [chair.position[0], 0, chair.position[2]];
      playerRot.current = chair.rotation;
      targetPos.current = null;
      targetChairRef.current = null;
      soundManager.playPouringSound();
      onUpdatePlayer(playerPos.current, chair.rotation, 'sitting', chair.id);
    } else {
      // 의자를 향해 걸어가도록 목표 설정
      targetChairRef.current = chair;
      targetPos.current = [chair.position[0], 0, chair.position[2]];
      setMyAction('walking');
      onUpdatePlayer(playerPos.current, playerRot.current, 'walking', null);
    }
  };

  // 의자 클릭 시 착석 핸들러 (합석 확인 로직 포함)
  const handleSitChair = (chair: ChairSlot) => {
    if (currentChair?.id === chair.id) {
      // 이미 같은 의자에 앉아있으면 일어서기
      handleStandUp();
      return;
    }

    // 해당 테이블에 이미 다른 손님(NPC 또는 다른 플레이어)이 앉아있는지 검사
    let seatedHost: Player | null = null;
    otherPlayers.forEach((p) => {
      if (p.seatedChairId && p.seatedChairId.startsWith(chair.tableId)) {
        seatedHost = p;
      }
    });

    // 다른 사람이 혼술 중인 테이블이고 내가 처음 합석하려는 경우 허락 묻기
    const isAlreadyAtSameTable = currentChair?.tableId === chair.tableId;
    if (seatedHost && !isAlreadyAtSameTable && onRequestJoinTable) {
      onRequestJoinTable(chair, (seatedHost as Player).nickname, () => {
        executeSitChair(chair);
      });
      return;
    }

    // 빈 테이블이거나 이미 수락된 경우 바로 착석 실행
    executeSitChair(chair);
  };

  // 모바일 [앉기] 버튼 클릭 시 가장 가까운 빈 의자 자동 착석
  useEffect(() => {
    const handleSitNearest = () => {
      if (currentChair) {
        handleStandUp();
        return;
      }
      let closestChair: ChairSlot | null = null;
      let minDistance = 2.6;

      chairSlots.forEach((chair) => {
        if (!chair.isOccupied) {
          const dist = Math.hypot(
            chair.position[0] - playerPos.current[0],
            chair.position[2] - playerPos.current[2]
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestChair = chair;
          }
        }
      });

      if (closestChair) {
        handleSitChair(closestChair);
      }
    };

    window.addEventListener('pocha_sit_nearest', handleSitNearest);
    return () => window.removeEventListener('pocha_sit_nearest', handleSitNearest);
  }, [chairSlots, currentChair]);

  const handleStandUp = () => {
    if (!currentChair) return;
    targetChairRef.current = null;
    targetPos.current = null;
    setCurrentChair(null);
    setMyAction('idle');
    // 의자 살짝 앞으로 나오기
    playerPos.current = [
      playerPos.current[0] + Math.sin(playerRot.current) * 0.4,
      0,
      playerPos.current[2] + Math.cos(playerRot.current) * 0.4,
    ];
    onUpdatePlayer(playerPos.current, playerRot.current, 'idle', null);
  };

  // 프레임 루프 (키보드 이동 / 의자 클릭 착석 이동 & 카메라 팔로우)
  useFrame((_, delta) => {
    let isMoving = false;
    let dx = 0;
    let dz = 0;

    // 1. 키보드 E, F, Space 상호작용 (가까운 의자 착석 및 일어서기)
    if (keys.interact && !lastInteractRef.current) {
      if (currentChair) {
        handleStandUp();
      } else {
        // 내 위치에서 반경 1.8m 이내의 가장 가까운 빈 의자 찾기
        let closestChair: ChairSlot | null = null;
        let minDistance = 1.8;

        chairSlots.forEach((chair) => {
          if (!chair.isOccupied) {
            const dist = Math.hypot(
              chair.position[0] - playerPos.current[0],
              chair.position[2] - playerPos.current[2]
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestChair = chair;
            }
          }
        });

        if (closestChair) {
          handleSitChair(closestChair);
        }
      }
    }
    lastInteractRef.current = keys.interact;

    // 1-A. 포차 나가기(퇴장) 자동 걷기 모드: 입구 밖으로 걸어나와 포차를 벗어나면 로그아웃
    if (isExiting) {
      if (currentChair) {
        handleStandUp();
      }
      isMoving = true;
      const targetExitX = 0;
      const targetExitZ = 6.4;

      const diffX = targetExitX - playerPos.current[0];
      const diffZ = targetExitZ - playerPos.current[2];

      const exitAngle = Math.atan2(diffX, diffZ);
      playerRot.current = exitAngle;

      const exitSpeed = 2.2 * delta;
      playerPos.current[0] += Math.sin(exitAngle) * exitSpeed;
      playerPos.current[2] += Math.cos(exitAngle) * exitSpeed;

      onUpdatePlayer(playerPos.current, playerRot.current, 'walking', null);

      // 포차 천막 밖 길거리(z >= 5.6)에 도달하면 퇴장(로그아웃) 콜백 호출
      if (playerPos.current[2] >= 5.6 && onExitComplete) {
        onExitComplete();
      }
      return; // 퇴장 중에는 다른 수동 조작 방지
    }

    // 2. 키보드 + 모바일 가상 조이스틱 이동 (카메라 시야 기준 360도 이동 & 즉각적인 전방 회전)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // forward에 수직인 우측(Right) 수평 벡터 계산 (Forward x Up)
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3(0, 0, 0);
    // 키보드 입력
    if (keys.forward) moveDir.add(forward);
    if (keys.backward) moveDir.sub(forward);
    if (keys.right) moveDir.add(right);
    if (keys.left) moveDir.sub(right);

    // 모바일 조이스틱 입력 (jx: -1 ~ 1, jy: -1 ~ 1)
    let joystickStrength = 0;
    if (joystickVector?.current) {
      const jx = joystickVector.current.x;
      const jy = joystickVector.current.y;
      joystickStrength = Math.hypot(jx, jy);
      if (joystickStrength > 0.08) {
        // jy < 0 (위로 드래그 = 전방), jy > 0 (아래로 드래그 = 후방)
        moveDir.addScaledVector(forward, -jy);
        moveDir.addScaledVector(right, jx);
      }
    }

    if (moveDir.lengthSq() > 0.001) {
      if (currentChair) {
        handleStandUp();
      }
      targetPos.current = null;
      targetChairRef.current = null; // 이동 조작 시 의자 자동 이동 취소
      isMoving = true;

      moveDir.normalize();

      // 캐릭터가 이동하는 방향을 정면으로 즉시 바라보도록 정확한 각도 계산
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      playerRot.current = targetAngle;

      const speedMultiplier = joystickStrength > 0.08 ? Math.min(1.0, joystickStrength) : 1.0;
      const speed = 2.8 * speedMultiplier * delta;
      playerPos.current[0] += moveDir.x * speed;
      playerPos.current[2] += moveDir.z * speed;

      // 범위 제약 (확장된 포차 내부 바닥: 14.0m x 11.5m 공간에 맞춰 안전한 활동 반경 설정)
      playerPos.current[0] = Math.max(-6.2, Math.min(6.2, playerPos.current[0]));
      playerPos.current[2] = Math.max(-3.6, Math.min(4.8, playerPos.current[2]));

      setMyAction('walking');
      onUpdatePlayer(playerPos.current, playerRot.current, 'walking', null);
    } else if (targetChairRef.current && targetPos.current && !currentChair) {
      // 의자 클릭 시 해당 의자로 걸어가기
      const diffX = targetPos.current[0] - playerPos.current[0];
      const diffZ = targetPos.current[2] - playerPos.current[2];
      const dist = Math.hypot(diffX, diffZ);

      if (dist > 0.22) {
        isMoving = true;
        const angle = Math.atan2(diffX, diffZ);
        playerRot.current = angle;
        const moveDist = Math.min(dist, 2.9 * delta);
        playerPos.current[0] += Math.sin(angle) * moveDist;
        playerPos.current[2] += Math.cos(angle) * moveDist;

        setMyAction('walking');
        onUpdatePlayer(playerPos.current, playerRot.current, 'walking', null);
      } else {
        // ★ 의자에 도착! 의자 위치 및 테이블을 바라보는 방향으로 정렬하고 착석
        const chair = targetChairRef.current;
        targetChairRef.current = null;
        targetPos.current = null;

        setCurrentChair(chair);
        setMyAction('sitting');
        playerPos.current = [chair.position[0], 0, chair.position[2]];
        playerRot.current = chair.rotation;

        soundManager.playPouringSound(); // 앉을 때 기분 좋은 효과음
        onUpdatePlayer(playerPos.current, chair.rotation, 'sitting', chair.id);
      }
    } else if (myAction === 'walking') {
      setMyAction('idle');
      onUpdatePlayer(playerPos.current, playerRot.current, 'idle', currentChair ? currentChair.id : null);
    }

    // 3. 카메라 부드러운 팔로우 & (주인장 배달 시 자동 포커싱 / 음주 제스처 시 시네마틱 줌업)
    if (controlsRef.current) {
      const prevTargetX = controlsRef.current.target.x;
      const prevTargetY = controlsRef.current.target.y;
      const prevTargetZ = controlsRef.current.target.z;

      if (isBossServing) {
        wasBossServingRef.current = true;
        resetToPlayerFrontRef.current = false;

        // ★ 주인장 배달(서빙) 시: 한 단계 더 축소(Wide Zoom)하여 사장님과 포차 테이블 전체를 여유롭고 쾌적하게 조망
        const targetX = bossPosRef.current[0];
        const targetY = 1.05; // 사장님 상체 및 서빙 쟁반 시점
        const targetZ = bossPosRef.current[2];

        // 모바일 터치 조작 관성 충돌 방지를 위해 controls 내부 상태 리셋
        if ((controlsRef.current as any).state !== -1) {
          (controlsRef.current as any).state = -1;
        }

        const newTargetX = THREE.MathUtils.lerp(prevTargetX, targetX, delta * 4.0);
        const newTargetY = THREE.MathUtils.lerp(prevTargetY, targetY, delta * 4.0);
        const newTargetZ = THREE.MathUtils.lerp(prevTargetZ, targetZ, delta * 4.0);

        // 한 단계 더 축소된 편안한 시네마틱 줌인 거리 (정면 앞 3.4m, 높이 +1.25m, 측면 오프셋 1.75m)
        const sideOffset = targetX >= 0 ? -1.75 : 1.75;
        const bossCamPos = new THREE.Vector3(
          newTargetX + sideOffset,
          newTargetY + 1.25,
          newTargetZ + 3.4
        );
        camera.position.lerp(bossCamPos, delta * 3.6);

        controlsRef.current.target.set(newTargetX, newTargetY, newTargetZ);
        controlsRef.current.update();
      } else {
        // ★ 서빙이 완료되어 사장님이 주방으로 복귀를 시작할 때, 카메라 앵글을 내 캐릭터 정면으로 자동 전환!
        if (wasBossServingRef.current) {
          wasBossServingRef.current = false;
          resetToPlayerFrontRef.current = true;
        }

        const isZoomAction = myAction === 'cheers' || myAction === 'drinking' || myAction === 'pouring';
        const isResettingFront = resetToPlayerFrontRef.current;

        // 줌업 또는 서빙 후 정면 복귀 시에는 캐릭터의 상체와 테이블에 포커스를 맞춤
        const targetX = playerPos.current[0];
        const targetY = isZoomAction || isResettingFront
          ? (currentChair ? 0.88 : 0.82)
          : (currentChair ? 0.75 : 0.7);
        const targetZ = playerPos.current[2] - (isZoomAction || isResettingFront ? 0.05 : 0.2);

        // 부드러운 타겟 보간
        const newTargetX = THREE.MathUtils.lerp(prevTargetX, targetX, delta * 5);
        const newTargetY = THREE.MathUtils.lerp(prevTargetY, targetY, delta * 5);
        const newTargetZ = THREE.MathUtils.lerp(prevTargetZ, targetZ, delta * 5);

        const deltaX = newTargetX - prevTargetX;
        const deltaY = newTargetY - prevTargetY;
        const deltaZ = newTargetZ - prevTargetZ;

        if (isZoomAction) {
          // 캐릭터가 바라보고 있는 정면 방향 벡터 계산
          const frontX = Math.sin(playerRot.current);
          const frontZ = Math.cos(playerRot.current);
          const closeUpDistance = 2.35;

          // 캐릭터의 정면 앞쪽에서 얼굴, 술잔, 테이블을 편안하게 조망하는 시네마틱 정면 카메라 좌표로 줌업
          const targetCamPos = new THREE.Vector3(
            newTargetX + frontX * closeUpDistance,
            newTargetY + 0.32,
            newTargetZ + frontZ * closeUpDistance
          );

          camera.position.lerp(targetCamPos, delta * 4);
        } else if (isResettingFront) {
          // ★ 서빙 완료 후: 캐릭터의 정면 앞쪽(얼굴과 테이블 위 새 안주를 바라보는 앵글)으로 부드럽게 복귀
          const frontX = Math.sin(playerRot.current);
          const frontZ = Math.cos(playerRot.current);
          const returnDistance = currentChair ? 2.6 : 3.0;

          const targetCamPos = new THREE.Vector3(
            newTargetX + frontX * returnDistance,
            newTargetY + (currentChair ? 0.65 : 0.85),
            newTargetZ + frontZ * returnDistance
          );

          camera.position.lerp(targetCamPos, delta * 3.5);

          // 카메라가 정면 위치에 거의 도달하면 정면 리셋 완료 처리
          if (camera.position.distanceTo(targetCamPos) < 0.15) {
            resetToPlayerFrontRef.current = false;
          }
        } else {
          // 액션 및 서빙 종료 후 사용자의 자유로운 뷰포트 유지
          camera.position.x += deltaX;
          camera.position.y += deltaY;
          camera.position.z += deltaZ;
        }

        controlsRef.current.target.set(newTargetX, newTargetY, newTargetZ);
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      {/* 분위기별 감성 안개 & 조명 */}
      <fog attach="fog" args={[moodConfig.fogColor, moodConfig.fogNear, moodConfig.fogFar]} />
      <ambientLight intensity={moodConfig.ambientIntensity} color={moodConfig.ambientColor} />
      <directionalLight
        position={moodConfig.dirLightPos}
        intensity={moodConfig.dirLightIntensity}
        color={moodConfig.dirLightColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* 포차 전면을 채우는 따뜻한 보조 조명 */}
      <pointLight position={[0, 3.2, 2.5]} color={moodConfig.pochaLightColor} intensity={moodConfig.pochaLightIntensity} distance={15} />

      {/* OrbitControls (회전 및 자유로운 줌인/줌아웃) */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        zoomSpeed={1.2}
        maxPolarAngle={Math.PI / 2 - 0.05} // 바닥 밑으로 못 내려감
        minDistance={1.2}
        maxDistance={28}
      />

      {/* 환경 & 배경 (도로 건너편 도심 야경 빌딩가 & 도로 주행 차량 & 건너편 밤의 공원 숲) */}
      <StreetEnvironment weatherMood={weatherMood} />
      <NightCityBuildings weatherMood={weatherMood} />
      <ParkEnvironment weatherMood={weatherMood} />
      <RoadTraffic />
      <RainEffect weatherMood={weatherMood} />

      {/* 포장마차 텐트 & 주방 */}
      <PochaTent weatherMood={weatherMood} />

      {/* 정감 있는 할머니 사장님 NPC (따뜻한 어묵 국물 국자로 젓기 & 위로의 말) */}
      <GrandmaBoss bossPosRef={bossPosRef} onServingChange={setIsBossServing} />

      {/* 10개의 포차 원형 테이블 (2열 5행 배치, 빨강 & 파랑 시그니처) */}
      {tables.map((table) => (
        <PochaTable
          key={table.id}
          id={table.id}
          position={table.position}
          tableColor={table.color}
          chairSlots={chairSlots.filter((c) => c.tableId === table.id)}
          onSitChair={handleSitChair}
          mySeatedChairId={currentChair?.id || null}
          servedOrder={tableServings ? tableServings[table.id] : undefined}
          isPouringAction={myAction === 'pouring'}
        />
      ))}

      {/* 내 캐릭터 (모바일/PC 어디서든 0초 즉시 렌더링) */}
      <Avatar
        nickname={myPlayer?.nickname || '조용한 소주'}
        color={myPlayer?.color || '#ecf0f1'}
        characterType={myPlayer?.characterType || 'salaryman'}
        position={playerPos.current}
        rotation={playerRot.current}
        positionRef={playerPos}
        rotationRef={playerRot}
        action={myAction}
        isSeated={!!currentChair}
        isMe={true}
        autoThought={autoThought}
      />

      {/* 다른 접속자 캐릭터들 */}
      <OtherAvatars players={otherPlayers} />
    </>
  );
};
