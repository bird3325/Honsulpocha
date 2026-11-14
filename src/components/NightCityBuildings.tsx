import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WeatherMood } from '../types';

interface NightCityBuildingsProps {
  weatherMood?: WeatherMood;
}

interface BuildingData {
  id: number;
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  baseColor: string;
  hasNeonSign?: boolean;
  neonColor?: string;
  neonText?: string;
  neonVertical?: boolean;
  roofSign?: {
    text: string;
    color: string;
    subColor: string;
  };
  windowRows: number;
  windowCols: number;
  windowLitRatio: number; // 0.0 ~ 1.0
  colorPalette: 'warm' | 'cool' | 'mixed' | 'emerald';
}

// 캔버스를 이용해 건물 외벽 창문 그리드 텍스처(불 켜진 창문, 꺼진 창문)를 생성
function createBuildingFacadeTexture(
  cols: number,
  rows: number,
  litRatio: number,
  palette: 'warm' | 'cool' | 'mixed' | 'emerald'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return dummy;
  }

  // 건물 콘크리트 외벽 기본색 (어두운 회색/남색 밤 톤)
  ctx.fillStyle = '#0f141d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padX = 14;
  const padY = 16;
  const usableW = canvas.width - padX * 2;
  const usableH = canvas.height - padY * 2;

  const winW = usableW / cols;
  const winH = usableH / rows;

  const warmColors = ['#f5cd79', '#ffeaa7', '#fdcb6e', '#fab1a0', '#ff9f43'];
  const coolColors = ['#74b9ff', '#81ecec', '#a29bfe', '#dfe6e9'];
  const emeraldColors = ['#55efc4', '#81ecec', '#00cec9', '#ffeaa7'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() < litRatio;
      const x = padX + c * winW + winW * 0.15;
      const y = padY + r * winH + winH * 0.18;
      const w = winW * 0.7;
      const h = winH * 0.64;

      if (isLit) {
        let winColor = '#ffeaa7';
        if (palette === 'warm') {
          winColor = warmColors[Math.floor(Math.random() * warmColors.length)];
        } else if (palette === 'cool') {
          winColor = coolColors[Math.floor(Math.random() * coolColors.length)];
        } else if (palette === 'emerald') {
          winColor = emeraldColors[Math.floor(Math.random() * emeraldColors.length)];
        } else {
          // mixed
          winColor = Math.random() > 0.35
            ? warmColors[Math.floor(Math.random() * warmColors.length)]
            : coolColors[Math.floor(Math.random() * coolColors.length)];
        }

        // 창문 빛
        ctx.fillStyle = winColor;
        ctx.fillRect(x, y, w, h);

        // 창문 블라인드/커튼 디테일 음영
        if (Math.random() > 0.4) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          const blindH = h * (0.2 + Math.random() * 0.4);
          ctx.fillRect(x, y, w, blindH);
        }
      } else {
        // 소등된 어두운 유리창
        ctx.fillStyle = '#18202c';
        ctx.fillRect(x, y, w, h);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 네온 간판 캔버스 텍스처 생성기 (한국 도시 야경의 정겨운 감성 네온/돌출간판)
function createSignTexture(
  text: string,
  textColor: string,
  bgColor: string,
  isVertical: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  if (isVertical) {
    canvas.width = 128;
    canvas.height = 384;
  } else {
    canvas.width = 384;
    canvas.height = 128;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 간판 바탕색
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 간판 외곽 네온 테두리
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // 텍스트 네온 발광
  ctx.shadowColor = textColor;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';

  if (isVertical) {
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = text.split('');
    const step = canvas.height / (chars.length + 1);
    chars.forEach((char, idx) => {
      ctx.fillText(char, canvas.width / 2, (idx + 1) * step);
    });
  } else {
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 도심 건물 스펙 데이터:
// ★ 사용자 요구사항: "한쪽 방향에만 건물들이 있고 (좌측 서쪽 도로변 X: -22 ~ -42),
// 건너편(우측 동쪽 X: +10 ~ +40)으로는 평화롭고 고요한 밤의 공원(Park)이 있고,
// 공원 쪽 인도에는 포차가 있고, 포차 바로 옆으로는 도로가 있어 차들이 지나다님!"
const CITY_BUILDINGS: BuildingData[] = [
  // 1차선/2차선 도로 건너편 서쪽(좌측 X: -22 ~ -36) 상가 빌딩가 (Z: -28 ~ +28)
  {
    id: 1,
    x: -24,
    z: -20,
    width: 9,
    height: 24,
    depth: 8,
    baseColor: '#121722',
    hasNeonSign: true,
    neonColor: '#00cec9',
    neonText: '편의점 24',
    neonVertical: false,
    roofSign: { text: 'HOTEL URBAN', color: '#ff7675', subColor: '#ffeaa7' },
    windowRows: 12,
    windowCols: 6,
    windowLitRatio: 0.65,
    colorPalette: 'warm',
  },
  {
    id: 2,
    x: -25,
    z: -10,
    width: 8.5,
    height: 32,
    depth: 9,
    baseColor: '#0d131d',
    roofSign: { text: '종로 빌딩', color: '#74b9ff', subColor: '#55efc4' },
    windowRows: 16,
    windowCols: 5,
    windowLitRatio: 0.6,
    colorPalette: 'mixed',
  },
  {
    id: 3,
    x: -24.5,
    z: 0,
    width: 9,
    height: 28,
    depth: 8.5,
    baseColor: '#111722',
    hasNeonSign: true,
    neonColor: '#e84393',
    neonText: '노래연습장',
    neonVertical: true,
    windowRows: 14,
    windowCols: 6,
    windowLitRatio: 0.7,
    colorPalette: 'warm',
  },
  {
    id: 4,
    x: -25,
    z: 10,
    width: 8.5,
    height: 25,
    depth: 9,
    baseColor: '#141a26',
    hasNeonSign: true,
    neonColor: '#ff7675',
    neonText: '골목식당',
    neonVertical: true,
    windowRows: 12,
    windowCols: 5,
    windowLitRatio: 0.75,
    colorPalette: 'warm',
  },
  {
    id: 5,
    x: -24,
    z: 20,
    width: 9,
    height: 26,
    depth: 8,
    baseColor: '#0f1520',
    hasNeonSign: true,
    neonColor: '#fdcb6e',
    neonText: '호프 & 펍',
    neonVertical: true,
    roofSign: { text: 'SEOUL TOWER PLAZA', color: '#ff9f43', subColor: '#ffeaa7' },
    windowRows: 13,
    windowCols: 6,
    windowLitRatio: 0.65,
    colorPalette: 'warm',
  },

  // 서쪽 2열 후면 고층 오피스 빌딩군 (X: -34 ~ -38)
  {
    id: 6,
    x: -35,
    z: -15,
    width: 10,
    height: 36,
    depth: 10,
    baseColor: '#0b1019',
    roofSign: { text: 'FINANCE CENTER', color: '#74b9ff', subColor: '#81ecec' },
    windowRows: 18,
    windowCols: 6,
    windowLitRatio: 0.75,
    colorPalette: 'cool',
  },
  {
    id: 7,
    x: -36,
    z: 5,
    width: 11,
    height: 42,
    depth: 10,
    baseColor: '#090d16',
    roofSign: { text: 'HONSUL TOWER', color: '#fdcb6e', subColor: '#e17055' },
    windowRows: 20,
    windowCols: 7,
    windowLitRatio: 0.8,
    colorPalette: 'mixed',
  },
  {
    id: 8,
    x: -35,
    z: 24,
    width: 10,
    height: 32,
    depth: 9,
    baseColor: '#0e141e',
    windowRows: 16,
    windowCols: 6,
    windowLitRatio: 0.6,
    colorPalette: 'emerald',
  },
];

// 서쪽 원경 마천루 실루엣 스카이라인 (좌측 한쪽에만 도시 스카이라인 집약)
const SKYLINE_DISTANT = [
  { x: -46, z: -32, w: 15, h: 52, d: 15 },
  { x: -48, z: -16, w: 16, h: 58, d: 16 },
  { x: -50, z: 2, w: 18, h: 66, d: 18 },
  { x: -48, z: 20, w: 16, h: 60, d: 16 },
  { x: -45, z: 36, w: 14, h: 48, d: 14 },
];

export const NightCityBuildings: React.FC<NightCityBuildingsProps> = ({ weatherMood = 'rainy' }) => {
  const neonBlinkRef = useRef<THREE.Group>(null);

  // 네온사인 미세 깜빡임 애니메이션 (비 오는 밤 특유의 감성적인 간판 깜빡임)
  useFrame((state) => {
    if (neonBlinkRef.current) {
      const time = state.clock.elapsedTime;
      neonBlinkRef.current.children.forEach((child, i) => {
        // 일부 네온사인에 미세한 불규칙 글리치/펄스 효과
        if (i % 2 === 0) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat) {
            // 부드러운 호흡 펄스 + 빗물 전기 미세 떨림
            const flicker = Math.sin(time * 3 + i * 1.7) * 0.15 + (Math.sin(time * 19 + i * 5) > 0.94 ? -0.25 : 0.05);
            mat.opacity = Math.max(0.65, Math.min(1.0, 0.9 + flicker));
          }
        }
      });
    }
  });

  // 각 건물별 텍스처 메모이제이션
  const buildingMaterials = useMemo(() => {
    return CITY_BUILDINGS.map((b) => {
      const tex = createBuildingFacadeTexture(
        b.windowCols,
        b.windowRows,
        b.windowLitRatio,
        b.colorPalette
      );

      // 벽면 매터리얼 (야간 창문이 환하게 발광하도록 emissiveMap 적용)
      const mat = new THREE.MeshStandardMaterial({
        color: b.baseColor,
        roughness: 0.65,
        metalness: 0.2,
        map: tex,
        emissive: new THREE.Color(b.colorPalette === 'warm' ? '#4a3818' : '#1e375a'),
        emissiveMap: tex,
        emissiveIntensity: weatherMood === 'snowy' ? 0.75 : 0.95,
      });

      return { id: b.id, material: mat };
    });
  }, [weatherMood]);

  // 간판 텍스처 메모이제이션
  const signTextures = useMemo(() => {
    return CITY_BUILDINGS.filter((b) => b.hasNeonSign || b.roofSign).map((b) => {
      let wallTex: THREE.CanvasTexture | null = null;
      let roofTex: THREE.CanvasTexture | null = null;

      if (b.hasNeonSign && b.neonText && b.neonColor) {
        wallTex = createSignTexture(
          b.neonText,
          b.neonColor,
          '#111722',
          b.neonVertical ?? false
        );
      }

      if (b.roofSign) {
        roofTex = createSignTexture(
          b.roofSign.text,
          b.roofSign.color,
          '#090d16',
          false
        );
      }

      return {
        id: b.id,
        wallTex,
        roofTex,
      };
    });
  }, []);

  return (
    <group>
      {/* 1. 근경 및 중경 도심 빌딩군 (포차 텐트 투명창 너머로 창문 불빛이 훤히 보이는 빌딩들) */}
      {CITY_BUILDINGS.map((b) => {
        const matObj = buildingMaterials.find((m) => m.id === b.id);
        const signObj = signTextures.find((s) => s.id === b.id);

        return (
          <group key={b.id} position={[b.x, 0, b.z]}>
            {/* 건물 메인 박스 */}
            <mesh position={[0, b.height / 2, 0]} material={matObj?.material} castShadow receiveShadow>
              <boxGeometry args={[b.width, b.height, b.depth]} />
            </mesh>

            {/* 옥상 턱 (루프탑 난간) */}
            <mesh position={[0, b.height + 0.3, 0]}>
              <boxGeometry args={[b.width + 0.3, 0.6, b.depth + 0.3]} />
              <meshStandardMaterial color="#0b0e14" roughness={0.8} />
            </mesh>

            {/* 옥상 기계실 / 엘리베이터 타워 */}
            <mesh position={[0, b.height + 1.8, 0]}>
              <boxGeometry args={[b.width * 0.45, 2.4, b.depth * 0.45]} />
              <meshStandardMaterial color="#141a24" roughness={0.7} />
            </mesh>

            {/* 옥상 항공장애등 (Red Beacon Light: 자체 발광 매질) */}
            <mesh position={[0, b.height + 3.1, 0]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshBasicMaterial color="#ff3838" />
            </mesh>

            {/* 옥상 대형 네온 루프 간판 (Roof Billboard Sign) */}
            {b.roofSign && signObj?.roofTex && (
              <group position={[0, b.height + 3.2, 0]}>
                {/* 간판 지지 철골 트러스 */}
                <mesh position={[0, -1.2, 0]}>
                  <boxGeometry args={[b.width * 0.6, 2.0, 0.2]} />
                  <meshStandardMaterial color="#2d3436" metalness={0.8} />
                </mesh>
                {/* 간판 앞면 */}
                <mesh position={[0, 0, 0.15]}>
                  <planeGeometry args={[b.width * 0.7, 1.8]} />
                  <meshBasicMaterial map={signObj.roofTex} />
                </mesh>
                {/* 간판 뒷면 */}
                <mesh position={[0, 0, -0.15]} rotation={[0, Math.PI, 0]}>
                  <planeGeometry args={[b.width * 0.7, 1.8]} />
                  <meshBasicMaterial map={signObj.roofTex} />
                </mesh>
              </group>
            )}

            {/* 외벽 돌출 네온 간판 (Korean Wall Neon Sign: 자체 발광 텍스처) */}
            {b.hasNeonSign && signObj?.wallTex && (
              <group
                position={[
                  b.x > 0 ? -b.width / 2 - 0.45 : b.width / 2 + 0.45,
                  b.neonVertical ? 7.5 : 5.5,
                  b.z > 0 ? -b.depth / 2 + 1.5 : b.depth / 2 - 1.5,
                ]}
                rotation={[0, b.neonVertical ? (b.x > 0 ? Math.PI / 2 : -Math.PI / 2) : 0, 0]}
              >
                {/* 간판 브래킷 */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.08, 0.08, 0.6]} />
                  <meshStandardMaterial color="#2d3436" metalness={0.9} />
                </mesh>
                {/* 네온 사인 보드 */}
                <mesh position={[0, 0, 0.4]}>
                  <boxGeometry
                    args={[
                      b.neonVertical ? 0.9 : 3.2,
                      b.neonVertical ? 3.2 : 0.9,
                      0.12,
                    ]}
                  />
                  <meshBasicMaterial map={signObj.wallTex} transparent />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* 2. 원경 마천루 실루엣 스카이라인 (아득한 서울 밤하늘 스카이라인) */}
      {SKYLINE_DISTANT.map((sky, si) => (
        <group key={si} position={[sky.x, 0, sky.z]}>
          <mesh position={[0, sky.h / 2, 0]}>
            <boxGeometry args={[sky.w, sky.h, sky.d]} />
            <meshStandardMaterial
              color="#080c14"
              roughness={0.9}
              emissive="#091220"
              emissiveIntensity={0.35}
            />
          </mesh>
          {/* 원경 타워 상단 빨간 점등 비콘 */}
          <mesh position={[0, sky.h + 0.5, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color="#e74c3c" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

