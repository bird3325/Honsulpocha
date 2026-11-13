import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

export const StreetEnvironment: React.FC = () => {
  return (
    <group>
      {/* 1. 비에 젖은 밤 골목 아스팔트 바닥 (물기 반사감 연출) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[45, 45]} />
        <meshStandardMaterial
          color="#121417"
          roughness={0.25} // 물기 머금은 촉촉한 바닥
          metalness={0.3}
        />
      </mesh>

      {/* 2. 도로 노란색 점선 / 골목 라인 */}
      <mesh position={[0, 0.005, 7.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 25]} />
        <meshStandardMaterial color="#f1c40f" roughness={0.6} />
      </mesh>

      {/* 3. 보도블록 턱 */}
      <mesh position={[-6.5, 0.1, 0]} receiveShadow>
        <boxGeometry args={[4, 0.2, 35]} />
        <meshStandardMaterial color="#34495e" roughness={0.8} />
      </mesh>
      <mesh position={[6.5, 0.1, 0]} receiveShadow>
        <boxGeometry args={[4, 0.2, 35]} />
        <meshStandardMaterial color="#34495e" roughness={0.8} />
      </mesh>

      {/* 4. 감성 전봇대 및 전선 */}
      <group position={[-4.5, 0, 4]}>
        {/* 콘크리트 전봇대 기둥 */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 7, 16]} />
          <meshStandardMaterial color="#7f8c8d" roughness={0.9} />
        </mesh>
        {/* 변압기 통 */}
        <mesh position={[0.25, 5.2, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.8, 12]} />
          <meshStandardMaterial color="#57606f" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* 가로등 암 */}
        <mesh position={[0.6, 6.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
        {/* 주황색 밤 골목 가로등 불빛 */}
        <pointLight
          position={[1.2, 6.0, 0]}
          color="#ffbe76"
          intensity={2.2}
          distance={16}
          decay={2}
          castShadow
        />
        <mesh position={[1.1, 6.1, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#ffeaa7" />
        </mesh>
      </group>

      {/* 5. 포장마차 입구 네온사인 간판 ("잠깐 쉬어가요" & "혼술포차") */}
      <group position={[0, 3.2, 3.0]}>
        {/* 간판 지지 프레임 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.2, 0.8, 0.1]} />
          <meshStandardMaterial color="#222f3e" roughness={0.7} />
        </mesh>

        {/* 네온 한글 텍스트 */}
        <Text
          position={[0, 0.12, 0.07]}
          fontSize={0.3}
          color="#ff7675"
          anchorX="center"
          anchorY="middle"
        >
          잠깐 쉬어가요
        </Text>
        <Text
          position={[0, -0.18, 0.07]}
          fontSize={0.2}
          color="#74b9ff"
          anchorX="center"
          anchorY="middle"
        >
          혼 술 포 차
        </Text>

        {/* 간판 네온 은은한 발광 광원 */}
        <pointLight position={[0, 0, 0.3]} color="#ff7675" intensity={1.2} distance={4} />
      </group>

      {/* 6. 먼 배경의 어두운 도시 건물 실루엣들 */}
      {[-12, -8, 8, 12].map((x, i) => (
        <group key={i} position={[x, 0, -10 - (i % 2) * 4]}>
          <mesh position={[0, 5 + (i % 3) * 2, 0]}>
            <boxGeometry args={[4, 10 + (i % 3) * 4, 3]} />
            <meshStandardMaterial color="#192a56" roughness={0.9} />
          </mesh>
          {/* 건물 창문 불빛 몇 개 */}
          {[1, 3, 5].map((h, j) => (
            <mesh key={j} position={[(j - 1) * 0.8, h, 1.51]}>
              <planeGeometry args={[0.4, 0.6]} />
              <meshBasicMaterial color={j === 1 ? '#ffeaa7' : '#273c75'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
