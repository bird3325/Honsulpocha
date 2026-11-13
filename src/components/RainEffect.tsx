import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const RainEffect: React.FC = () => {
  const count = 900;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 포차 주변 30x30 영역에 분산
      pos[i * 3 + 0] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = Math.random() * 12; // 높이
      pos[i * 3 + 2] = (Math.random() - 0.5) * 28;

      spd[i] = 0.12 + Math.random() * 0.12; // 낙하 속도
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= speeds[i]; // 아래로 떨어짐
      // 바람 효과로 살짝 x 방향 드리프트
      array[i * 3 + 0] += 0.01;

      // 바닥에 닿으면 다시 위로 리셋
      if (array[i * 3 + 1] < 0) {
        array[i * 3 + 1] = 10 + Math.random() * 2;
        array[i * 3 + 0] = (Math.random() - 0.5) * 28;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#a5b1c2"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
};
