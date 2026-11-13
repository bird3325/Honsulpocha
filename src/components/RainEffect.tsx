import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WeatherMood } from '../types';

interface WeatherEffectProps {
  weatherMood?: WeatherMood;
}

// 포차 텐트 경계 치수 (X: ±6.7m, Z: ±5.4m, 지붕 처마 높이: 3.5m, 용마루 높이: 5.6m)
const TENT_HALF_X = 6.7;
const TENT_HALF_Z = 5.4;
const ROOF_EAVES_Y = 3.5;
const ROOF_APEX_Y = 5.6;

// 주어진 (x, z) 위치에서 텐트 지붕의 높이 계산
function getTentRoofHeight(x: number, z: number): number {
  const normX = Math.abs(x) / TENT_HALF_X;
  const normZ = Math.abs(z) / TENT_HALF_Z;
  if (normX <= 1.0 && normZ <= 1.0) {
    const pyramidFactor = Math.max(0, 1 - Math.max(normX, normZ));
    return ROOF_EAVES_Y + (ROOF_APEX_Y - ROOF_EAVES_Y) * pyramidFactor;
  }
  return 0; // 텐트 바깥
}

// 빗방울 바닥/지붕 물 튀김 (Splash Ripple) 개수
const SPLASH_COUNT = 45;

