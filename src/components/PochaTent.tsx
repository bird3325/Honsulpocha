import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { createKoreanPavementTexture } from '../utils/koreanPavementTexture';
import { WeatherMood } from '../types';

interface PochaTentProps {
  weatherMood?: WeatherMood;
}

// 비 올 때 지붕 처마 끝에서 길거리로 똑똑 떨어지는 낙수 효과
const RoofWaterDrips: React.FC = () => {
  const dripRefs = useRef<(THREE.Mesh | null)[]>([]);
  const dripPositions = useMemo(
    () => [
      [-6.7, 3.4, -5.35],
      [6.7, 3.4, -5.35],
      [-6.7, 3.4, 5.35],
      [6.7, 3.4, 5.35],
      [0, 3.4, -5.38],
      [0, 3.4, 5.38],
      [-6.72, 3.4, 0],
      [6.72, 3.4, 0],
    ],
    []
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    dripRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        const progress = (time * 2.5 + idx * 0.45) % 1;
        mesh.position.y = 3.35 - progress * 3.3;
        mesh.scale.set(1, 1 + progress * 2.2, 1);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.8 * (1 - progress * 0.6);
        }
      }
    });
  });

  return (
    <group>
      {dripPositions.map(([x, y, z], idx) => (
        <mesh
          key={idx}
          ref={(el) => (dripRefs.current[idx] = el)}
          position={[x, y, z]}
        >
          <cylinderGeometry args={[0.012, 0.005, 0.18, 6]} />
          <meshBasicMaterial color="#dff9fb" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
};

export const PochaTent: React.FC<PochaTentProps> = ({ weatherMood = 'rainy' }) => {
  const steamRef = useRef<THREE.Group>(null);

  // 한국의 인터로킹 보도블럭 텍스처 (10개 테이블 대형 포차 공간에 맞춘 타일링)
  const pavementTexture = useMemo(() => {
    return createKoreanPavementTexture({ repeatX: 10, repeatY: 8 });
  }, []);

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
      {/* 1. 한국의 정겨운 인도 보도블럭 바닥 (가로 14m x 세로 11.5m 대형 포차 홀) */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[14.0, 0.1, 11.5]} />
        <meshStandardMaterial
          map={pavementTexture}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* 보도블럭 가장자리 화강석 경계석(연석) 테두리 */}
      <group position={[0, 0.06, 0]}>
        {/* 앞/뒤 테두리 */}
        <mesh position={[0, 0, 5.76]}>
          <boxGeometry args={[14.05, 0.11, 0.12]} />
          <meshStandardMaterial color="#b2bec3" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, -5.76]}>
          <boxGeometry args={[14.05, 0.11, 0.12]} />
          <meshStandardMaterial color="#b2bec3" roughness={0.7} />
        </mesh>
        {/* 좌/우 테두리 */}
        <mesh position={[-7.01, 0, 0]}>
          <boxGeometry args={[0.12, 0.11, 11.55]} />
          <meshStandardMaterial color="#b2bec3" roughness={0.7} />
        </mesh>
        <mesh position={[7.01, 0, 0]}>
          <boxGeometry args={[0.12, 0.11, 11.55]} />
          <meshStandardMaterial color="#b2bec3" roughness={0.7} />
        </mesh>
      </group>

      {/* 2. 철제 파이프 프레임 기둥들 (대형 텐트 10개 테이블 규격) */}
      {[
        [-6.7, -5.4],
        [6.7, -5.4],
        [-6.7, 5.4],
        [6.7, 5.4],
        [0, -5.4],
        [-6.7, 0],
        [6.7, 0],
      ].map(([x, z], idx) => (
        <mesh key={idx} position={[x, 1.8, z]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 3.5, 12]} />
          <meshStandardMaterial color="#dfe4ea" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* 상단 가로 빔 프레임 */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[13.5, 0.06, 11.0]} />
        <meshStandardMaterial color="#dfe4ea" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 천장 중앙 알전구 펜던트 조명 (Pendant Light Bulbs) */}
      {[
        [-2.5, 2.7, 0.8],
        [2.5, 2.7, 0.8],
        [0, 2.8, -1.8],
        [0, 2.8, 2.8],
      ].map(([bx, by, bz], bi) => (
        <group key={bi} position={[bx, by, bz]}>
          {/* 천장에서 내려오는 검은 전선 */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.7, 6]} />
            <meshBasicMaterial color="#1e272e" />
          </mesh>
          {/* 전구 소켓 */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.025, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#2d3436" metalness={0.8} />
          </mesh>
          {/* 따뜻한 백열전구 유리구 */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#ffeaa7" />
          </mesh>
          {/* 실제 포차 사진처럼 텐트 내부 전체를 아늑한 오렌지빛으로 물들이는 포인트 조명 */}
          <pointLight color="#ff9f43" intensity={2.8} distance={8} decay={1.8} />
        </group>
      ))}

      {/* 3. 주황색/붉은색 방수 타포린 천막 지붕 (비 올 때는 젖은 광택, 평소에는 캔버스 질감) */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <coneGeometry args={[8.8, 2.2, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial
          color="#d63031"
          roughness={weatherMood === 'rainy' ? 0.15 : 0.35}
          metalness={weatherMood === 'rainy' ? 0.32 : 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ★ 눈이 올 때 지붕 위에 소복하게 쌓인 하얀 눈 (Snow Accumulation on Roof) */}
      {weatherMood === 'snowy' && (
        <group position={[0, 4.63, 0]}>
          {/* 지붕 전체를 포근하게 덮는 두툼한 눈 이불 */}
          <mesh castShadow>
            <coneGeometry args={[8.85, 2.22, 4, 1, false, Math.PI / 4]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.96}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 처마 끝으로 삐져나온 둥근 눈선 테두리 (Snow Overhang Rim) */}
          <group position={[0, -1.08, 0]}>
            {[-5.4, 5.4].map((zPos, zi) => (
              <mesh key={zi} position={[0, 0, zPos]}>
                <boxGeometry args={[13.6, 0.16, 0.22]} />
                <meshStandardMaterial color="#f1f2f6" roughness={0.95} />
              </mesh>
            ))}
            {[-6.7, 6.7].map((xPos, xi) => (
              <mesh key={xi} position={[xPos, 0, 0]}>
                <boxGeometry args={[0.22, 0.16, 11.0]} />
                <meshStandardMaterial color="#f1f2f6" roughness={0.95} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ★ 비 올 때 지붕 처마 끝에서 길거리로 뚝뚝 떨어지는 낙수 효과 (Eaves Drips) */}
      {weatherMood === 'rainy' && <RoofWaterDrips />}

      {/* 4. 포차 천막 벽면 & 대형 투명 우레탄 방풍 비닐창 (바깥 골목 경치, 비/눈, 행인 실시간 조망) */}
      {/* 좌측 벽 (X: -6.7m) */}
      <group position={[-6.7, 0, 0]}>
        {/* 하단 주황/빨강 방수 타포린 스커트 */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.03, 0.8, 10.8]} />
          <meshStandardMaterial color="#d63031" roughness={0.4} />
        </mesh>
        {/* 상단 타포린 처마 */}
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[0.03, 1.0, 10.8]} />
          <meshStandardMaterial color="#e17055" roughness={0.4} />
        </mesh>
        {/* ★ 중앙 대형 투명 방풍 비닐창 (눈높이 0.8m ~ 2.4m 파노라마 창) */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.02, 1.6, 10.6]} />
          <meshStandardMaterial
            color="#eaf2f8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.15}
          />
        </mesh>
        {/* 비닐창 창틀/지퍼 라인 수직 지지 기둥들 */}
        {[-3.6, -1.8, 0, 1.8, 3.6].map((zPos, zi) => (
          <mesh key={zi} position={[0, 1.6, zPos]}>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
            <meshStandardMaterial color="#636e72" metalness={0.6} />
          </mesh>
        ))}
        {/* 가로 창틀 프레임 */}
        <mesh position={[0, 0.81, 0]}>
          <boxGeometry args={[0.04, 0.03, 10.65]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} />
        </mesh>
        <mesh position={[0, 2.39, 0]}>
          <boxGeometry args={[0.04, 0.03, 10.65]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} />
        </mesh>
      </group>

      {/* 우측 벽 (X: 6.7m) */}
      <group position={[6.7, 0, 0]}>
        {/* 하단 스커트 */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.03, 0.8, 10.8]} />
          <meshStandardMaterial color="#d63031" roughness={0.4} />
        </mesh>
        {/* 상단 처마 */}
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[0.03, 1.0, 10.8]} />
          <meshStandardMaterial color="#e17055" roughness={0.4} />
        </mesh>
        {/* ★ 중앙 대형 투명 방풍 비닐창 */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.02, 1.6, 10.6]} />
          <meshStandardMaterial
            color="#eaf2f8"
            transparent
            opacity={0.22}
            roughness={0.08}
            metalness={0.15}
          />
        </mesh>
        {/* 비닐창 창틀/지퍼 라인 수직 지지 기둥들 */}
        {[-3.6, -1.8, 0, 1.8, 3.6].map((zPos, zi) => (
          <mesh key={zi} position={[0, 1.6, zPos]}>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
            <meshStandardMaterial color="#636e72" metalness={0.6} />
          </mesh>
        ))}
        {/* 가로 창틀 프레임 */}
        <mesh position={[0, 0.81, 0]}>
          <boxGeometry args={[0.04, 0.03, 10.65]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} />
        </mesh>
        <mesh position={[0, 2.39, 0]}>
          <boxGeometry args={[0.04, 0.03, 10.65]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} />
        </mesh>
      </group>

      {/* 후면 벽 (Z: -5.4m) - 주방 가림막 & 좌우 조망 비닐창 */}
      <group position={[0, 0, -5.4]}>
        {/* 중앙 주방 뒷면 불투명 타포린 가림막 */}
        <mesh position={[0, 1.7, 0]}>
          <boxGeometry args={[6.2, 3.4, 0.03]} />
          <meshStandardMaterial color="#d63031" roughness={0.4} />
        </mesh>

        {/* ★ 사진 속 천막 벽면에 테이프로 다닥다닥 붙어 있는 정겨운 손글씨 종이 메뉴판들 (Paper Menu Signs) */}
        {[
          { text: '소 주 5,000', x: -2.2, y: 2.2, rot: 0.02 },
          { text: '어 묵 탕 10,000', x: -1.4, y: 2.25, rot: -0.01 },
          { text: '홍 합 탕 10,000', x: -0.6, y: 2.18, rot: 0.03 },
          { text: '오 돌 뼈 12,000', x: 0.6, y: 2.22, rot: -0.02 },
          { text: '우 동 4,000', x: 1.4, y: 2.19, rot: 0.01 },
          { text: '계 란 말 이 12,000', x: 2.2, y: 2.24, rot: -0.03 },
        ].map((sign, si) => (
          <group key={si} position={[sign.x, sign.y, 0.025]} rotation={[0, 0, sign.rot]}>
            {/* 흰색 종이 판자 */}
            <mesh>
              <planeGeometry args={[0.38, 0.7]} />
              <meshStandardMaterial color="#f8f9fa" roughness={0.8} />
            </mesh>
            {/* 상단 박스 테이프 자국 */}
            <mesh position={[0, 0.33, 0.002]}>
              <planeGeometry args={[0.16, 0.05]} />
              <meshBasicMaterial color="#dcdde1" transparent opacity={0.65} />
            </mesh>
            {/* 손글씨 메뉴 텍스트 */}
            <Text
              position={[0, 0, 0.005]}
              fontSize={0.065}
              color="#2d3436"
              anchorX="center"
              anchorY="middle"
              lineHeight={1.4}
              textAlign="center"
            >
              {sign.text.replace(/ /g, '\n')}
            </Text>
          </group>
        ))}
        {/* 좌/우측 후면 투명 비닐창 */}
        {[-4.8, 4.8].map((xSide, xi) => (
          <group key={xi} position={[xSide, 0, 0]}>
            {/* 하단 스커트 */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[3.4, 0.8, 0.03]} />
              <meshStandardMaterial color="#d63031" />
            </mesh>
            {/* 상단 처마 */}
            <mesh position={[0, 2.9, 0]}>
              <boxGeometry args={[3.4, 1.0, 0.03]} />
              <meshStandardMaterial color="#e17055" />
            </mesh>
            {/* 투명 비닐창 */}
            <mesh position={[0, 1.6, 0]}>
              <boxGeometry args={[3.3, 1.6, 0.02]} />
              <meshStandardMaterial
                color="#eaf2f8"
                transparent
                opacity={0.22}
                roughness={0.08}
                metalness={0.15}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. 포차 주방/조리 카운터 바 (뒤편 Z: -4.2에 여유롭게 배치) */}
      <group position={[0, 0, -4.2]}>
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
            {/* 따뜻한 포차 램프 광원 (포차 내부 아늑한 조명) */}
            <pointLight
              color="#ff9f43"
              intensity={2.8}
              distance={11}
              decay={2}
            />
          </group>
        ))}
      </group>
    </group>
  );
};
