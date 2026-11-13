import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { PlayerAction } from '../types';

interface AvatarProps {
  nickname: string;
  color?: string; // 셔츠 색상
  characterType?: string;
  position: [number, number, number];
  rotation: number;
  action: PlayerAction;
  isMe?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  nickname,
  color = '#ecf0f1', // 기본 밝은 와이셔츠
  position,
  rotation,
  action,
  isMe = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const handRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const tieRef = useRef<THREE.Group>(null);

  // 부드러운 위치/회전 보간 및 직장인 모션
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 위치 보간
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], delta * 10);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], delta * 10);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], delta * 10);

    // 회전 보간
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation, delta * 10);

    const time = state.clock.elapsedTime;

    // 1. 퇴근길 피로하지만 편안한 발걸음 (몸 살짝 기우뚱)
    if (action === 'walking' && bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(time * 10) * 0.08;
      bodyRef.current.position.y = Math.abs(Math.sin(time * 10)) * 0.05;
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

    // 2. 한잔하기 (Cheers) 제스처
    if (action === 'cheers' && handRef.current) {
      handRef.current.position.y = 0.38 + Math.sin(time * 6) * 0.05;
      handRef.current.position.z = 0.28;
      handRef.current.rotation.x = -Math.PI / 4 + Math.sin(time * 6) * 0.2;
    } else if (action === 'pouring' && handRef.current) {
      // 소주 따르기 제스처
      handRef.current.position.y = 0.32;
      handRef.current.position.z = 0.24;
      handRef.current.rotation.z = -0.5 + Math.sin(time * 4) * 0.1;
    } else if (handRef.current) {
      handRef.current.position.y = 0.22;
      handRef.current.position.z = 0.16;
      handRef.current.rotation.x = 0;
      handRef.current.rotation.z = 0;
    }
  });

  const isSitting = action === 'sitting' || action === 'cheers' || action === 'pouring';

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* 닉네임 태그 & 내 캐릭터 표시기 */}
      <group position={[0, 1.25, 0]}>
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
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.045, 0.09, 6]} />
            <meshBasicMaterial color="#ffeaa7" />
          </mesh>
        )}
      </group>

      <group ref={bodyRef}>
        {/* 1. 슬랙스 팬츠 (다크 차콜/네이비 하의) */}
        <mesh position={[0, isSitting ? 0.25 : 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.23, isSitting ? 0.25 : 0.45, 16]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.7} />
        </mesh>

        {/* 2. 퇴근 직장인 셔츠 상체 (화이트/블루 와이셔츠) */}
        <mesh position={[0, isSitting ? 0.45 : 0.58, 0]} castShadow>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>

        {/* 셔츠 칼라 (풀어진 옷깃 디테일) */}
        <group position={[0, isSitting ? 0.62 : 0.74, 0.15]}>
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
        <group ref={tieRef} position={[0, isSitting ? 0.58 : 0.7, 0.25]}>
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
        <group position={[0, isSitting ? 0.78 : 0.9, 0]}>
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

        {/* 5. 손 & 소주잔 (액션 시 들기) */}
        <group ref={handRef} position={[0.18, isSitting ? 0.35 : 0.45, 0.16]}>
          <mesh>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#ffeaa7" />
          </mesh>
          {/* 소매 (셔츠 소매 살짝 걷어 올린 디테일) */}
          <mesh position={[0, 0.05, -0.04]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.065, 0.1, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* 잔 */}
          {(action === 'cheers' || action === 'sitting') && (
            <group position={[0, 0.08, 0.05]}>
              <mesh>
                <cylinderGeometry args={[0.025, 0.018, 0.055, 12]} />
                <meshStandardMaterial color="#dff9fb" transparent opacity={0.85} />
              </mesh>
            </group>
          )}
        </group>

        {/* 반대쪽 손 (테이블에 얹거나 주머니에 살짝 넣은 느낌) */}
        <group position={[-0.18, isSitting ? 0.35 : 0.45, 0.1]}>
          <mesh>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#ffeaa7" />
          </mesh>
          <mesh position={[0, 0.05, -0.04]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.065, 0.1, 12]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