export const WeatherEffect: React.FC<WeatherEffectProps> = ({ weatherMood = 'rainy' }) => {
  const count = 1100;
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  // 물 튀김 링 메시 참조들
  const splashRipplesRef = useRef<THREE.InstancedMesh>(null);
  const splashData = useRef<
    { x: number; y: number; z: number; scale: number; opacity: number; active: boolean }[]
  >([]);

  // 1. 파티클 기본 데이터 초기화
  const [positions, speeds, seeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const sd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * 36;
      let z = (Math.random() - 0.5) * 36;
      let y = 3.0 + Math.random() * 12;

      // 초기화 시에도 절대 텐트 내부에 파티클이 위치하지 않도록 보정
      const roofH = getTentRoofHeight(x, z);
      if (roofH > 0 && y < roofH) {
        y = roofH + 0.5 + Math.random() * 8; // 지붕 위 공중으로 올림
      }

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      spd[i] = 0.14 + Math.random() * 0.14; // 낙하 속도
      sd[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, sd];
  }, []);

  // 물 튀김 리플 데이터 초기화
  useEffect(() => {
    splashData.current = Array.from({ length: SPLASH_COUNT }, () => ({
      x: 0,
      y: 0,
      z: 0,
      scale: 0,
      opacity: 0,
      active: false,
    }));
  }, []);

  // 2. 날씨 테마별 파티클 머티리얼 속성 동기화
  useEffect(() => {
    if (!materialRef.current) return;
    if (weatherMood === 'rainy') {
      materialRef.current.color.set('#bdc3c7');
      materialRef.current.size = 0.055;
      materialRef.current.opacity = 0.55;
    } else if (weatherMood === 'snowy') {
      materialRef.current.color.set('#ffffff');
      materialRef.current.size = 0.15; // 포근한 함박눈송이
      materialRef.current.opacity = 0.92;
    } else if (weatherMood === 'sunset') {
      materialRef.current.color.set('#fbc531');
      materialRef.current.size = 0.08;
      materialRef.current.opacity = 0.45;
    } else {
      // starry
      materialRef.current.color.set('#dff9fb');
      materialRef.current.size = 0.07;
      materialRef.current.opacity = 0.55;
    }
  }, [weatherMood]);

  // 임시 Three.js 객체
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 물 튀김 발생 헬퍼
  const triggerSplash = (x: number, y: number, z: number) => {
    const inactiveSplash = splashData.current.find((s) => !s.active);
    if (inactiveSplash) {
      inactiveSplash.x = x;
      inactiveSplash.y = y;
      inactiveSplash.z = z;
      inactiveSplash.scale = 0.05;
      inactiveSplash.opacity = 0.8;
      inactiveSplash.active = true;
    }
  };

  // 3. 실시간 프레임 물리 시뮬레이션
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array as Float32Array;
    const time = state.clock.elapsedTime;

    const isRain = weatherMood === 'rainy';
    const isSnow = weatherMood === 'snowy';

    if (isRain) {
      // 비: 세차게 수직 낙하 + 지붕/바닥 충돌 감지 & 천막 내부 완벽 차단
      for (let i = 0; i < count; i++) {
        array[i * 3 + 1] -= speeds[i] * 1.8; // 시원한 비 낙하
        array[i * 3 + 0] += 0.012; // 미세한 바람 편향

        const x = array[i * 3 + 0];
        const y = array[i * 3 + 1];
        const z = array[i * 3 + 2];

        const roofH = getTentRoofHeight(x, z);

        if (roofH > 0) {
          // [텐트 위 영역] 지붕 표면에 닿으면 즉시 튀고 재순환 (천막 내부 침투 절대 불가!)
          if (y <= roofH + 0.05) {
            if (Math.random() < 0.25) {
              triggerSplash(x, roofH + 0.04, z);
            }
            // 다시 하늘 높이로 재배치
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        } else {
          // [길거리 영역] 바닥에 닿으면 물 튀김 발생
          if (y <= 0.05) {
            if (Math.random() < 0.3) {
              triggerSplash(x, 0.06, z);
            }
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        }
      }
    } else if (isSnow) {
      // 눈: 공중에서 살랑살랑 나풀거리며(sway) 내림 + 지붕/바닥 착지
      for (let i = 0; i < count; i++) {
        const snowSpeed = 0.025 + speeds[i] * 0.12;
        array[i * 3 + 1] -= snowSpeed;

        array[i * 3 + 0] += Math.sin(time * 1.4 + seeds[i]) * 0.01;
        array[i * 3 + 2] += Math.cos(time * 1.1 + seeds[i]) * 0.008;

        const x = array[i * 3 + 0];
        const y = array[i * 3 + 1];
        const z = array[i * 3 + 2];

        const roofH = getTentRoofHeight(x, z);

        if (roofH > 0) {
          // 눈이 텐트 지붕에 닿으면 지붕에 내려앉으며 재순환 (천막 내부 침투 차단)
          if (y <= roofH + 0.06) {
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        } else {
          // 길거리 바닥에 도달하면 재순환
          if (y <= 0.05) {
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        }
      }
    } else {
      // sunset, starry: 밤하늘 떠다니는 은은한 반딧불 빛가루
      for (let i = 0; i < count; i++) {
        array[i * 3 + 1] += Math.sin(time * 0.8 + seeds[i]) * 0.004;
        array[i * 3 + 0] += Math.cos(time * 0.6 + seeds[i]) * 0.003;
        array[i * 3 + 2] += Math.sin(time * 0.7 + seeds[i]) * 0.003;

        // 텐트 내부로 들어가지 않도록 보호
        const roofH = getTentRoofHeight(array[i * 3 + 0], array[i * 3 + 2]);
        if (roofH > 0 && array[i * 3 + 1] < roofH) {
          array[i * 3 + 1] = roofH + 0.5;
        }
      }
    }

    posAttr.needsUpdate = true;

    // 4. 비 올 때 바닥/지붕 물 튀김 리플(Splash Ripples) 애니메이션
    if (splashRipplesRef.current && isRain) {
      splashData.current.forEach((s, idx) => {
        if (s.active) {
          s.scale += delta * 1.5;
          s.opacity -= delta * 2.2;
          if (s.opacity <= 0) {
            s.active = false;
            s.scale = 0;
            s.opacity = 0;
          }

          dummy.position.set(s.x, s.y, s.z);
          dummy.rotation.x = -Math.PI / 2;
          dummy.scale.set(s.scale, s.scale, s.scale);
          dummy.updateMatrix();
          splashRipplesRef.current!.setMatrixAt(idx, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          splashRipplesRef.current!.setMatrixAt(idx, dummy.matrix);
        }
      });
      splashRipplesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 빗방울 / 눈송이 메인 파티클 */}
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
          ref={materialRef}
          size={0.055}
          color="#a5b1c2"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>

      {/* 비 올 때 찰방거리며 퍼져나가는 물 튀김 원형 리플들 (Splash InstancedMesh) */}
      {weatherMood === 'rainy' && (
        <instancedMesh
          ref={splashRipplesRef}
          args={[undefined, undefined, SPLASH_COUNT]}
        >
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial
            color="#dfe6e9"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </instancedMesh>
      )}
    </group>
  );
};

// 하위 호환성 유지
export const RainEffect = WeatherEffect;
