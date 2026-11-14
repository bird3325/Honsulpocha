import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createKoreanPavementTexture } from '../utils/koreanPavementTexture';
import { WeatherMood } from '../types';

interface StreetEnvironmentProps {
  weatherMood?: WeatherMood;
}

// 비/눈 오는 밤 공원 인도와 빌딩 도로변을 우산을 쓰고 걸어가는 보행자들
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
  // 포차 바깥 공원 인도 보행자 (X = 7.8 ~ 8.2)
  { id: 1, startX: 7.9, z: -12, speed: 1.1, direction: 1, coatColor: '#34495e', umbrellaColor: '#e74c3c' },
  { id: 2, startX: 8.2, z: 14, speed: 0.9, direction: -1, coatColor: '#2c3e50', umbrellaColor: '#f1c40f' },
  // 도로 건너편 상가 빌딩 인도 보행자 (X = -20.2 ~ -20.6)
  { id: 3, startX: -20.4, z: 9, speed: 1.25, direction: -1, coatColor: '#16a085', umbrellaColor: '#3498db' },
  { id: 4, startX: -20.5, z: -8, speed: 1.05, direction: 1, coatColor: '#8e44ad', umbrellaColor: '#ecf0f1' },
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
          {/* 1. 몸체 (실사 비율 롱패딩 / 트렌치코트 의상) */}
          <group position={[0, 0.85, 0]}>
            {/* 코트 몸통 메인 */}
            <mesh castShadow>
              <capsuleGeometry args={[0.18, 0.65, 8, 12]} />
              <meshStandardMaterial color={ped.coatColor} roughness={0.75} />
            </mesh>
            {/* 코트 깃 및 옷 주름 */}
            <mesh position={[0, 0.28, 0.1]}>
              <boxGeometry args={[0.22, 0.24, 0.08]} />
              <meshStandardMaterial color={ped.coatColor} roughness={0.7} />
            </mesh>
            {/* 가방/크로스백 디테일 */}
            <mesh position={[0.16, 0.1, -0.05]} rotation={[0.2, 0, -0.3]}>
              <boxGeometry args={[0.08, 0.2, 0.16]} />
              <meshStandardMaterial color="#2d3436" roughness={0.6} />
            </mesh>
          </group>

          {/* 2. 머리 및 헤어스타일/모자 디테일 */}
          <group position={[0, 1.48, 0]}>
            {/* 피부 얼굴 */}
            <mesh castShadow>
              <sphereGeometry args={[0.11, 14, 14]} />
              <meshStandardMaterial color="#fcd5b5" roughness={0.6} />
            </mesh>
            {/* 자연스러운 헤어스타일 (블랙/다크브라운) */}
            <mesh position={[0, 0.04, -0.02]}>
              <sphereGeometry args={[0.115, 12, 12]} />
              <meshStandardMaterial color="#1e272e" roughness={0.8} />
            </mesh>
          </group>

          {/* 3. 팔 및 소매 */}
          <mesh position={[-0.22, 0.95, 0]} rotation={[0, 0, 0.1]}>
            <capsuleGeometry args={[0.045, 0.45, 6, 8]} />
            <meshStandardMaterial color={ped.coatColor} roughness={0.75} />
          </mesh>
          <mesh position={[0.22, 0.95, 0]} rotation={[0, 0, -0.1]}>
            <capsuleGeometry args={[0.045, 0.45, 6, 8]} />
            <meshStandardMaterial color={ped.coatColor} roughness={0.75} />
          </mesh>

          {/* 4. 비가 올 때만 우산을 쓰고, 눈/가을/별밤 등 비가 안 올 때는 우산을 접고 밤공기를 즐기며 산책함 */}
          {weatherMood === 'rainy' ? (
            <group position={[0.12, 1.42, 0.1]}>
              {/* 우산 손잡이 및 중봉 */}
              <mesh position={[0, 0, 0]} rotation={[0, 0, -0.08]}>
                <cylinderGeometry args={[0.01, 0.01, 0.72, 8]} />
                <meshStandardMaterial color="#1e272e" metalness={0.9} roughness={0.2} />
              </mesh>
              {/* 우산 살과 방수 원단 돔 (Umbrella Canopy) */}
              <mesh position={[0.02, 0.38, 0]} castShadow>
                <coneGeometry args={[0.68, 0.32, 16, 1, true]} />
                <meshStandardMaterial
                  color={ped.umbrellaColor}
                  roughness={0.25}
                  metalness={0.15}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* 우산 꼭지 */}
              <mesh position={[0.02, 0.55, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.06, 6]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            </group>
          ) : (
            // 비가 안 올 때는 따뜻한 머플러 목도리
            <mesh position={[0, 1.34, 0]}>
              <torusGeometry args={[0.12, 0.04, 8, 16]} />
              <meshStandardMaterial color={ped.umbrellaColor} roughness={0.8} />
            </mesh>
          )}

          {/* 5. 바지 및 구두/운동화 슈즈 */}
          <group position={[-0.08, 0.26, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.045, 0.52, 8]} />
              <meshStandardMaterial color="#1e272e" roughness={0.8} />
            </mesh>
            {/* 가죽 슈즈 */}
            <mesh position={[0, -0.25, 0.04]}>
              <boxGeometry args={[0.08, 0.06, 0.16]} />
              <meshStandardMaterial color="#0c0e12" roughness={0.4} metalness={0.5} />
            </mesh>
          </group>

          <group position={[0.08, 0.26, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.045, 0.52, 8]} />
              <meshStandardMaterial color="#1e272e" roughness={0.8} />
            </mesh>
            {/* 가죽 슈즈 */}
            <mesh position={[0, -0.25, 0.04]}>
              <boxGeometry args={[0.08, 0.06, 0.16]} />
              <meshStandardMaterial color="#0c0e12" roughness={0.4} metalness={0.5} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

