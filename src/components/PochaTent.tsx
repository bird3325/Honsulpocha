import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const PochaTent: React.FC = () => {
  const steamRef = useRef<THREE.Group>(null);

  // 어묵탕 김(스팀) 애니메이션
  useFrame((state) => {
    if (steamRef.current) {
      steamRef.current.children.forEach((child, i) => {
        child.position.y = 0.95 + Math.sin(state.clock.elapsedTime * 2.5 + i) * 0.18;
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 3 + i * 2) * 0.2;
        }
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. 널찍하고 아늑한 포장마차 우드 데크 바닥 */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[11.5, 0.1, 8.5]} />
        <meshStandardMaterial color="#2c3437" roughness={0.7} />
      </mesh>

      {/* 2. 철제 파이프 프레임 기둥들 (넓어진 공간에 맞춤) */}
      {[
        [-5.4, -3.9],
        [5.4, -3.9],
        [-5.4, 3.9],
        [5.4, 3.9],
        [0, -3.9],
        [-5.4, 0],
        [5.4, 0],
      ].map(([x, z], idx) => (
        <mesh key={idx} position={[x, 1.8, z]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 3.5, 12]} />
          <meshStandardMaterial color="#636e72" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* 상단 가로 빔 프레임 */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[11.0, 0.06, 8.0]} />
        <meshStandardMaterial color="#636e72" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* 3. 주황색 방수 비닐 천막 지붕 (넓고 높은 박공 지붕) */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[6.8, 1.8, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial
          color="#e17055"
          roughness={0.4}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. 포차 후면 및 측면 주황색 비닐 벽 (정면은 탁 트이게 개방) */}
      {/* 뒷면 벽 */}
      <mesh position={[0, 1.8, -3.9]}>
        <planeGeometry args={[10.8, 3.4]} />
        <meshStandardMaterial
          color="#d63031"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          roughness={0.3}
        />
      </mesh>
      {/* 좌측 벽 */}
      <mesh position={[-5.4, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7.8, 3.4]} />
        <meshStandardMaterial
          color="#e17055"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          roughness={0.3}
        />
      </mesh>
      {/* 우측 벽 */}
      <mesh position={[5.4, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[7.8, 3.4]} />
        <meshStandardMaterial
          color="#e17055"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          roughness={0.3}
        />
      </mesh>

      {/* 5. 포차 주방/조리 카운터 바 (뒤편 Z: -2.7에 여유롭게 배치) */}
      <group position={[0, 0, -2.7]}>
        {/* 카운터 본체 */}
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.2, 0.95, 1.0]} />
          <meshStandardMaterial color="#95a5a6" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* 조리대 상판 (스테인리스) */}
        <mesh position={[0, 0.96, 0]}>
          <boxGeometry args={[5.4, 0.05, 1.1]} />
          <meshStandardMaterial color="#dfe6e9" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* 어묵탕 사각 냄비 */}
        <mesh position={[-1.2, 1.03, 0]}>
          <boxGeometry args={[1.4, 0.16, 0.7]} />
          <meshStandardMaterial color="#636e72" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 어묵 국물 */}
        <mesh position={[-1.2, 1.09, 0]}>
          <boxGeometry args={[1.3, 0.02, 0.62]} />
          <meshStandardMaterial color="#e67e22" roughness={0.2} />
        </mesh>
        {/* 어묵 꼬치들 */}
        {[-1.6, -1.4, -1.2, -1.0, -0.8].map((x, i) => (
          <group key={i} position={[x, 1.15, 0]} rotation={[0.2, 0, 0.25 * (i % 2 === 0 ? 1 : -1)]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
              <meshStandardMaterial color="#f5cd79" />
            </mesh>
          </group>
        ))}

        {/* 떡볶이 판 */}
        <mesh position={[0.9, 1.03, 0]}>
          <boxGeometry args={[1.3, 0.15, 0.7]} />
          <meshStandardMaterial color="#c0392b" roughness={0.3} />
        </mesh>

        {/* 어묵 김(스팀) 파티클 구들 */}
        <group ref={steamRef} position={[-1.2, 0.35, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[(i - 1.5) * 0.28, 0.95, (i % 2) * 0.1]}>
              <sphereGeometry args={[0.13, 12, 12]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={1} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 6. 천장 백열전구 조명 스트링 & 따뜻한 노란빛 포인트 라이트 (5구) */}
      <group position={[0, 3.1, 0]}>
        {[-3.0, -1.5, 0, 1.5, 3.0].map((x, idx) => (
          <group key={idx} position={[x, 0, 0]}>
            {/* 전선 */}
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.4, 6]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            {/* 전구 */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color="#ffeaa7"
                emissive="#fdcb6e"
                emissiveIntensity={2.5}
                roughness={0.1}
              />
            </mesh>
            {/* 따뜻한 포차 램프 광원 */}
            <pointLight
              color="#ff9f43"
              intensity={2.8}
              distance={11}
              decay={2}
              castShadow
            />
          </group>
        ))}
      </group>
    </group>
  );
};
