import React, { useMemo } from 'react';
import * as THREE from 'three';
import { WeatherMood } from '../types';

interface ParkEnvironmentProps {
  weatherMood?: WeatherMood;
}

interface ParkTreeData {
  id: number;
  x: number;
  z: number;
  trunkHeight: number;
  trunkRadius: number;
  crownRadius: number;
  crownHeight: number;
  type: 'pine' | 'broadleaf';
  foliageColor: string;
}

export const ParkEnvironment: React.FC<ParkEnvironmentProps> = ({ weatherMood = 'rainy' }) => {
  const isSnow = weatherMood === 'snowy';
  const isAutumn = weatherMood === 'autumn';

  // 1. 공원 잔디/토양 고해상도 절차적 텍스처
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 베이스 잔디색
      ctx.fillStyle = isSnow ? '#2d3748' : isAutumn ? '#2c2214' : '#14281a';
      ctx.fillRect(0, 0, 512, 512);

      // 잔디 뗏장 및 결 묘사
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillStyle = isSnow
          ? 'rgba(255, 255, 255, 0.22)'
          : isAutumn
            ? (Math.random() > 0.5 ? '#4b3619' : '#5c4021')
            : (Math.random() > 0.5 ? '#1f3d27' : '#0e1e13');
        ctx.fillRect(x, y, 2 + Math.random() * 4, 3 + Math.random() * 5);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 14);
    return tex;
  }, [isSnow, isAutumn]);

  // 2. 공원 수목 데이터 (소나무, 단풍나무, 느티나무)
  const trees: ParkTreeData[] = useMemo(() => {
    const list: ParkTreeData[] = [];
    const autumnColors = ['#c0392b', '#d35400', '#e67e22', '#f39c12', '#b71540'];
    const summerColors = ['#1e392a', '#274735', '#163121', '#1f402b', '#2d5a3c'];
    const snowColors = ['#2c3e50', '#34495e', '#1e272e', '#233140'];

    const colors = isAutumn ? autumnColors : isSnow ? snowColors : summerColors;

    let tid = 0;
    // 1열 (공원 산책로와 인도 경계부 X: 11.5 ~ 14.5)
    for (let z = -25; z <= 25; z += 4.2) {
      tid++;
      list.push({
        id: tid,
        x: 12.8 + Math.sin(z * 0.7) * 1.4,
        z: z + Math.cos(z * 0.5) * 0.8,
        trunkHeight: 2.6 + (tid % 3) * 0.35,
        trunkRadius: 0.18 + (tid % 2) * 0.04,
        crownRadius: 1.8 + (tid % 3) * 0.3,
        crownHeight: 3.5 + (tid % 2) * 0.6,
        type: tid % 3 === 0 ? 'pine' : 'broadleaf',
        foliageColor: colors[tid % colors.length],
      });
    }

    // 2열 및 3열 울창한 깊은 숲 (X: 18 ~ 32)
    for (let x = 18; x <= 32; x += 5.5) {
      for (let z = -26; z <= 26; z += 6.5) {
        tid++;
        list.push({
          id: tid,
          x: x + Math.sin(x + z) * 1.5,
          z: z + Math.cos(x * z) * 1.5,
          trunkHeight: 3.0 + (tid % 3) * 0.4,
          trunkRadius: 0.22 + (tid % 2) * 0.05,
          crownRadius: 2.4 + (tid % 3) * 0.4,
          crownHeight: 4.2 + (tid % 2) * 0.8,
          type: tid % 2 === 0 ? 'broadleaf' : 'pine',
          foliageColor: colors[(tid + 2) % colors.length],
        });
      }
    }

    return list;
  }, [isAutumn, isSnow]);

  return (
    <group>
      {/* 1. 대형 잔디밭 (동쪽 X: +9.0 ~ +40, Z: -36 ~ +36) */}
      <mesh position={[24.5, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[31, 72]} />
        <meshStandardMaterial
          map={grassTexture}
          color={isSnow ? '#ecf0f1' : isAutumn ? '#4b3519' : '#1e382b'}
          roughness={isSnow ? 0.95 : 0.8}
        />
      </mesh>

      {/* 2. 입체 화강석 연석 경계석 (Curbside Granite Edging: X = 9.1) */}
      <mesh position={[9.1, 0.18, 0]} receiveShadow>
        <boxGeometry args={[0.28, 0.22, 72]} />
        <meshStandardMaterial color="#7f8c8d" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* 3. 공원 자갈 산책로 (Park Gravel Path: X = 16, 폭 2.6m) */}
      <mesh position={[16, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 72]} />
        <meshStandardMaterial
          color={isSnow ? '#dcdde1' : isAutumn ? '#5c4326' : '#3e3124'}
          roughness={0.92}
        />
      </mesh>

      {/* 4. 실사 클래식 공원 가로등 (주물 기둥 + 투명 유리 갓 + 주황 웜톤 전구) */}
      {[-24, -16, -8, 0, 8, 16, 24].map((pz, idx) => (
        <group key={idx} position={[15.0, 0, pz]}>
          {/* 가로등 베이스 및 주물 기둥 */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 0.6, 8]} />
            <meshStandardMaterial color="#1e272e" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[0, 2.3, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, 3.6, 12]} />
            <meshStandardMaterial color="#2d3436" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* 가로등 아치 브래킷 */}
          <mesh position={[0.2, 4.1, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.06, 0.6, 0.06]} />
            <meshStandardMaterial color="#1e272e" metalness={0.8} />
          </mesh>
          {/* 앤틱 랜턴 헤드 */}
          <group position={[0.35, 4.35, 0]}>
            <mesh>
              <octahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#dfe6e9" transparent opacity={0.65} roughness={0.1} />
            </mesh>
            {/* 내부 발광 전구 */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshBasicMaterial color="#ffeaa7" />
            </mesh>
            {/* 공원 바닥과 산책로를 환하게 비추는 가로등 조명 (밝기 대폭 보강) */}
            <pointLight color="#ffeaa7" intensity={4.5} distance={22} decay={1.8} castShadow />
          </group>
        </group>
      ))}

      {/* 5. 실사 우드 & 철제 프레임 공원 벤치 (Park Wooden Slat Benches) */}
      {[-12, 0, 12].map((bz, bidx) => (
        <group key={bidx} position={[14.2, 0.1, bz]} rotation={[0, -Math.PI / 2, 0]}>
          {/* 철제 주물 다리 2개 */}
          {[-0.65, 0.65].map((lx, li) => (
            <group key={li} position={[lx, 0, 0]}>
              <mesh position={[0, 0.24, 0]}>
                <boxGeometry args={[0.06, 0.48, 0.52]} />
                <meshStandardMaterial color="#111722" metalness={0.9} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.55, -0.22]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.06, 0.45, 0.06]} />
                <meshStandardMaterial color="#111722" metalness={0.9} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* 원목 슬랫 시트 (Wood Slats: 4줄) */}
          {[-0.18, -0.06, 0.06, 0.18].map((sy, si) => (
            <mesh key={si} position={[0, 0.48, sy]} castShadow>
              <boxGeometry args={[1.6, 0.035, 0.09]} />
              <meshStandardMaterial color="#795548" roughness={0.65} />
            </mesh>
          ))}

          {/* 원목 등받이 슬랫 (3줄) */}
          {[0.62, 0.72, 0.82].map((hz, hi) => (
            <mesh key={hi} position={[0, hz, -0.22 - (hi * 0.02)]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[1.6, 0.08, 0.035]} />
              <meshStandardMaterial color="#795548" roughness={0.65} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 6. 공원 나무들 (실사 3D 수관 볼륨 & 나뭇가지 굴곡 & 질감) */}
      {trees.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          {/* 줄기 (Trunk: 표면 수피 텍스처 톤) */}
          <mesh position={[0, t.trunkHeight * 0.5, 0]} castShadow>
            <cylinderGeometry args={[t.trunkRadius * 0.72, t.trunkRadius, t.trunkHeight, 10]} />
            <meshStandardMaterial color="#3b2c20" roughness={0.95} />
          </mesh>

          {/* 뿌리 노출 디테일 */}
          <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[t.trunkRadius * 1.1, t.trunkRadius * 1.6, 0.16, 6]} />
            <meshStandardMaterial color="#2d2218" roughness={0.95} />
          </mesh>

          {t.type === 'broadleaf' ? (
            // 활엽수(느티/단풍나무): 3단 다중 스피어 볼륨으로 풍성한 캐노피 형성
            <group position={[0, t.trunkHeight + t.crownHeight * 0.35, 0]}>
              <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[t.crownRadius, 14, 14]} />
                <meshStandardMaterial color={t.foliageColor} roughness={0.82} />
              </mesh>
              <mesh position={[t.crownRadius * 0.3, t.crownHeight * 0.28, t.crownRadius * 0.2]} castShadow>
                <sphereGeometry args={[t.crownRadius * 0.72, 12, 12]} />
                <meshStandardMaterial color={t.foliageColor} roughness={0.82} />
              </mesh>
              <mesh position={[-t.crownRadius * 0.25, t.crownHeight * 0.25, -t.crownRadius * 0.2]} castShadow>
                <sphereGeometry args={[t.crownRadius * 0.7, 12, 12]} />
                <meshStandardMaterial color={t.foliageColor} roughness={0.82} />
              </mesh>
            </group>
          ) : (
            // 침엽수(소나무): 3단 원뿔 콘형 수형
            <group position={[0, t.trunkHeight, 0]}>
              <mesh position={[0, t.crownHeight * 0.3, 0]} castShadow>
                <coneGeometry args={[t.crownRadius, t.crownHeight * 0.65, 10]} />
                <meshStandardMaterial color={t.foliageColor} roughness={0.85} />
              </mesh>
              <mesh position={[0, t.crownHeight * 0.55, 0]} castShadow>
                <coneGeometry args={[t.crownRadius * 0.78, t.crownHeight * 0.55, 10]} />
                <meshStandardMaterial color={t.foliageColor} roughness={0.85} />
              </mesh>
              <mesh position={[0, t.crownHeight * 0.78, 0]} castShadow>
                <coneGeometry args={[t.crownRadius * 0.52, t.crownHeight * 0.45, 10]} />
                <meshStandardMaterial color={t.foliageColor} roughness={0.85} />
              </mesh>
            </group>
          )}

          {/* 눈 올 때 나뭇가지/수관 상단에 소복하게 얹힌 리얼 설경 눈 */}
          {isSnow && (
            <mesh position={[0, t.trunkHeight + t.crownHeight * 0.55, 0]}>
              <coneGeometry args={[t.crownRadius * 0.92, t.crownHeight * 0.25, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={0.96} />
            </mesh>
          )}
        </group>
      ))}

      {/* 7. 공원 쪽 아늑하고 평화로운 자연광 & 가로등 앰비언트 (공원 수목 및 산책로 밝기 대폭 보강) */}
      <pointLight position={[20, 10, -12]} color="#fffae6" intensity={2.8} distance={42} decay={1.5} />
      <pointLight position={[20, 10, 12]} color="#fffae6" intensity={2.8} distance={42} decay={1.5} />
      <directionalLight position={[28, 18, 0]} color="#fff3cd" intensity={1.5} />
    </group>
  );
};
