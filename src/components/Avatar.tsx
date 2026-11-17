import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Html } from '@react-three/drei';
import { PlayerAction } from '../types';
import { soundManager } from './AudioController';

interface AvatarProps {
  nickname: string;
  color?: string; // 셔츠 색상
  characterType?: string;
  position?: [number, number, number];
  rotation?: number;
  positionRef?: React.MutableRefObject<[number, number, number]>;
  rotationRef?: React.MutableRefObject<number>;
  action: PlayerAction;
  isSeated?: boolean; // 의자 착석 여부 (액션과 독립적으로 실제 착석 상태 유지)
  isMe?: boolean;
  autoThought?: string | null; // 오토모드 사색 독백 말풍선
  drinkId?: string; // 주문/서빙된 음료/주류 ID (예: 'bev_cola', 'bev_cider', 'soju_chamisul')
  drinkCount?: number; // 남은 술 잔 수 (8 -> 0)
  drunkLevel?: number; // 직접 지정 가능한 취기 레벨 (0.0 맨정신 ~ 1.0 완취)
}

export const Avatar: React.FC<AvatarProps> = ({
  nickname,
  color = '#ecf0f1', // 기본 밝은 와이셔츠
  position = [0, 0, 0],
  rotation = 0,
  positionRef,
  rotationRef,
  action,
  isSeated,
  isMe = false,
  autoThought = null,
  drinkId,
  drinkCount,
  drunkLevel,
}) => {
  const isBeverage = drinkId ? (drinkId.startsWith('bev_') || drinkId === 'bev_cola' || drinkId === 'bev_cider') : false;
  const isCola = drinkId === 'bev_cola';
  const isMakgeolli = drinkId === 'drink_makgeolli';
  const isAlcohol = drinkId ? !isBeverage : false;

  // 술 양에 따른 취기 진행도 (0.0: 맨정신 ~ 1.0: 완벽한 취기)
  const currentDrunkLevel = React.useMemo(() => {
    if (drunkLevel !== undefined) {
      return Math.min(1, Math.max(0, drunkLevel));
    }
    // 음료수는 취기가 오르지 않음
    if (!isAlcohol) return 0;
    if (drinkCount === undefined) return 0;
    // 8잔 기준: 남은 술의 양이 적을수록(비워갈수록) 얼굴이 붉어짐
    const consumed = Math.max(0, 8 - drinkCount);
    return Math.min(1, consumed / 8);
  }, [drunkLevel, isAlcohol, drinkCount]);

  // 술 양에 따른 얼굴 및 피부톤 색상 보간
  const { skinColor, blushColor, blushOpacity, blushScale, noseFlushOpacity } = React.useMemo(() => {
    const level = currentDrunkLevel;
    // 1. 기본 뽀얀 살구빛 피부톤 (#ffeaa7) -> 기분 좋게 상기된 포차 홍조 톤 (#ff9e90)
    const baseColor = new THREE.Color('#ffeaa7');
    const flushedColor = new THREE.Color('#ff9e90');
    const skin = baseColor.clone().lerp(flushedColor, level);

    // 2. 양 볼 볼터치: 연한 살구 핑크 (#ffb8b8) -> 진한 홍조 핑크 (#ff4757)
    const baseBlush = new THREE.Color('#ffb8b8');
    const fullBlush = new THREE.Color('#ff4757');
    const blush = baseBlush.clone().lerp(fullBlush, level);

    return {
      skinColor: '#' + skin.getHexString(),
      blushColor: '#' + blush.getHexString(),
      blushOpacity: 0.2 + level * 0.7, // 0.2 -> 0.9로 점점 짙어짐
      blushScale: 1.0 + level * 0.45, // 1.0 -> 1.45배로 넓게 번짐
      noseFlushOpacity: level > 0.15 ? (level - 0.15) * 0.85 : 0, // 콧등 발그레함
    };
  }, [currentDrunkLevel]);

  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<HTMLElement>(typeof document !== 'undefined' ? document.body : (null as any));

  useEffect(() => {
    if (typeof document !== 'undefined') {
      portalRef.current = document.body;
    }
  }, []);
  const handRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const tieRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const lastStepTimeRef = useRef<number>(0);

  // 착석 여부 결정 (명시적인 isSeated가 있으면 우선, 없을 시 액션이 sitting일 때만 true)
  const isSitting = isSeated !== undefined ? isSeated : action === 'sitting';

  // 부드러운 위치/회전 보간 및 직장인 모션
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 내 캐릭터는 React re-render와 무관하게 positionRef와 rotationRef를 매 프레임 직접 읽어 즉각 회전!
    if (isMe) {
      const curX = positionRef ? positionRef.current[0] : position[0];
      const curY = positionRef ? positionRef.current[1] : position[1];
      const curZ = positionRef ? positionRef.current[2] : position[2];
      const curRot = rotationRef ? rotationRef.current : rotation;

      groupRef.current.position.set(curX, curY, curZ);
      groupRef.current.rotation.y = curRot;
    } else {
      // 다른 원격 플레이어들은 네트워크 패킷 위치 보간
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], delta * 10);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], delta * 10);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], delta * 10);

      // 최단 각도 보간 (Shortest angular difference - 270도 역회전 방지)
      const diff = Math.atan2(
        Math.sin(rotation - groupRef.current.rotation.y),
        Math.cos(rotation - groupRef.current.rotation.y)
      );
      groupRef.current.rotation.y += diff * Math.min(1, delta * 15);
    }

    const time = state.clock.elapsedTime;

    // 1. 퇴근길 피로하지만 편안한 발걸음 (몸 살짝 기우뚱) + 날씨별 발자국 효과음
    if (action === 'walking' && bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(time * 10) * 0.08;
      bodyRef.current.position.y = Math.abs(Math.sin(time * 10)) * 0.05;

      // 걷는 동안 발자국 소리 (눈 오는 날엔 뽀드득, 비/맑은 날엔 사각사각)
      if (isMe && time - lastStepTimeRef.current > 0.35) {
        lastStepTimeRef.current = time;
        soundManager.playPlayerFootstep();
      }

      // 걷는 동안 느슨한 넥타이가 살랑살랑 흔들림
      if (tieRef.current) {
        tieRef.current.rotation.z = Math.sin(time * 10) * 0.15;
      }
    } else if (bodyRef.current) {
      bodyRef.current.rotation.z = 0;
      bodyRef.current.position.y = 0;
      if (tieRef.current) {
        tieRef.current.rotation.z = Math.sin(time * 2) * 0.04;
      }
    }

    // 2. 음주 및 식사 제스처 (착석 상태와 기립 상태에 맞춘 정밀 손 & 고개 모션)
    const baseHandY = isSitting ? 0.72 : 0.45;
    const baseHandZ = isSitting ? 0.22 : 0.16;

    if (action === 'pouring') {
      // ★ 1. 술 따르기: 소주병을 테이블 위 잔 쪽으로 앞으로 뻗으며 55도 기울여 쪼르르 따르는 모션
      if (handRef.current) {
        handRef.current.position.set(0.12, baseHandY + 0.14, baseHandZ + 0.14);
        // 병을 앞/옆으로 기울이고 따를 때 살짝 꿀렁거리는 디테일
        handRef.current.rotation.set(-0.65, 0.2, -0.78 + Math.sin(time * 8) * 0.05);
      }
      if (leftHandRef.current) {
        // 왼손: 정중하게 오른쪽 손목/팔꿈치 아래를 받쳐주는 한국 포차 예절 자세
        leftHandRef.current.position.set(0.04, baseHandY + 0.08, baseHandZ + 0.06);
        leftHandRef.current.rotation.set(-0.35, -0.4, 0.5);
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0.16; // 잔을 지긋이 바라보는 시선
      }
    } else if (action === 'eating') {
      // ★ 2. 안주 먹기: 젓가락이 테이블 위 안주 접시로 내려갔다가 입으로 올라가는 실감 나는 포물선 궤적
      const cycleTime = 2.4;
      const progress = (time % cycleTime) / cycleTime; // 0 ~ 1

      let handX = 0.16;
      let handY = baseHandY;
      let handZ = baseHandZ;
      let rotX = 0;
      let rotZ = 0;

      if (progress < 0.42) {
        // [구간 1: 테이블 안주로 가기] y 낮아지고 z 앞쪽으로 안주 집으러 감
        const subP = Math.sin((progress / 0.42) * Math.PI);
        handX = THREE.MathUtils.lerp(0.18, 0.1, subP);
        handY = THREE.MathUtils.lerp(baseHandY, baseHandY - 0.06, subP);
        handZ = THREE.MathUtils.lerp(baseHandZ, baseHandZ + 0.18, subP);
        rotX = THREE.MathUtils.lerp(0, 0.52, subP); // 젓가락 끝이 아래 접시를 향함
        rotZ = THREE.MathUtils.lerp(0, -0.25, subP);

        if (headRef.current) {
          headRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.18, subP); // 안주 응시
        }
      } else if (progress < 0.75) {
        // [구간 2: 입으로 쏙 가져오기] y 입술 높이로 올라오고 z 입 쪽으로 당김
        const subP = Math.sin(((progress - 0.42) / 0.33) * Math.PI);
        handX = THREE.MathUtils.lerp(0.18, 0.05, subP);
        handY = THREE.MathUtils.lerp(baseHandY, baseHandY + 0.28, subP);
        handZ = THREE.MathUtils.lerp(baseHandZ, baseHandZ - 0.04, subP);
        rotX = THREE.MathUtils.lerp(0, -1.05, subP); // 젓가락 끝이 입술 쪽으로 쏙!
        rotZ = THREE.MathUtils.lerp(0, 0.12, subP);

        if (headRef.current) {
          // 입으로 쏙 들어갈 때 고개를 살짝 맞이하듯 끄덕임
          headRef.current.rotation.x = THREE.MathUtils.lerp(0.12, 0.02, (progress - 0.42) / 0.33);
        }
      } else {
        // [구간 3: 오물오물 씹으며 행복해하기]
        handX = 0.18;
        handY = baseHandY;
        handZ = baseHandZ;
        rotX = 0;
        rotZ = 0;

        if (headRef.current) {
          headRef.current.rotation.x = 0.08 + Math.sin(time * 12) * 0.06;
        }
      }

      if (handRef.current) {
        handRef.current.position.set(handX, handY, handZ);
        handRef.current.rotation.set(rotX, 0, rotZ);
      }
      if (leftHandRef.current) {
        leftHandRef.current.position.set(-0.18, baseHandY, baseHandZ);
        leftHandRef.current.rotation.set(0, 0, 0);
      }
    } else if (action === 'drinking') {
      // ★ 3. 혼술 사색: 잔을 입술로 가져가서 홀짝홀짝 털어 넣는 생생한 모션
      if (handRef.current) {
        handRef.current.position.set(0.08, baseHandY + 0.26 + Math.sin(time * 6) * 0.02, baseHandZ - 0.04);
        handRef.current.rotation.set(-1.15 + Math.sin(time * 6) * 0.08, 0, -0.3);
      }
      if (headRef.current) {
        // 소주가 목구멍으로 넘어갈 때 살짝 뒤로 젖혀지는 고개
        headRef.current.rotation.x = -0.16 + Math.sin(time * 6) * 0.04;
      }
      if (leftHandRef.current) {
        leftHandRef.current.position.set(-0.18, baseHandY, baseHandZ);
        leftHandRef.current.rotation.set(0, 0, 0);
      }
    } else if (action === 'cheers') {
      // 4. 술잔을 앞으로 들고 짠! 하는 제스처
      if (handRef.current) {
        handRef.current.position.set(0.12, baseHandY + 0.18 + Math.sin(time * 6) * 0.03, baseHandZ + 0.12);
        handRef.current.rotation.set(-Math.PI / 4 + Math.sin(time * 6) * 0.15, 0, 0);
      }
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(time * 1.5) * 0.02;
      }
      if (leftHandRef.current) {
        leftHandRef.current.position.set(-0.18, baseHandY, baseHandZ);
        leftHandRef.current.rotation.set(0, 0, 0);
      }
    } else {
      // 5. 평상시 자세
      if (handRef.current) {
        handRef.current.position.set(0.18, baseHandY, baseHandZ);
        handRef.current.rotation.set(0, 0, 0);
      }
      if (leftHandRef.current) {
        leftHandRef.current.position.set(-0.18, baseHandY, baseHandZ);
        leftHandRef.current.rotation.set(0, 0, 0);
      }
      if (headRef.current) {
        // 평상시 자연스러운 숨쉬기 및 사색 끄덕임
        headRef.current.rotation.x = Math.sin(time * 1.5) * 0.02;
      }
    }

    // 6. 술 양(취기)에 따른 눈알 골뱅이 회전 애니메이션
    if (currentDrunkLevel >= 0.25) {
      // 술을 많이 마실수록 회전 속도가 점점 빨라짐 (초당 2.0 ~ 7.5 rad)
      const spinSpeed = 2.0 + currentDrunkLevel * 5.5;
      if (leftEyeRef.current) {
        leftEyeRef.current.rotation.z -= delta * spinSpeed;
      }
      if (rightEyeRef.current) {
        // 우측 눈은 반대 방향으로 회전하여 대칭적 소용돌이 연출
        rightEyeRef.current.rotation.z += delta * spinSpeed;
      }
    } else {
      if (leftEyeRef.current) leftEyeRef.current.rotation.z = -0.1;
      if (rightEyeRef.current) rightEyeRef.current.rotation.z = -0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* 닉네임 태그 & 내 캐릭터 표시기 (Billboard: 캐릭터 회전과 무관하게 항상 카메라 정면을 응시하여 뒤집힘 방지) */}
      <Billboard
        position={[0, isSitting ? 1.38 : 1.25, 0]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={0.16}
          color={isMe ? '#ffeaa7' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#2d3436"
        >
          {nickname} {isMe ? '(나)' : ''}
        </Text>
        {isMe && (
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.045, 0.09, 6]} />
            <meshBasicMaterial color="#ffeaa7" />
          </mesh>
        )}

        {/* 오토모드 혼술 사색 독백 풍선글 (상단 바 위에 노출되도록 Html 포털 렌더링) */}
        {isMe && autoThought && (
          <Html
            position={[0, 0.48, 0]}
            center
            portal={portalRef}
            zIndexRange={[100, 40]}
            style={{
              pointerEvents: 'none',
              zIndex: 40,
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                backgroundColor: 'rgba(26, 32, 44, 0.94)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255, 234, 167, 0.45)',
                borderRadius: '16px',
                color: '#ffeaa7',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontSize: '14px' }}>💭</span>
              <span>{autoThought}</span>
              {/* 말풍선 아래 꼬리표 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid rgba(26, 32, 44, 0.94)',
                }}
              />
            </div>
          </Html>
        )}
      </Billboard>

      <group ref={bodyRef}>
        {/* 1. 슬랙스 팬츠 (의자 방석 0.45m 위에 완벽히 착석) */}
        <mesh position={[0, isSitting ? 0.54 : 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.23, isSitting ? 0.22 : 0.45, 16]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.7} />
        </mesh>

        {/* 2. 퇴근 직장인 셔츠 상체 (화이트/블루 와이셔츠) */}
        <mesh position={[0, isSitting ? 0.72 : 0.58, 0]} castShadow>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>

        {/* 셔츠 칼라 (풀어진 옷깃 디테일) */}
        <group position={[0, isSitting ? 0.88 : 0.74, 0.15]}>
          {/* 좌측 옷깃 */}
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0.2, -0.3]}>
            <boxGeometry args={[0.08, 0.04, 0.04]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* 우측 옷깃 */}
          <mesh position={[0.08, 0, 0]} rotation={[0, -0.2, 0.3]}>
            <boxGeometry args={[0.08, 0.04, 0.04]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>

        {/* 3. ★ 핵심: 느슨하게 푼 넥타이 (퇴근 후 혼술의 상징) */}
        <group ref={tieRef} position={[0, isSitting ? 0.84 : 0.7, 0.25]}>
          {/* 살짝 느슨하게 내려온 넥타이 매듭 */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.035, 0.05, 6]} />
            <meshStandardMaterial color="#c0392b" roughness={0.5} />
          </mesh>
          {/* 아래로 축 늘어진 넥타이 본체 */}
          <mesh position={[0, -0.12, 0.01]} rotation={[-0.08, 0, 0.05]}>
            <boxGeometry args={[0.045, 0.22, 0.015]} />
            <meshStandardMaterial color="#c0392b" roughness={0.5} />
          </mesh>
          {/* 넥타이 끝 삼각 팁 */}
          <mesh position={[0, -0.24, 0.01]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.024, 0.04, 4]} />
            <meshStandardMaterial color="#c0392b" roughness={0.5} />
          </mesh>
        </group>

        {/* 4. 직장인 얼굴 & 단정한 헤어 */}
        <group ref={headRef} position={[0, isSitting ? 1.04 : 0.9, 0]}>
          {/* 얼굴 (술 양에 따라 맨정신 뽀얀 톤 -> 취기 오른 붉은 홍조 톤으로 자연스럽게 변화) */}
          <mesh castShadow>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>

          {/* 단정한 가르마 헤어스타일 (차콜 블랙) */}
          <mesh position={[0, 0.06, -0.04]} scale={[1.04, 1.05, 1.08]}>
            <sphereGeometry args={[0.23, 20, 20]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>
          {/* 앞머리 가르마 볼륨 */}
          <mesh position={[0.04, 0.16, 0.12]} rotation={[0.2, 0, -0.2]}>
            <boxGeometry args={[0.18, 0.08, 0.12]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>

          {/* 안경 (지적인 직장인 둥근 메탈 안경) */}
          <group position={[0, 0.02, 0.21]}>
            {/* 좌측 안경테 */}
            <mesh position={[-0.07, 0, 0]}>
              <torusGeometry args={[0.032, 0.005, 8, 16]} />
              <meshStandardMaterial color="#636e72" metalness={0.8} />
            </mesh>
            {/* 우측 안경테 */}
            <mesh position={[0.07, 0, 0]}>
              <torusGeometry args={[0.032, 0.005, 8, 16]} />
              <meshStandardMaterial color="#636e72" metalness={0.8} />
            </mesh>
            {/* 안경 브릿지 */}
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.04, 0.006, 0.006]} />
              <meshStandardMaterial color="#636e72" metalness={0.8} />
            </mesh>
          </group>

          {/* 술 양에 따른 눈알 표현: 맨정신일 땐 차분한 미소 눈, 술 마실수록 골뱅이 눈으로 뱅글뱅글 회전 */}
          {/* 좌측 눈 */}
          <group ref={leftEyeRef} position={[-0.07, 0.01, 0.21]}>
            {currentDrunkLevel < 0.25 ? (
              /* 맨정신 (0~2잔): 차분하고 편안한 미소 눈 */
              <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[0.016, 0.004, 8, 12, Math.PI]} />
                <meshBasicMaterial color="#2d3436" />
              </mesh>
            ) : (
              /* 취기 상태 (3잔 이상): 만화 속 골뱅이 눈 (@_@) */
              <group scale={[0.9 + currentDrunkLevel * 0.35, 0.9 + currentDrunkLevel * 0.35, 1]}>
                {/* 1단 내부 소용돌이 */}
                <mesh position={[0, 0, 0]}>
                  <torusGeometry args={[0.0055, 0.0022, 8, 16, Math.PI]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
                {/* 2단 중간 소용돌이 */}
                <mesh position={[0.0028, 0, 0]} rotation={[0, 0, Math.PI]}>
                  <torusGeometry args={[0.01, 0.0022, 8, 16, Math.PI]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
                {/* 3단 외부 소용돌이 */}
                <mesh position={[0, 0, 0]}>
                  <torusGeometry args={[0.015, 0.0022, 8, 16, Math.PI * 1.3]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
                {/* 중심 핵심 점 */}
                <mesh position={[0, 0, 0]}>
                  <sphereGeometry args={[0.003, 8, 8]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
              </group>
            )}
          </group>

          {/* 우측 눈 */}
          <group ref={rightEyeRef} position={[0.07, 0.01, 0.21]}>
            {currentDrunkLevel < 0.25 ? (
              /* 맨정신 (0~2잔): 차분하고 편안한 미소 눈 */
              <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[0.016, 0.004, 8, 12, Math.PI]} />
                <meshBasicMaterial color="#2d3436" />
              </mesh>
            ) : (
              /* 취기 상태 (3잔 이상): 만화 속 골뱅이 눈 (@_@) */
              <group scale={[0.9 + currentDrunkLevel * 0.35, 0.9 + currentDrunkLevel * 0.35, 1]}>
                {/* 1단 내부 소용돌이 */}
                <mesh position={[0, 0, 0]}>
                  <torusGeometry args={[0.0055, 0.0022, 8, 16, Math.PI]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
                {/* 2단 중간 소용돌이 */}
                <mesh position={[0.0028, 0, 0]} rotation={[0, 0, Math.PI]}>
                  <torusGeometry args={[0.01, 0.0022, 8, 16, Math.PI]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
                {/* 3단 외부 소용돌이 */}
                <mesh position={[0, 0, 0]}>
                  <torusGeometry args={[0.015, 0.0022, 8, 16, Math.PI * 1.3]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
                {/* 중심 핵심 점 */}
                <mesh position={[0, 0, 0]}>
                  <sphereGeometry args={[0.003, 8, 8]} />
                  <meshBasicMaterial color="#2d3436" />
                </mesh>
              </group>
            )}
          </group>

          {/* 술 양에 따라 발그레하게 번지는 양 볼 볼터치 (연분홍 -> 진한 포차 홍조) */}
          <mesh position={[-0.12, -0.06, 0.18]} rotation={[0, -0.2, 0]} scale={[blushScale, blushScale, 1]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial color={blushColor} transparent opacity={blushOpacity} />
          </mesh>
          <mesh position={[0.12, -0.06, 0.18]} rotation={[0, 0.2, 0]} scale={[blushScale, blushScale, 1]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial color={blushColor} transparent opacity={blushOpacity} />
          </mesh>

          {/* 취기가 오를 때 코끝도 살짝 발그레해지는 디테일 */}
          {noseFlushOpacity > 0 && (
            <mesh position={[0, -0.02, 0.218]}>
              <circleGeometry args={[0.016, 12]} />
              <meshBasicMaterial color={blushColor} transparent opacity={noseFlushOpacity} />
            </mesh>
          )}
        </group>

        {/* 5. 오른손 & 단 하나의 소주잔 (손 위에 컵처럼 서 있던 착시 소매를 어깨-팔 연결 구조로 완벽 교정) */}
        <group ref={handRef} position={[0.18, isSitting ? 0.72 : 0.45, isSitting ? 0.22 : 0.16]}>
          {/* 손바닥/주먹 */}
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>

          {/* 셔츠 팔/소매 (손 위가 아니라 어깨 쪽에서 손목으로 자연스럽게 내려오는 팔) */}
          <mesh position={[0.02, 0.08, -0.08]} rotation={[-0.7, 0.2, -0.2]}>
            <cylinderGeometry args={[0.05, 0.055, 0.18, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>

          {/* A. 음료/술 따르기 (action === 'pouring'): 음료일 때는 캔, 주류일 때는 초록 소주병 */}
          {action === 'pouring' && (
            <group position={[0, 0.08, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              {isBeverage ? (
                /* 음료 캔 (콜라: 빨강, 사이다: 청록) */
                <group>
                  <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.032, 0.032, 0.12, 16]} />
                    <meshStandardMaterial color={isCola ? '#d63031' : '#00b894'} roughness={0.3} metalness={0.4} />
                  </mesh>
                  {/* 상단 알루미늄 림 및 캔 뚜껑 */}
                  <mesh position={[0, 0.061, 0]}>
                    <cylinderGeometry args={[0.03, 0.031, 0.006, 16]} />
                    <meshStandardMaterial color="#dfe6e9" metalness={0.9} roughness={0.2} />
                  </mesh>
                  {/* 캔 따개 탭 */}
                  <mesh position={[0.008, 0.064, 0]}>
                    <boxGeometry args={[0.012, 0.002, 0.016]} />
                    <meshStandardMaterial color="#b2bec3" metalness={0.9} />
                  </mesh>
                  {/* 캔 중앙 브랜드 라벨 띠 */}
                  <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.0323, 0.0323, 0.04, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.4} />
                  </mesh>
                </group>
              ) : (
                /* 주류 병 (막걸리일 때는 아이보리 생막걸리병, 그 외에는 초록 소주병) */
                <group>
                  <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[isMakgeolli ? 0.034 : 0.03, isMakgeolli ? 0.036 : 0.034, isMakgeolli ? 0.16 : 0.15, 16]} />
                    <meshStandardMaterial
                      color={isMakgeolli ? '#f8f9fa' : '#00a86b'}
                      roughness={isMakgeolli ? 0.4 : 0.15}
                      metalness={isMakgeolli ? 0.05 : 0.1}
                      transparent={!isMakgeolli}
                      opacity={isMakgeolli ? 1.0 : 0.92}
                    />
                  </mesh>
                  {/* 병목 */}
                  <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[isMakgeolli ? 0.015 : 0.012, 0.026, 0.055, 16]} />
                    <meshStandardMaterial
                      color={isMakgeolli ? '#f8f9fa' : '#00a86b'}
                      roughness={isMakgeolli ? 0.4 : 0.15}
                      transparent={!isMakgeolli}
                      opacity={isMakgeolli ? 1.0 : 0.92}
                    />
                  </mesh>
                  {/* 병 주둥이 & 뚜껑 */}
                  <mesh position={[0, 0.132, 0]}>
                    <cylinderGeometry args={[0.014, 0.014, 0.01, 12]} />
                    <meshStandardMaterial color="#27ae60" metalness={0.7} />
                  </mesh>
                  {/* 사각 라벨 */}
                  <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.06, 16]} />
                    <meshStandardMaterial color={isMakgeolli ? '#f1c40f' : '#ffffff'} roughness={0.4} />
                  </mesh>
                </group>
              )}
            </group>
          )}

          {/* B. 마시기 & 착석 (drinking, cheers, 평상시): 음료일 때는 얼음 빨대 컵, 주류일 때는 소주잔 / 막걸리 사발 */}
          {(action === 'cheers' || action === 'drinking' || (isSitting && action !== 'eating' && action !== 'pouring')) && (
            <group position={[0, 0.04, 0.05]}>
              {isBeverage ? (
                /* 시원한 얼음 빨대 음료컵 */
                <group>
                  {/* 투명 컵 본체 */}
                  <mesh>
                    <cylinderGeometry args={[0.032, 0.024, 0.075, 16]} />
                    <meshStandardMaterial
                      color="#eaf2f8"
                      transparent
                      opacity={0.45}
                      roughness={0.1}
                      metalness={0.1}
                    />
                  </mesh>
                  {/* 컵 속 음료 액체 (콜라: 진한 갈색 #2c1a0e, 사이다: 맑은 탄산수 #dff9fb) */}
                  <mesh position={[0, -0.005, 0]}>
                    <cylinderGeometry args={[0.03, 0.022, 0.064, 16]} />
                    <meshStandardMaterial
                      color={isCola ? '#2c1a0e' : '#dff9fb'}
                      transparent
                      opacity={isCola ? 0.95 : 0.75}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* 동동 뜬 각얼음 큐브 2개 */}
                  <mesh position={[-0.008, 0.018, 0.006]} rotation={[0.2, 0.4, 0]}>
                    <boxGeometry args={[0.014, 0.014, 0.014]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.75} roughness={0.1} />
                  </mesh>
                  <mesh position={[0.008, 0.02, -0.006]} rotation={[0.5, 0.1, 0.3]}>
                    <boxGeometry args={[0.013, 0.013, 0.013]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.75} roughness={0.1} />
                  </mesh>
                  {/* 빨대 (Straw) */}
                  <mesh position={[0.01, 0.028, 0.004]} rotation={[0.15, 0, -0.25]}>
                    <cylinderGeometry args={[0.0028, 0.0028, 0.10, 8]} />
                    <meshStandardMaterial color="#ff7675" roughness={0.3} />
                  </mesh>
                </group>
              ) : isMakgeolli ? (
                /* 황금 양은 막걸리 사발 */
                <group>
                  <mesh>
                    <cylinderGeometry args={[0.032, 0.018, 0.038, 16]} />
                    <meshStandardMaterial
                      color="#e5a93b"
                      metalness={0.65}
                      roughness={0.3}
                    />
                  </mesh>
                  {/* 뽀얀 쌀 막걸리 액체 */}
                  <mesh position={[0, 0.01, 0]}>
                    <cylinderGeometry args={[0.029, 0.017, 0.016, 14]} />
                    <meshStandardMaterial color="#fcfcfc" roughness={0.6} />
                  </mesh>
                </group>
              ) : (
                /* 소주잔 */
                <mesh>
                  <cylinderGeometry args={[0.024, 0.018, 0.05, 16]} />
                  <meshStandardMaterial
                    color="#dff9fb"
                    transparent
                    opacity={0.8}
                    roughness={0.1}
                    metalness={0.2}
                  />
                </mesh>
              )}
            </group>
          )}

          {/* C. 안주 먹기 (action === 'eating'): 오른손 젓가락 & 끝에 콕 집힌 맛있는 안주 조각 */}
          {action === 'eating' && (
            <group position={[0, 0.06, 0.06]} rotation={[-0.4, 0.2, 0]}>
              <mesh position={[-0.008, 0, 0]}>
                <cylinderGeometry args={[0.003, 0.002, 0.18, 6]} />
                <meshStandardMaterial color="#dfe6e9" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[0.008, 0, 0]}>
                <cylinderGeometry args={[0.003, 0.002, 0.18, 6]} />
                <meshStandardMaterial color="#dfe6e9" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* 젓가락 끝에 콕 집힌 빨간 포차 안주 조각 (접시에서 입으로 쏙 배달되는 실물) */}
              <mesh position={[0, -0.09, 0]}>
                <boxGeometry args={[0.018, 0.016, 0.018]} />
                <meshStandardMaterial color="#c0392b" roughness={0.35} />
              </mesh>
            </group>
          )}
        </group>

        {/* 6. 왼손 (술 따를 때 정중하게 받치기 / 평상시 테이블 짚기) */}
        <group ref={leftHandRef} position={[-0.18, isSitting ? 0.72 : 0.45, isSitting ? 0.22 : 0.1]}>
          {/* 손바닥/주먹 */}
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>

          {/* 셔츠 팔/소매 (손 위가 아니라 어깨 쪽에서 손목으로 자연스럽게 내려오는 팔) */}
          <mesh position={[-0.02, 0.08, -0.08]} rotation={[-0.7, -0.2, 0.2]}>
            <cylinderGeometry args={[0.05, 0.055, 0.18, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
