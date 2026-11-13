import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
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
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const handRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const tieRef = useRef<THREE.Group>(null);
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

        {/* 오토모드 혼술 사색 독백 말풍선 */}
        {isMe && autoThought && (
          <group position={[0, 0.42, 0]}>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[Math.max(1.4, autoThought.length * 0.11), 0.28]} />
              <meshBasicMaterial color="#1e272e" transparent opacity={0.88} />
            </mesh>
            <Text
              fontSize={0.11}
              color="#ffeaa7"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.015}
              outlineColor="#000000"
            >
              💭 {autoThought}
            </Text>
          </group>
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
          {/* 얼굴 */}
          <mesh castShadow>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color="#ffeaa7" roughness={0.4} />
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

          {/* 피로를 잊고 편안해진 눈 (차분한 미소 눈) */}
          <mesh position={[-0.07, 0.01, 0.21]} rotation={[0, 0, -0.1]}>
            <torusGeometry args={[0.016, 0.004, 8, 12, Math.PI]} />
            <meshBasicMaterial color="#2d3436" />
          </mesh>
          <mesh position={[0.07, 0.01, 0.21]} rotation={[0, 0, -0.1]}>
            <torusGeometry args={[0.016, 0.004, 8, 12, Math.PI]} />
            <meshBasicMaterial color="#2d3436" />
          </mesh>

          {/* 소주 한잔에 은은해진 핑크빛 볼터치 */}
          <mesh position={[-0.12, -0.06, 0.18]} rotation={[0, -0.2, 0]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial color="#ff7675" transparent opacity={0.65} />
          </mesh>
          <mesh position={[0.12, -0.06, 0.18]} rotation={[0, 0.2, 0]}>
            <circleGeometry args={[0.035, 12]} />
            <meshBasicMaterial color="#ff7675" transparent opacity={0.65} />
          </mesh>
        </group>

        {/* 5. 오른손 & 단 하나의 소주잔 (손 위에 컵처럼 서 있던 착시 소매를 어깨-팔 연결 구조로 완벽 교정) */}
        <group ref={handRef} position={[0.18, isSitting ? 0.72 : 0.45, isSitting ? 0.22 : 0.16]}>
          {/* 손바닥/주먹 */}
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#ffeaa7" roughness={0.4} />
          </mesh>

          {/* 셔츠 팔/소매 (손 위가 아니라 어깨 쪽에서 손목으로 자연스럽게 내려오는 팔) */}
          <mesh position={[0.02, 0.08, -0.08]} rotation={[-0.7, 0.2, -0.2]}>
            <cylinderGeometry args={[0.05, 0.055, 0.18, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>

          {/* A. 술 따르기 (action === 'pouring'): 오른손에 쥐어진 초록 소주병 */}
          {action === 'pouring' && (
            <group position={[0, 0.08, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              {/* 초록 소주병 본체 */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.034, 0.15, 16]} />
                <meshStandardMaterial color="#00a86b" roughness={0.15} metalness={0.1} transparent opacity={0.92} />
              </mesh>
              {/* 병목 */}
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.012, 0.026, 0.055, 16]} />
                <meshStandardMaterial color="#00a86b" roughness={0.15} transparent opacity={0.92} />
              </mesh>
              {/* 병 주둥이 & 뚜껑 */}
              <mesh position={[0, 0.132, 0]}>
                <cylinderGeometry args={[0.013, 0.013, 0.01, 12]} />
                <meshStandardMaterial color="#27ae60" metalness={0.7} />
              </mesh>
              {/* 하얀 사각 소주 라벨 */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.033, 0.033, 0.06, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
            </group>
          )}

          {/* B. 술 마시기 & 착석 (drinking, cheers, 평상시): 오른손 소주잔 */}
          {(action === 'cheers' || action === 'drinking' || (isSitting && action !== 'eating' && action !== 'pouring')) && (
            <group position={[0, 0.04, 0.05]}>
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
            <meshStandardMaterial color="#ffeaa7" roughness={0.4} />
          </mesh>

          {/* 셔츠 팔/소매 (손 위가 아니라 어깨 쪽에서 손목으로 자연스럽게 내려오는 팔) */}
          <mesh position={[-0.02, 0.08, -0.08]} rotation={[-0.7, -0.2, 0.2]}>
            <cylinderGeometry args={[0.05, 0.055, 0.18, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* 내 캐릭터 전용 소프트 스포트라이트 (모바일 및 어두운 야경에서도 캐릭터가 묻히지 않고 또렷하게 보이도록 비추는 감성 조명) */}
      {isMe && (
        <pointLight
          position={[0, 1.8, 0.6]}
          color="#fff6e5"
          intensity={1.8}
          distance={4.5}
          decay={1.8}
        />
      )}
    </group>
  );
};