export const StreetEnvironment: React.FC<StreetEnvironmentProps> = ({ weatherMood = 'rainy' }) => {
  // 한국 골목 및 공원 인도 보도블럭 텍스처 (X, Y 비율에 맞춘 정교한 타일링)
  const sidewalkTexture = useMemo(() => {
    return createKoreanPavementTexture({ repeatX: 4, repeatY: 20 });
  }, []);

  const pochaWalkwayTexture = useMemo(() => {
    return createKoreanPavementTexture({ repeatX: 14, repeatY: 28 });
  }, []);

  const puddleRippleRef = useRef<THREE.Group>(null);

  // 비 올 때 물웅덩이 표면의 잔잔한 파문(리플) 동심원 애니메이션
  useFrame((state) => {
    if (puddleRippleRef.current && weatherMood === 'rainy') {
      const time = state.clock.elapsedTime;
      puddleRippleRef.current.children.forEach((child, i) => {
        const ring = child as THREE.Mesh;
        // 서로 다른 오프셋과 주기로 물방울이 톡톡 떨어져 퍼지는 리플
        const cycle = ((time * 1.8 + i * 0.43) % 1.5) / 1.5; // 0 ~ 1
        const scaleVal = 0.3 + cycle * 1.4;
        ring.scale.set(scaleVal, scaleVal, 1);
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (mat) {
          // 점점 옅어지며 사라지는 동심원 파문
          mat.opacity = Math.sin(cycle * Math.PI) * 0.7;
        }
      });
    }
  });

  const isRain = weatherMood === 'rainy';
  const isSnow = weatherMood === 'snowy';
  const isAutumn = weatherMood === 'autumn';

  return (
    <group>
      {/* 1. 골목 및 차도 아스팔트 바닥 전체 (비 올 때는 촉촉한 물기 반사, 눈 올 때는 차가운 설원 바닥) */}
      <mesh position={[-6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 70]} />
        <meshStandardMaterial
          color={isSnow ? '#2d3436' : isRain ? '#0b0d11' : isAutumn ? '#191516' : '#14171d'}
          roughness={isRain ? 0.12 : isSnow ? 0.85 : isAutumn ? 0.6 : 0.4}
          metalness={isRain ? 0.55 : isAutumn ? 0.15 : 0.1}
        />
      </mesh>

      {/* 2. 도로 중앙선 (X = -15.2: 1차선과 2차선 구분 노란색 실선 2줄) */}
      <mesh position={[-15.25, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 70]} />
        <meshStandardMaterial color="#f1c40f" roughness={0.5} />
      </mesh>
      <mesh position={[-15.05, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 70]} />
        <meshStandardMaterial color="#f1c40f" roughness={0.5} />
      </mesh>

      {/* 3. 도로 갓길 흰색 차선 (포차 쪽 갓길 X = -10.8, 상가 쪽 갓길 X = -19.6) */}
      <mesh position={[-10.8, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 70]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[-19.6, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 70]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* 4. 도로 건너편 상가 빌딩 앞 보도블럭 인도 (X: -20 ~ -23.5) */}
      <mesh position={[-21.6, 0.08, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.16, 70]} />
        <meshStandardMaterial map={sidewalkTexture} roughness={isRain ? 0.25 : 0.5} />
      </mesh>

      {/* 5. ★ 포차 길 및 공원 인도 보도블럭 통시공 (포차가 놓여 있고 손님이 드나드는 전체 길을 인도블록으로 디자인: X: -10.4 ~ +9.0, 폭 19.4m x 길이 70m) */}
      <mesh position={[-0.7, 0.075, 0]} receiveShadow>
        <boxGeometry args={[19.4, 0.15, 70]} />
        <meshStandardMaterial
          map={pochaWalkwayTexture}
          roughness={isRain ? 0.25 : isSnow ? 0.9 : 0.5}
          metalness={isRain ? 0.25 : 0.05}
        />
      </mesh>

      {/* 포차 인도 차도 경계 화강석 연석 (Curbside Granite Stones: X = -10.45) */}
      <mesh position={[-10.45, 0.16, 0]} receiveShadow>
        <boxGeometry args={[0.22, 0.18, 70]} />
        <meshStandardMaterial color="#95a5a6" roughness={0.7} />
      </mesh>
      {/* 상가 쪽 인도 차도 경계 화강석 연석 (X = -19.75) */}
      <mesh position={[-19.75, 0.16, 0]} receiveShadow>
        <boxGeometry args={[0.22, 0.18, 70]} />
        <meshStandardMaterial color="#95a5a6" roughness={0.7} />
      </mesh>

      {/* 4. ★ 비 올 때 길거리에 생기는 실제 물웅덩이 고임 (Street Puddles & Concentric Ripples) */}
      {isRain && (
        <group position={[0, 0.08, 0]}>
          {/* A. 포차 정문 입구 앞 메인 대형 물웅덩이 (가로등 불빛과 네온 반사) */}
          <mesh position={[0, 0.002, 6.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.5, 32]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.96}
              transparent
              opacity={0.92}
            />
          </mesh>
          {/* A-2. 포차 입구 우측 보도블럭 물웅덩이 */}
          <mesh position={[2.6, 0.002, 5.8]} rotation={[-Math.PI / 2, 0, 0.4]} receiveShadow>
            <circleGeometry args={[1.5, 24]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.94}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* A-3. 포차 입구 좌측 보도블럭 물웅덩이 */}
          <mesh position={[-2.4, 0.002, 5.9]} rotation={[-Math.PI / 2, 0, -0.3]} receiveShadow>
            <circleGeometry args={[1.4, 24]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.94}
              transparent
              opacity={0.88}
            />
          </mesh>

          {/* B. 좌측 차도/인도 경계부 물웅덩이 */}
          <mesh position={[-7.8, 0.002, 2.2]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
            <circleGeometry args={[1.9, 28]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.95}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[-8.5, 0.002, -2.5]} rotation={[-Math.PI / 2, 0, -0.2]} receiveShadow>
            <circleGeometry args={[1.6, 24]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.95}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* C. 우측 공원 산책로 길목 물웅덩이 */}
          <mesh position={[7.8, 0.002, -2.5]} rotation={[-Math.PI / 2, 0, -0.4]} receiveShadow>
            <circleGeometry args={[2.0, 28]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.95}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[8.2, 0.002, 2.8]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
            <circleGeometry args={[1.7, 24]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.95}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* D. 후면 주방 창문 너머 골목길 물웅덩이 */}
          <mesh position={[-2.2, 0.002, -6.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.6, 24]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.94}
              transparent
              opacity={0.88}
            />
          </mesh>
          <mesh position={[2.4, 0.002, -7.0]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
            <circleGeometry args={[1.5, 24]} />
            <meshStandardMaterial
              color="#070a10"
              roughness={0.02}
              metalness={0.94}
              transparent
              opacity={0.88}
            />
          </mesh>

          {/* 물웅덩이 표면에 빗방울이 톡톡 떨어지며 퍼져나가는 동심원 파문(Concentric Ripples) */}
          <group ref={puddleRippleRef}>
            {[
              [0, 6.8],
              [-0.8, 7.2],
              [0.9, 6.4],
              [2.6, 5.8],
              [-2.4, 5.9],
              [-7.8, 2.2],
              [-8.5, -2.5],
              [7.8, -2.5],
              [8.2, 2.8],
              [-2.2, -6.8],
              [2.4, -7.0],
            ].map(([rx, rz], ri) => (
              <mesh key={ri} position={[rx, 0.005, rz]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.08, 0.14, 24]} />
                <meshBasicMaterial color="#ecf0f1" transparent opacity={0.65} depthWrite={false} />
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

      {/* 5-B. ★ 가을(autumn) 모드일 때 인도블럭과 공원 길 위에 자연스럽게 흩뿌려진 실제 입체 단풍 낙엽들 */}
      {isAutumn && (
        <group position={[0, 0.08, 0]}>
          {[
            // [x, z, scale, rotY, rotX, rotZ, color]
            [-2.4, 6.5, 0.16, 0.4, 0.12, 0.08, '#c0392b'],
            [-1.1, 7.8, 0.22, 1.2, -0.15, 0.1, '#d35400'],
            [1.5, 7.2, 0.19, -0.7, 0.18, -0.12, '#e67e22'],
            [2.8, 8.4, 0.24, 0.9, -0.1, 0.15, '#e55039'],
            [0.4, 9.1, 0.18, -1.5, 0.14, -0.09, '#f39c12'],
            [-3.8, 4.2, 0.2, 0.3, -0.18, 0.14, '#b71540'],
            [4.2, 4.5, 0.22, -0.8, 0.12, 0.06, '#d35400'],
            // 인도 위 낙엽 무리들
            [-6.5, 2.0, 0.25, 0.5, 0.2, -0.1, '#c0392b'],
            [-7.2, -1.5, 0.2, -0.6, -0.14, 0.12, '#e67e22'],
            [-8.8, 6.0, 0.26, 1.1, 0.16, 0.15, '#f1c40f'],
            [7.6, 1.8, 0.22, -0.3, -0.12, -0.14, '#e55039'],
            [8.1, -2.4, 0.24, 0.7, 0.18, 0.08, '#d35400'],
            [7.9, 5.5, 0.2, -1.2, -0.15, 0.16, '#c0392b'],
            // 포차 뒷골목 및 텐트 주변 낙엽들
            [-1.8, -6.8, 0.22, 0.8, 0.14, -0.12, '#d35400'],
            [2.1, -7.2, 0.19, -0.4, -0.16, 0.1, '#e55039'],
            [-5.2, 1.2, 0.25, 0.2, 0.12, 0.15, '#f39c12'],
            [5.2, -1.0, 0.23, -0.9, -0.18, -0.08, '#b71540'],
          ].map(([lx, lz, lScale, ry, rx, rz, lColor], li) => (
            <group
              key={li}
              position={[lx as number, 0.005, lz as number]}
              rotation={[rx as number, ry as number, rz as number]}
            >
              {/* 단풍잎 중앙 메인 엽신 */}
              <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[(lScale as number) * 0.7, (lScale as number) * 1.5, 5]} />
                <meshStandardMaterial color={lColor as string} roughness={0.75} side={THREE.DoubleSide} />
              </mesh>
              {/* 좌측 잎 조각 (Maple Flange) */}
              <mesh position={[-(lScale as number) * 0.35, 0.002, -(lScale as number) * 0.1]} rotation={[-Math.PI / 2, 0, 0.65]}>
                <coneGeometry args={[(lScale as number) * 0.45, (lScale as number) * 1.0, 4]} />
                <meshStandardMaterial color={lColor as string} roughness={0.75} side={THREE.DoubleSide} />
              </mesh>
              {/* 우측 잎 조각 */}
              <mesh position={[(lScale as number) * 0.35, 0.002, -(lScale as number) * 0.1]} rotation={[-Math.PI / 2, 0, -0.65]}>
                <coneGeometry args={[(lScale as number) * 0.45, (lScale as number) * 1.0, 4]} />
                <meshStandardMaterial color={lColor as string} roughness={0.75} side={THREE.DoubleSide} />
              </mesh>
              {/* 잎자루 (Stem) */}
              <mesh position={[0, 0.002, -(lScale as number) * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.008, 0.008, (lScale as number) * 0.6, 4]} />
                <meshStandardMaterial color="#4a2f13" roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 6. 비닐창 너머로 걸어가는 우산/외투 쓴 보행자들 */}
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
        {/* 가로등 전구 (자체 발광 매질) */}
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
        {/* 길거리 및 보행로 통합 감성 가로등 조명 (모바일 광원 한도 최적화 단일화) */}
        <pointLight
          position={[-1.3, 6.5, 0]}
          color="#ffbe76"
          intensity={2.8}
          distance={24}
          decay={1.8}
        />
        <mesh position={[-1.2, 6.6, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color="#ffeaa7" />
        </mesh>
      </group>

      {/* 8. 먼 배경의 어두운 도시 건물 실루엣들 & 불빛 창문 - NightCityBuildings 전용 컴포넌트로 대폭 고도화 및 대체됨 */}
    </group>
  );
};
