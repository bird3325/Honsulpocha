import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export const GrandmaBoss: React.FC = () => {
  const ladleRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const [dialogueIdx, setDialogueIdx] = useState(0);

  // 사장님의 따뜻한 위로 대사 목록
  const DIALOGUES = [
    '오늘 하루도 참 고생 많았어요. 따뜻한 국물 마셔요.',
    '천천히, 편하게 쉬다 가요.',
    '여기선 아무 걱정 말고 한잔 털어내요.',
    '밤바람이 쌀쌀하죠? 국물 더 줄까요?',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setDialogueIdx((prev) => (prev + 1) % DIALOGUES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // 국물 젓기 및 사장님 고개 끄덕임 애니메이션
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 국자 젓는 동작 (원형 모션)
    if (ladleRef.current) {
      ladleRef.current.position.x = -1.1 + Math.cos(time * 2.2) * 0.12;
      ladleRef.current.position.z = Math.sin(time * 2.2) * 0.12;
      ladleRef.current.rotation.z = Math.sin(time * 2.2) * 0.25;
      ladleRef.current.position.y = 1.05 + Math.sin(time * 4) * 0.03;
    }

    // 온화하게 고개 살짝 끄덕이기
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 1.5) * 0.05 + 0.08;
      headRef.current.rotation.y = Math.sin(time * 0.8) * 0.1;
    }
  });

  return (
    <group position={[0, 0, -3.2]}>
      {/* 1. 사장님 명찰 및 따뜻한 말풍선 */}
      <group position={[0, 2.05, 0]}>
        <Text
          fontSize={0.16}
          color="#fbc531"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#2f3640"
        >
          포차 사장님
        </Text>
        {/* 말풍선 텍스트 */}
        <group position={[0, 0.28, 0]}>
          <Text
            fontSize={0.14}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#192a56"
          >
            "{DIALOGUES[dialogueIdx]}"
          </Text>
        </group>
      </group>

      {/* 2. 푸근한 몸체와 앞치마 */}
      {/* 몸체 (따뜻한 갈색 스웨터) */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.38, 12, 16]} />
        <meshStandardMaterial color="#8c7ae6" roughness={0.7} />
      </mesh>

      {/* 흰색/아이보리 정감 있는 앞치마 */}
      <mesh position={[0, 0.68, 0.13]} castShadow>
        <boxGeometry args={[0.34, 0.52, 0.12]} />
        <meshStandardMaterial color="#f5f6fa" roughness={0.5} />
      </mesh>
      {/* 앞치마 주머니 */}
      <mesh position={[0, 0.55, 0.19]}>
        <boxGeometry args={[0.22, 0.14, 0.02]} />
        <meshStandardMaterial color="#dcdde1" roughness={0.5} />
      </mesh>

      {/* 3. 인자한 할머니 사장님 얼굴 & 머리 */}
      <group ref={headRef} position={[0, 1.25, 0]}>
        {/* 얼굴 */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#ffeaa7" roughness={0.5} />
        </mesh>

        {/* 정갈한 흰머리/회색 올림머리 (Bun) */}
        <mesh position={[0, 0.08, -0.06]} scale={[1.05, 1.05, 1.1]}>
          <sphereGeometry args={[0.23, 20, 20]} />
          <meshStandardMaterial color="#dcdde1" roughness={0.6} />
        </mesh>
        {/* 머리 뒤 둥근 올림 비녀 뭉치 */}
        <mesh position={[0, 0.06, -0.22]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#bdc3c7" roughness={0.6} />
        </mesh>

        {/* 온화하게 웃는 눈 (초승달 모양) */}
        <mesh position={[-0.08, 0.02, 0.19]} rotation={[0, 0, -0.1]}>
          <torusGeometry args={[0.025, 0.006, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#2d3436" />
        </mesh>
        <mesh position={[0.08, 0.02, 0.19]} rotation={[0, 0, -0.1]}>
          <torusGeometry args={[0.025, 0.006, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#2d3436" />
        </mesh>

        {/* 인자하고 발그레한 볼터치 */}
        <mesh position={[-0.12, -0.05, 0.17]}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#ff7675" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.12, -0.05, 0.17]}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#ff7675" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 4. 국자를 쥐고 어묵탕을 젓는 손 */}
      <group ref={ladleRef} position={[-1.1, 1.05, 0]}>
        {/* 손 */}
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#ffeaa7" />
        </mesh>
        {/* 국자 자루 */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.35, 8]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.8} />
        </mesh>
        {/* 국자 머리 */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.045, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#7f8c8d" metalness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 왼손 (카운터에 다정하게 짚고 있는 손) */}
      <mesh position={[0.45, 0.98, 0.25]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#ffeaa7" />
      </mesh>
    </group>
  );
};
