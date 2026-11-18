import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// 1. 유성우(별똥별) 개수 및 데이터 구조
const METEOR_COUNT = 14;

interface MeteorData {
  x: number;
  y: number;
  z: number;
  speed: number;
  length: number;
  life: number;
  maxLife: number;
  delay: number;
  active: boolean;
}

export const StarrySkyWithMeteors: React.FC = () => {
  // --- A. 밤하늘의 무수히 많은 별들 (Deep Night Stars: 2,800개) ---
  const starCount = 2800;
  const starsRef = useRef<THREE.Points>(null);

  const [starPositions, starColors, starSizes] = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const sz = new Float32Array(starCount);

    const white = new THREE.Color('#ffffff');
    const diamondBlue = new THREE.Color('#dff9fb');
    const warmStar = new THREE.Color('#fff2a8');

    for (let i = 0; i < starCount; i++) {
      // 돔 형태의 상공 분포 (반경 35m ~ 95m, 고도 Y: 12m ~ 60m)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 38 + Math.random() * 55;

      // 상반구(하늘)에만 집중 배치
      const y = Math.max(11, Math.abs(radius * Math.cos(phi)));
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // 85%는 영롱한 다이아몬드 블루/백색, 15%는 따뜻한 별빛
      const pick = Math.random();
      const starColor = pick > 0.85 ? warmStar : pick > 0.4 ? diamondBlue : white;
      col[i * 3 + 0] = starColor.r;
      col[i * 3 + 1] = starColor.g;
      col[i * 3 + 2] = starColor.b;

      sz[i] = 0.12 + Math.random() * 0.18;
    }
    return [pos, col, sz];
  }, [starCount]);

  // --- B. 유성우 (별똥별 - Shooting Stars) 시스템 ---
  const meteorsRef = useRef<THREE.Group>(null);
  const meteorRodsRef = useRef<(THREE.Group | null)[]>([]);

  // 유성우 진행 방향 벡터 (북동쪽 상공에서 남서쪽 지상으로 시원하게 대각선 하강)
  const meteorDir = useMemo(() => new THREE.Vector3(-0.75, -0.45, 0.48).normalize(), []);

  // 유성 꼬리의 회전각 (원뿔/선형 메쉬가 진행 방향을 바라보도록 정렬)
  const meteorRotation = useMemo(() => {
    const rot = new THREE.Euler();
    // 진행 반대 방향으로 꼬리가 뻗도록 세팅
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), meteorDir);
    rot.setFromQuaternion(q);
    return rot;
  }, [meteorDir]);

  // 유성 데이터 초기화 (랜덤 딜레이와 다양한 궤적)
  const meteors = useRef<MeteorData[]>([]);
  useMemo(() => {
    meteors.current = Array.from({ length: METEOR_COUNT }, (_, idx) => {
      return {
        x: (Math.random() - 0.4) * 50 + 15,
        y: 24 + Math.random() * 16,
        z: (Math.random() - 0.6) * 50 - 10,
        speed: 35 + Math.random() * 22, // 초당 35m ~ 57m의 매우 빠른 유성
        length: 2.8 + Math.random() * 2.6, // 꼬리 길이
        life: 0,
        maxLife: 0.55 + Math.random() * 0.45, // 0.55초 ~ 1.0초 동안 반짝이고 소멸
        delay: idx * 0.35 + Math.random() * 2.2, // 시간차를 두고 번갈아 떨어짐
        active: false,
      };
    });
  }, []);

  // --- C. 실시간 프레임 애니메이션 ---
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // 1. 별들의 미세한 밤하늘 자전 및 반짝임
    if (starsRef.current) {
      starsRef.current.rotation.y = time * 0.003; // 고요한 밤하늘 자전
    }

    // 2. 유성우 낙하 물리 시뮬레이션
    meteors.current.forEach((m, idx) => {
      const rod = meteorRodsRef.current[idx];
      if (!rod) return;

      if (!m.active) {
        m.delay -= delta;
        if (m.delay <= 0) {
          // 새로운 유성 활성화! 상공 무작위 위치에서 출발
          m.x = (Math.random() - 0.35) * 55 + 18;
          m.y = 23 + Math.random() * 15;
          m.z = (Math.random() - 0.6) * 55 - 12;
          m.speed = 36 + Math.random() * 22;
          m.length = 3.0 + Math.random() * 2.5;
          m.maxLife = 0.5 + Math.random() * 0.5;
          m.life = m.maxLife;
          m.active = true;
          rod.visible = true;
        } else {
          rod.visible = false;
          return;
        }
      }

      // 유성 이동
      m.life -= delta;
      const moveDist = m.speed * delta;
      m.x += meteorDir.x * moveDist;
      m.y += meteorDir.y * moveDist;
      m.z += meteorDir.z * moveDist;

      rod.position.set(m.x, m.y, m.z);

      // 생명 주기에 따른 빛의 밝기 (처음에 확 밝아졌다가 꼬리를 끌며 서서히 페이드아웃)
      const progress = 1 - m.life / m.maxLife;
      let alpha = 1.0;
      if (progress < 0.2) {
        alpha = progress / 0.2; // 시작 시 순간적으로 점화
      } else {
        alpha = Math.max(0, 1 - (progress - 0.2) / 0.8); // 부드럽게 소멸
      }

      // 스케일 조절 (길이 및 페이드)
      rod.scale.set(alpha, alpha * m.length, alpha);

      // 소멸 시 다음 유성 딜레이 부여 후 비활성화
      if (m.life <= 0 || m.y < 3.0) {
        m.active = false;
        m.delay = 0.6 + Math.random() * 3.5; // 0.6 ~ 4초 후 다시 새로운 별똥별 발생
        rod.visible = false;
      }
    });
  });

  return (
    <group>
      {/* 1. 밤하늘 가득 쏟아지는 2,800개의 반짝이는 별들 */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={starCount} array={starPositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={starCount} array={starColors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          vertexColors
          transparent
          opacity={0.88}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 2. 밤하늘을 가로지르는 환상적인 유성우 (별똥별 무리) */}
      <group ref={meteorsRef}>
        {meteors.current.map((_, idx) => (
          <group
            key={idx}
            ref={(el) => {
              meteorRodsRef.current[idx] = el;
            }}
            rotation={meteorRotation}
            visible={false}
          >
            {/* 유성 핵 (가장 밝게 빛나는 머리) */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* 유성 머리 광채(Glow) */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshBasicMaterial color="#c7ecee" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* 유성 꼬리 (가늘고 길게 뻗어나가는 빛의 자국) */}
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.008, 0.045, 1.0, 6]} />
              <meshBasicMaterial
                color="#7ed6df"
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            {/* 꼬리 끝부분의 희미한 잔상 */}
            <mesh position={[0, -0.9, 0]}>
              <cylinderGeometry args={[0.002, 0.02, 0.8, 6]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
