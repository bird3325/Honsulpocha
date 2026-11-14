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

// 주어진 (x, z) 위치에서 텐트 지붕의 높이 계산 (텐트 내부 침투 차단)
function getTentRoofHeight(x: number, z: number): number {
  const normX = Math.abs(x) / TENT_HALF_X;
  const normZ = Math.abs(z) / TENT_HALF_Z;
  if (normX <= 1.0 && normZ <= 1.0) {
    const pyramidFactor = Math.max(0, 1 - Math.max(normX, normZ));
    return ROOF_EAVES_Y + (ROOF_APEX_Y - ROOF_EAVES_Y) * pyramidFactor;
  }
  return 0; // 텐트 바깥
}

// 주어진 (x, z) 위치에서 정확한 바닥 지면 높이 계산 (보도블럭 0.155m, 도로 0.015m)
function getGroundSurfaceHeight(x: number, _z: number): number {
  // 1. 포차 길 및 공원 보도블럭 인도 (X: -10.4 ~ +9.0) -> 표면 Y = 0.155m
  if (x >= -10.4 && x <= 9.0) {
    return 0.155;
  }
  // 2. 도로 건너편 상가 인도 (X <= -19.7) -> 표면 Y = 0.165m
  if (x <= -19.7) {
    return 0.165;
  }
  // 3. 차도 아스팔트 바닥 -> 표면 Y = 0.015m
  return 0.015;
}

// 빗방울 물결 파문(Splash Ripple) 및 튀어오르는 물방울(Droplets) 개수
const SPLASH_COUNT = 140;
const DROPLET_COUNT = 70;

