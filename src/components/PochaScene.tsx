import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PochaTent } from './PochaTent';
import { PochaTable } from './PochaTable';
import { StreetEnvironment } from './StreetEnvironment';
import { RainEffect } from './RainEffect';
import { Avatar } from './Avatar';
import { OtherAvatars } from './OtherAvatars';
import { GrandmaBoss } from './GrandmaBoss';
import { Player, ChairSlot, PlayerAction } from '../types';
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
}

export const PochaScene: React.FC<PochaSceneProps> = ({
  myPlayer,
  otherPlayers,
  onUpdatePlayer,
  myAction,
  setMyAction,
  currentChair,
  setCurrentChair,
}) => {
  const keys = useKeyboard();
  const playerPos = useRef<[number, number, number]>([0, 0, 0.7]);
  const playerRot = useRef<number>(Math.PI);
  const targetPos = useRef<[number, number, number] | null>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // 의자 슬롯 정의 (넓어진 포차 안 좌/우 테이블)
  const chairSlots = useMemo<ChairSlot[]>(() => {
    return [
      // 테이블 1 (좌측 테이블 [-2.4, 0, 0])
      { id: 't1_c1', tableId: 't1', position: [-2.4, 0, -0.75], rotation: 0, isOccupied: false },
      { id: 't1_c2', tableId: 't1', position: [-3.15, 0, 0], rotation: Math.PI / 2, isOccupied: false },
      { id: 't1_c3', tableId: 't1', position: [-2.4, 0, 0.75], rotation: Math.PI, isOccupied: false },
      { id: 't1_c4', tableId: 't1', position: [-1.65, 0, 0], rotation: -Math.PI / 2, isOccupied: false },

      // 테이블 2 (우측 테이블 [2.4, 0, 0])
      { id: 't2_c1', tableId: 't2', position: [2.4, 0, -0.75], rotation: 0, isOccupied: false },
      { id: 't2_c2', tableId: 't2', position: [1.65, 0, 0], rotation: Math.PI / 2, isOccupied: false },
      { id: 't2_c3', tableId: 't2', position: [2.4, 0, 0.75], rotation: Math.PI, isOccupied: false },
      { id: 't2_c4', tableId: 't2', position: [3.15, 0, 0], rotation: -Math.PI / 2, isOccupied: false },
    ];
  }, []);

  // 초기 위치 세팅
  useEffect(() => {
    if (myPlayer) {
      playerPos.current = [...myPlayer.position];
      playerRot.current = myPlayer.rotation;
    }
  }, [myPlayer?.id]);

  // 의자 클릭 착석
  const handleSitChair = (chair: ChairSlot) => {
    if (currentChair?.id === chair.id) {
      // 이미 앉아있으면 일어서기
      handleStandUp();
      return;
    }

    setCurrentChair(chair);
    setMyAction('sitting');
    playerPos.current = [chair.position[0], 0, chair.position[2]];
    playerRot.current = chair.rotation;
    targetPos.current = null;

    soundManager.playPouringSound(); // 앉을 때 기분 좋은 효과음

    onUpdatePlayer(playerPos.current, playerRot.current, 'sitting', chair.id);
  };

  const handleStandUp = () => {
    if (!currentChair) return;
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

  // 바닥 클릭 이동 (Click-to-Move)
  const handleGroundClick = (e: any) => {
    if (currentChair) {
      handleStandUp();
    }
    const pt = e.point;
    // 포차 내부 유효 이동 범위 (넓어진 포차 안에서 쾌적하게 이동)
    const clampedX = Math.max(-4.8, Math.min(4.8, pt.x));
    const clampedZ = Math.max(-2.1, Math.min(3.2, pt.z));
    targetPos.current = [clampedX, 0, clampedZ];
  };

  // 프레임 루프 (키보드 / 클릭 이동 처리 & 카메라 팔로우)
  useFrame((_, delta) => {
    let isMoving = false;
    let dx = 0;
    let dz = 0;

    // 키보드 이동
    if (keys.forward) dz -= 1;
    if (keys.backward) dz += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    if (dx !== 0 || dz !== 0) {
      if (currentChair) {
        handleStandUp();
      }
      targetPos.current = null;
      isMoving = true;

      const angle = Math.atan2(dx, dz);
      playerRot.current = angle;

      const speed = 2.8 * delta;
      playerPos.current[0] += Math.sin(angle) * speed;
      playerPos.current[2] += Math.cos(angle) * speed;

      // 범위 제약 (포차 내부)
      playerPos.current[0] = Math.max(-4.8, Math.min(4.8, playerPos.current[0]));
      playerPos.current[2] = Math.max(-2.1, Math.min(3.2, playerPos.current[2]));

      setMyAction('walking');
      onUpdatePlayer(playerPos.current, playerRot.current, 'walking', null);
    } else if (targetPos.current && !currentChair) {
      // 마우스 클릭 타겟으로 이동
      const diffX = targetPos.current[0] - playerPos.current[0];
      const diffZ = targetPos.current[2] - playerPos.current[2];
      const dist = Math.hypot(diffX, diffZ);

      if (dist > 0.15) {
        isMoving = true;
        const angle = Math.atan2(diffX, diffZ);
        playerRot.current = angle;
        const moveDist = Math.min(dist, 3.0 * delta);
        playerPos.current[0] += Math.sin(angle) * moveDist;
        playerPos.current[2] += Math.cos(angle) * moveDist;

        setMyAction('walking');
        onUpdatePlayer(playerPos.current, playerRot.current, 'walking', null);
      } else {
        targetPos.current = null;
        if (myAction === 'walking') {
          setMyAction('idle');
          onUpdatePlayer(playerPos.current, playerRot.current, 'idle', null);
        }
      }
    } else if (myAction === 'walking') {
      setMyAction('idle');
      onUpdatePlayer(playerPos.current, playerRot.current, 'idle', currentChair ? currentChair.id : null);
    }

    // 카메라 부드러운 팔로우 (카메라 위치와 타겟을 플레이어 기준으로 동기화)
    const targetCamDistY = currentChair ? 1.6 : 2.5;
    const targetCamDistZ = currentChair ? 2.4 : 4.6;

    if (controlsRef.current) {
      // 카메라 위치 팔로우
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerPos.current[0], delta * 4);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerPos.current[1] + targetCamDistY, delta * 4);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerPos.current[2] + targetCamDistZ, delta * 4);

      // 카메라 주시 타겟 팔로우
      controlsRef.current.target.x = THREE.MathUtils.lerp(
        controlsRef.current.target.x,
        playerPos.current[0],
        delta * 5
      );
      controlsRef.current.target.y = THREE.MathUtils.lerp(
        controlsRef.current.target.y,
        currentChair ? 0.75 : 0.7,
        delta * 5
      );
      controlsRef.current.target.z = THREE.MathUtils.lerp(
        controlsRef.current.target.z,
        playerPos.current[2] - 0.2,
        delta * 5
      );
      controlsRef.current.update();
    }
  });

  return (
    <>
      {/* 늦은 밤 감성 안개 & 화사하고 따뜻한 조명 */}
      <fog attach="fog" args={['#0e1117', 15, 55]} />
      <ambientLight intensity={0.9} color="#718093" />
      <directionalLight
        position={[8, 14, 10]}
        intensity={1.2}
        color="#ffeaa7"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* 포차 전면을 채우는 따뜻한 보조 조명 */}
      <pointLight position={[0, 3.2, 2.5]} color="#f39c12" intensity={2.0} distance={15} />

      {/* OrbitControls (회전 및 줌 제한) */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.05} // 바닥 밑으로 못 내려감
        minDistance={1.8}
        maxDistance={12}
      />

      {/* 환경 & 배경 */}
      <StreetEnvironment />
      <RainEffect />

      {/* 바닥 클릭 이동 감지 투명 평면 */}
      <mesh
        position={[0, 0.01, 2.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={handleGroundClick}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial />
      </mesh>

      {/* 포장마차 텐트 & 주방 */}
      <PochaTent />

      {/* 정감 있는 할머니 사장님 NPC (따뜻한 어묵 국물 국자로 젓기 & 위로의 말) */}
      <GrandmaBoss />

      {/* 테이블 1 (좌측) */}
      <PochaTable
        id="t1"
        position={[-2.4, 0, 0]}
        chairSlots={chairSlots.filter((c) => c.tableId === 't1')}
        onSitChair={handleSitChair}
        mySeatedChairId={currentChair?.id || null}
      />

      {/* 테이블 2 (우측) */}
      <PochaTable
        id="t2"
        position={[2.4, 0, 0]}
        chairSlots={chairSlots.filter((c) => c.tableId === 't2')}
        onSitChair={handleSitChair}
        mySeatedChairId={currentChair?.id || null}
      />

      {/* 내 캐릭터 */}
      {myPlayer && (
        <Avatar
          nickname={myPlayer.nickname}
          color={myPlayer.color}
          characterType={myPlayer.characterType}
          position={playerPos.current}
          rotation={playerRot.current}
          action={myAction}
          isMe={true}
        />
      )}

      {/* 다른 접속자 캐릭터들 */}
      <OtherAvatars players={otherPlayers} />
    </>
  );
};
