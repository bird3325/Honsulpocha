import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createKoreanPavementTexture } from '../utils/koreanPavementTexture';
import { WeatherMood } from '../types';

interface StreetEnvironmentProps {
  weatherMood?: WeatherMood;
}

// 비/눈 오는 밤 우산을 쓰고 지나가는 보행자들
interface PedestrianData {
  id: number;
  startX: number;
  z: number;
  speed: number;
  direction: 1 | -1;
  coatColor: string;
  umbrellaColor: string;
}

const PEDESTRIANS: PedestrianData[] = [
  { id: 1, startX: -8.8, z: -10, speed: 1.1, direction: 1, coatColor: '#34495e', umbrellaColor: '#e74c3c' },
  { id: 2, startX: 8.8, z: 12, speed: 0.9, direction: -1, coatColor: '#2c3e50', umbrellaColor: '#f1c40f' },
  { id: 3, startX: -8.9, z: 8, speed: 1.25, direction: -1, coatColor: '#16a085', umbrellaColor: '#3498db' },
  { id: 4, startX: 8.9, z: -6, speed: 1.05, direction: 1, coatColor: '#8e44ad', umbrellaColor: '#ecf0f1' },
];

const Pedestrians: React.FC<{ weatherMood?: WeatherMood }> = ({ weatherMood }) => {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    PEDESTRIANS.forEach((ped, idx) => {
      const group = groupRefs.current[idx];
      if (!group) return;

      // Z축 보행 이동
      group.position.z += ped.speed * ped.direction * delta;

      // 화면 밖으로 나가면 반대편에서 재진입 (루프 순환)
      if (ped.direction === 1 && group.position.z > 16) {
        group.position.z = -16;
      } else if (ped.direction === -1 && group.position.z < -16) {
        group.position.z = 16;
      }

      // 걸을 때 상하 바운스와 우산 흔들림
      group.position.y = Math.abs(Math.sin(time * 5 + idx)) * 0.04;
      group.rotation.z = Math.sin(time * 5 + idx) * 0.03;
    });
  });

  return (
    <group>
      {PEDESTRIANS.map((ped, idx) => (
        <group
          key={ped.id}
          ref={(el) => (groupRefs.current[idx] = el)}
          position={[ped.startX, 0, ped.z]}
          rotation={[0, ped.direction === 1 ? 0 : Math.PI, 0]}
        >
          {/* 몸체 (코트 입은 행인) */}
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.95, 12]} />
            <meshStandardMaterial color={ped.coatColor} roughness={0.7} />
          </mesh>

          {/* 머리 */}
          <mesh position={[0, 1.45, 0]} castShadow>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>

          {/* 비/눈을 막아주는 우산 (포차 비닐창 너머로 감성적인 실루엣 형성) */}
          <group position={[0, 1.62, 0]}>
            {/* 우산 대 */}
            <mesh position={[0.08, -0.15, 0.05]} rotation={[0, 0, -0.1]}>
              <cylinderGeometry args={[0.012, 0.012, 0.65, 8]} />
              <meshStandardMaterial color="#2d3436" metalness={0.8} />
            </mesh>
            {/* 우산 살/천 */}
            <mesh position={[0.12, 0.18, 0.05]} castShadow>
              <coneGeometry args={[0.62, 0.28, 16, 1, true]} />
              <meshStandardMaterial
                color={ped.umbrellaColor}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* 눈 올 때 우산 위에 소복이 쌓인 눈 */}
            {weatherMood === 'snowy' && (
              <mesh position={[0.12, 0.22, 0.05]}>
                <coneGeometry args={[0.63, 0.26, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.95} />
              </mesh>
            )}
          </group>

          {/* 걸어가는 다리 실루엣 */}
          <mesh position={[-0.08, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
            <meshStandardMaterial color="#1e272e" />
          </mesh>
          <mesh position={[0.08, 0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
            <meshStandardMaterial color="#1e272e" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const StreetEnvironment: React.FC<StreetEnvironmentProps> = ({ weatherMood = 'rainy' }) => {
  // 한국 골목 인도 보도블럭 텍스처
  const sidewalkTexture = useMemo(() => {
    return createKoreanPavementTexture({ repeatX: 4, repeatY: 20 });
  }, []);

  const puddleRippleRef = useRef<THREE.Group>(null);

  // 비 올 때 물웅덩이 표면의 잔잔한 파문(리플) 애니메이션
  useFrame((state) => {
    if (puddleRippleRef.current && weatherMood === 'rainy') {
      const time = state.clock.elapsedTime;
      puddleRippleRef.current.children.forEach((child, i) => {
        const ring = child as THREE.Mesh;
        const scaleVal = 1.0 + ((time * 1.5 + i * 0.7) % 2.0) * 0.45;
        ring.scale.set(scaleVal, scaleVal, 1);
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = Math.max(0, 0.65 - ((time * 1.5 + i * 0.7) % 2.0) * 0.32);
        }
      });
    }
  });

  const isRain = weatherMood === 'rainy';
  const isSnow = weatherMood === 'snowy';

  return (
    <group>
      {/* 1. 골목 아스팔트 바닥 (비 올 때는 촉촉한 물기 반사, 눈 올 때는 차가운 설원 바닥) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[55, 55]} />
        <meshStandardMaterial
          color={isSnow ? '#2d3436' : isRain ? '#0b0d11' : '#14171d'}
          roughness={isRain ? 0.12 : isSnow ? 0.85 : 0.4}
          metalness={isRain ? 0.55 : 0.1}
        />
      </mesh>

      {/* 2. 도로 노란색 점선 / 골목 라인 */}
      <mesh position={[0, 0.005, 8.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 32]} />
        <meshStandardMaterial color="#f1c40f" roughness={0.6} />
      </mesh>

      {/* 3. 포장마차 바깥 인도 (좌/우 보도블럭 - 비닐창 너머로 보이는 인도) */}
      <mesh position={[-9.2, 0.08, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.16, 45]} />
        <meshStandardMaterial map={sidewalkTexture} roughness={isRain ? 0.25 : 0.5} />
      </mesh>
      <mesh position={[9.2, 0.08, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.16, 45]} />
        <meshStandardMaterial map={sidewalkTexture} roughness={isRain ? 0.25 : 0.5} />
      </mesh>

      {/* 4. ★ 비 올 때 길거리에 생기는 실제 물웅덩이 고임 (Street Puddles & Concentric Ripples) */}
      {isRain && (
        <group position={[0, 0.015, 0]}>
          {/* A. 포차 정문 앞 아스팔트 대형 물웅덩이 */}
          <mesh position={[0, 0, 7.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.4, 32]} />
            <meshStandardMaterial
              color="#080b10"
              roughness={0.03}
              metalness={0.92}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* B. 좌측 골목 보행로 옆 물웅덩이 */}
          <mesh position={[-7.8, 0, 2.5]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
            <circleGeometry args={[1.6, 24]} />
            <meshStandardMaterial
              color="#080b10"
              roughness={0.03}
              metalness={0.92}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* C. 우측 골목 보행로 옆 물웅덩이 */}
          <mesh position={[7.8, 0, -2.8]} rotation={[-Math.PI / 2, 0, -0.4]} receiveShadow>
            <circleGeometry args={[1.8, 24]} />
            <meshStandardMaterial
              color="#080b10"
              roughness={0.03}
              metalness={0.92}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* D. 후면 골목 작은 물웅덩이 */}
          <mesh position={[-2.5, 0, -7.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.4, 20]} />
            <meshStandardMaterial
              color="#080b10"
              roughness={0.03}
              metalness={0.92}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* 물웅덩이 위에 빗방울이 떨어지며 잔잔히 퍼지는 동심원 파문(Ripples) */}
          <group ref={puddleRippleRef}>
            {[
              [0, 7.2],
              [0.6, 7.6],
              [-7.8, 2.5],
              [7.8, -2.8],
            ].map(([rx, rz], ri) => (
              <mesh key={ri} position={[rx, 0.02, rz]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.36, 24]} />
                <meshBasicMaterial color="#dfe6e9" transparent opacity={0.5} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* 5. ★ 눈 올 때 길거리와 인도에 소복이 쌓인 하얀 눈 (Accumulated Snow Blankets & Drifts) */}
      {isSnow && (
        <group position={[0, 0.02, 0]}>
          {/* A. 좌측 인도 전체를 덮은 하얀 눈 이불 */}
          <mesh position={[-9.2, 0.165, 0]} receiveShadow>
            <boxGeometry args={[4.1, 0.03, 44.8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.96} metalness={0.02} />
          </mesh>
          {/* B. 우측 인도 전체를 덮은 하얀 눈 이불 */}
          <mesh position={[9.2, 0.165, 0]} receiveShadow>
            <boxGeometry args={[4.1, 0.03, 44.8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.96} metalness={0.02} />
          </mesh>

          {/* C. 아스팔트 도로변에 불규칙하게 흩뿌려져 쌓인 눈 패치들 */}
          {[
            [-3.5, 7.2, 2.2],
            [3.2, 8.0, 2.6],
            [-1.0, 9.5, 3.0],
            [-7.5, 3.0, 1.8],
            [7.6, -3.2, 2.0],
            [0, -7.5, 2.5],
          ].map(([sx, sz, sSize], si) => (
            <mesh key={si} position={[sx, 0.015, sz]} rotation={[-Math.PI / 2, 0, si * 0.7]}>
              <circleGeometry args={[sSize, 20]} />
              <meshStandardMaterial color="#ffffff" roughness={0.98} />
            </mesh>
          ))}

          {/* D. 포차 외벽 스커트 및 보도블럭 경계석을 따라 언덕처럼 소복하게 쌓인 눈더미 (Snow Mounds / Drifts) */}
          {[
            [-7.1, 0.16, 2.0, 0.45],
            [-7.1, 0.16, -2.0, 0.5],
            [7.1, 0.16, 2.0, 0.45],
            [7.1, 0.16, -2.0, 0.5],
            [-3.0, 0.16, -5.8, 0.48],
            [3.0, 0.16, -5.8, 0.48],
            [-8.8, 0.22, 1.5, 0.6], // 가로등 밑 눈더미
            [8.8, 0.22, -1.5, 0.6],
          ].map(([mx, my, mz, mRad], mi) => (
            <mesh key={mi} position={[mx, my, mz]} scale={[1.4, 0.5, 1.4]} castShadow>
              <sphereGeometry args={[mRad, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#f1f2f6" roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}

      {/* 6. 비닐창 너머로 걸어가는 우산 쓴 보행자들 */}
      <Pedestrians weatherMood={weatherMood} />

      {/* 7. 감성 전봇대 및 주황색 밤 골목 가로등 (포차 창문 밖 은은한 조명) */}
      {/* 좌측 전봇대 & 가로등 */}
      <group position={[-8.8, 0, 1.5]}>
        <mesh position={[0, 3.8, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 7.6, 16]} />
          <meshStandardMaterial color="#57606f" roughness={0.8} />
        </mesh>
        {/* 가로등 암 */}
        <mesh position={[0.7, 6.8, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.035, 0.035, 1.4, 8]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
        {/* 가로등 전구 & 따스한 주황빛 광원 */}
        <pointLight
          position={[1.3, 6.5, 0]}
          color="#ffbe76"
          intensity={2.8}
          distance={18}
          decay={2}
          castShadow
        />
        <mesh position={[1.2, 6.6, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color="#ffeaa7" />
        </mesh>
      </group>

      {/* 우측 보행로 가로등 */}
      <group position={[8.8, 0, -1.5]}>
        <mesh position={[0, 3.8, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.22, 7.6, 16]} />
          <meshStandardMaterial color="#57606f" roughness={0.8} />
        </mesh>
        <mesh position={[-0.7, 6.8, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.035, 0.035, 1.4, 8]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
        <pointLight
          position={[-1.3, 6.5, 0]}
          color="#ffbe76"
          intensity={2.8}
          distance={18}
          decay={2}
          castShadow
        />
        <mesh position={[-1.2, 6.6, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color="#ffeaa7" />
        </mesh>
      </group>

      {/* 8. 먼 배경의 어두운 도시 건물 실루엣들 & 불빛 창문 */}
      {[-16, -11, 11, 16].map((x, i) => (
        <group key={i} position={[x, 0, -12 - (i % 2) * 5]}>
          <mesh position={[0, 6 + (i % 3) * 2, 0]}>
            <boxGeometry args={[4.5, 12 + (i % 3) * 4, 3.5]} />
            <meshStandardMaterial color="#131929" roughness={0.9} />
          </mesh>
          {/* 건물 창문 불빛 */}
          {[1, 3, 5, 7].map((h, j) => (
            <mesh key={j} position={[(j - 1.5) * 0.9, h, 1.76]}>
              <planeGeometry args={[0.45, 0.65]} />
              <meshBasicMaterial color={j % 2 === 0 ? '#ffeaa7' : '#1e3799'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