// 단풍잎 모양 절차적 알파 텍스처 (캔버스로 실제 단풍잎 엽맥과 5갈래 잎 모양 생성)
function createMapleLeafTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    ctx.save();
    ctx.translate(64, 64);

    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
    grad.addColorStop(0, '#e84118');
    grad.addColorStop(0.5, '#ea2027');
    grad.addColorStop(0.85, '#f39c12');
    grad.addColorStop(1, '#d35400');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 50);

    const lobes = [
      { x: -38, y: 18 },
      { x: -48, y: -8 },
      { x: -44, y: -30 },
      { x: -18, y: -24 },
      { x: 0, y: -54 },
      { x: 18, y: -24 },
      { x: 44, y: -30 },
      { x: 48, y: -8 },
      { x: 38, y: 18 },
    ];

    lobes.forEach((pt) => {
      ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(0, -45);
    ctx.moveTo(0, 10);
    ctx.lineTo(-35, -15);
    ctx.moveTo(0, 10);
    ctx.lineTo(35, -15);
    ctx.moveTo(0, 25);
    ctx.lineTo(-30, 8);
    ctx.moveTo(0, 25);
    ctx.lineTo(30, 8);
    ctx.stroke();

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export const WeatherEffect: React.FC<WeatherEffectProps> = ({ weatherMood = 'rainy' }) => {
  const count = 1200;
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  // 단풍잎 텍스처
  const mapleTexture = useMemo(() => createMapleLeafTexture(), []);

  // 물 튀김 링 메시 & 튀어오르는 물방울 메시 참조
  const splashRipplesRef = useRef<THREE.InstancedMesh>(null);
  const splashDropletsRef = useRef<THREE.InstancedMesh>(null);

  const splashData = useRef<
    { x: number; y: number; z: number; scale: number; maxScale: number; life: number; speed: number; active: boolean }[]
  >([]);

  const dropletData = useRef<
    { x: number; y: number; z: number; baseY: number; vx: number; vy: number; vz: number; life: number; active: boolean }[]
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
        y = roofH + 0.5 + Math.random() * 8;
      }

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      spd[i] = 0.16 + Math.random() * 0.15; // 낙하 속도
      sd[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, sd];
  }, [count]);

  // 물 튀김 리플 및 물방울 데이터 초기화
  useEffect(() => {
    splashData.current = Array.from({ length: SPLASH_COUNT }, () => ({
      x: 0,
      y: 0,
      z: 0,
      scale: 0,
      maxScale: 0.35,
      life: 0,
      speed: 1.2,
      active: false,
    }));

    dropletData.current = Array.from({ length: DROPLET_COUNT }, () => ({
      x: 0,
      y: 0,
      z: 0,
      baseY: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      active: false,
    }));
  }, []);

  // 2. 날씨 테마별 파티클 머티리얼 속성 동기화
  useEffect(() => {
    if (!materialRef.current) return;
    if (weatherMood === 'rainy') {
      materialRef.current.map = null;
      materialRef.current.color.set('#c7ecee');
      materialRef.current.size = 0.08; // 바닥에 시원하게 내리꽂히는 빗줄기 입체감
      materialRef.current.opacity = 0.72;
    } else if (weatherMood === 'snowy') {
      materialRef.current.map = null;
      materialRef.current.color.set('#ffffff');
      materialRef.current.size = 0.15; // 포근한 함박눈송이
      materialRef.current.opacity = 0.92;
    } else if (weatherMood === 'autumn') {
      materialRef.current.map = mapleTexture;
      materialRef.current.color.set('#ffffff');
      materialRef.current.size = 0.35;
      materialRef.current.opacity = 0.96;
    } else if (weatherMood === 'sunset') {
      materialRef.current.map = null;
      materialRef.current.color.set('#fbc531');
      materialRef.current.size = 0.08;
      materialRef.current.opacity = 0.45;
    } else {
      // starry
      materialRef.current.map = null;
      materialRef.current.color.set('#dff9fb');
      materialRef.current.size = 0.07;
      materialRef.current.opacity = 0.55;
    }
    materialRef.current.needsUpdate = true;
  }, [weatherMood, mapleTexture]);

  // 임시 Three.js 객체
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const rippleColor = useMemo(() => new THREE.Color(), []);

  // 바닥 빗물 충돌 시 동심원 파문 & 튀어오르는 물방울 발생 헬퍼
  const triggerSplash = (x: number, y: number, z: number) => {
    // 1. 바닥 원형 동심원 물결 파문 (Expanding Ripple)
    const inactiveSplash = splashData.current.find((s) => !s.active);
    if (inactiveSplash) {
      inactiveSplash.x = x;
      inactiveSplash.y = y + 0.004; // 바닥 z-fighting 방지 미세 오프셋
      inactiveSplash.z = z;
      inactiveSplash.scale = 0.06;
      inactiveSplash.maxScale = 0.28 + Math.random() * 0.22; // 0.28m ~ 0.5m까지 시원하게 퍼짐
      inactiveSplash.life = 1.0;
      inactiveSplash.speed = 1.6 + Math.random() * 0.8;
      inactiveSplash.active = true;
    }

    // 2. 바닥에 탁 부딪혀 사방으로 튀어오르는 물방울 (Splash Droplet)
    if (Math.random() < 0.6) {
      const inactiveDrop = dropletData.current.find((d) => !d.active);
      if (inactiveDrop) {
        inactiveDrop.x = x;
        inactiveDrop.y = y + 0.01;
        inactiveDrop.baseY = y;
        inactiveDrop.z = z;
        const angle = Math.random() * Math.PI * 2;
        const horizSpeed = 0.35 + Math.random() * 0.45;
        inactiveDrop.vx = Math.cos(angle) * horizSpeed;
        inactiveDrop.vy = 0.9 + Math.random() * 0.7; // 위로 튀어오름
        inactiveDrop.vz = Math.sin(angle) * horizSpeed;
        inactiveDrop.life = 1.0;
        inactiveDrop.active = true;
      }
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
    const isAutumn = weatherMood === 'autumn';

    if (isRain) {
      // 비: 세차게 수직 낙하 + 지붕/바닥 충돌 감지 & 천막 내부 완벽 차단
      for (let i = 0; i < count; i++) {
        array[i * 3 + 1] -= speeds[i] * 2.2; // 시원한 비 낙하
        array[i * 3 + 0] += 0.01; // 미세한 바람 편향

        const x = array[i * 3 + 0];
        const y = array[i * 3 + 1];
        const z = array[i * 3 + 2];

        const roofH = getTentRoofHeight(x, z);

        if (roofH > 0) {
          // [텐트 위 영역] 지붕 표면에 닿으면 즉시 튀고 재순환 (천막 내부 침투 절대 불가!)
          if (y <= roofH + 0.05) {
            if (Math.random() < 0.3) {
              triggerSplash(x, roofH + 0.04, z);
            }
            // 다시 하늘 높이로 재배치
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        } else {
          // [길거리 영역] 정확한 바닥 지면 높이(보도블럭 0.155m, 아스팔트 0.015m) 충돌 감지!
          const groundY = getGroundSurfaceHeight(x, z);
          if (y <= groundY + 0.08) {
            // 바닥에 부딪히는 순간 즉시 생생한 물 튀김 & 파문 생성!
            triggerSplash(x, groundY, z);

            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        }
      }

      // 포차 지붕 처마 끝 낙수 지점(입구 Z=5.38 등)에서도 주기적으로 물 튀김 발생
      if (Math.random() < 0.35) {
        const eavesSpots = [
          [0, 5.38],
          [-2.4, 5.38],
          [2.4, 5.38],
          [-6.7, 0],
          [6.7, 0],
          [-6.7, 4.0],
          [6.7, 4.0],
          [0, -5.38],
        ];
        const spot = eavesSpots[Math.floor(Math.random() * eavesSpots.length)];
        triggerSplash(spot[0] + (Math.random() - 0.5) * 0.4, 0.155, spot[1] + (Math.random() - 0.5) * 0.3);
      }
    } else if (isSnow) {
      // 눈: 공중에서 살랑살랑 나풀거리며 내림
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
          if (y <= roofH + 0.06) {
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        } else {
          const groundY = getGroundSurfaceHeight(x, z);
          if (y <= groundY + 0.03) {
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        }
      }
    } else if (isAutumn) {
      // 가을 낙엽: 춤추듯 회전하며 떨어짐
      for (let i = 0; i < count; i++) {
        const leafSpeed = 0.035 + speeds[i] * 0.22;
        array[i * 3 + 1] -= leafSpeed;

        array[i * 3 + 0] += Math.sin(time * 1.8 + seeds[i]) * 0.025 + 0.008;
        array[i * 3 + 2] += Math.cos(time * 1.4 + seeds[i] * 2) * 0.018;

        const x = array[i * 3 + 0];
        const y = array[i * 3 + 1];
        const z = array[i * 3 + 2];

        const roofH = getTentRoofHeight(x, z);

        if (roofH > 0) {
          if (y <= roofH + 0.06) {
            array[i * 3 + 1] = 12 + Math.random() * 4;
            array[i * 3 + 0] = (Math.random() - 0.5) * 36;
            array[i * 3 + 2] = (Math.random() - 0.5) * 36;
          }
        } else {
          const groundY = getGroundSurfaceHeight(x, z);
          if (y <= groundY + 0.03) {
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
          s.life -= delta * s.speed;
          const progress = 1 - Math.max(0, s.life);
          s.scale = THREE.MathUtils.lerp(0.06, s.maxScale, progress);

          if (s.life <= 0) {
            s.active = false;
            dummy.scale.set(0, 0, 0);
          } else {
            dummy.position.set(s.x, s.y, s.z);
            dummy.rotation.x = -Math.PI / 2;
            dummy.scale.set(s.scale, s.scale, 1);

            const fade = Math.max(0, s.life);
            rippleColor.setRGB(0.7 * fade, 0.88 * fade, 1.0 * fade);
            splashRipplesRef.current!.setColorAt(idx, rippleColor);
          }
          dummy.updateMatrix();
          splashRipplesRef.current!.setMatrixAt(idx, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          splashRipplesRef.current!.setMatrixAt(idx, dummy.matrix);
        }
      });
      splashRipplesRef.current.instanceMatrix.needsUpdate = true;
      if (splashRipplesRef.current.instanceColor) {
        splashRipplesRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 5. 비 올 때 바닥에서 튀어오르는 작은 물방울 파티클(Splash Droplets)
    if (splashDropletsRef.current && isRain) {
      dropletData.current.forEach((d, idx) => {
        if (d.active) {
          d.life -= delta * 2.8;
          d.x += d.vx * delta;
          d.vy -= 7.5 * delta; // 중력 가속도
          d.y += d.vy * delta;
          d.z += d.vz * delta;

          if (d.y <= d.baseY || d.life <= 0) {
            d.active = false;
            dummy.scale.set(0, 0, 0);
          } else {
            dummy.position.set(d.x, d.y, d.z);
            const dropScale = Math.max(0.001, d.life * 0.024);
            dummy.scale.set(dropScale, dropScale * 1.8, dropScale);
          }
          dummy.updateMatrix();
          splashDropletsRef.current!.setMatrixAt(idx, dummy.matrix);
        } else {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          splashDropletsRef.current!.setMatrixAt(idx, dummy.matrix);
        }
      });
      splashDropletsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 빗방울 / 눈송이 메인 낙하 파티클 */}
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
          size={0.08}
          color="#c7ecee"
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </points>

      {/* 비 올 때 바닥에 찰방거리며 점점 퍼져나가는 원형 동심원 물결 파문들 (Splash Ripples) */}
      {weatherMood === 'rainy' && (
        <instancedMesh
          ref={splashRipplesRef}
          args={[undefined, undefined, SPLASH_COUNT]}
        >
          <ringGeometry args={[0.06, 0.14, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </instancedMesh>
      )}

      {/* 비 올 때 바닥에 빗방울이 부딪혀 사방으로 튀어오르는 작은 물방울들 (Splash Droplets) */}
      {weatherMood === 'rainy' && (
        <instancedMesh
          ref={splashDropletsRef}
          args={[undefined, undefined, DROPLET_COUNT]}
        >
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshBasicMaterial
            color="#e3fafc"
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </instancedMesh>
      )}
    </group>
  );
};

// 하위 호환성 유지
export const RainEffect = WeatherEffect;
