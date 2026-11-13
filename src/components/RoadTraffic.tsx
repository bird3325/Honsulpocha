import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { soundManager } from './AudioController';

interface TrafficCarData {
  id: number;
  laneX: number; // 차선 X 좌표 (-13: 남행 1차선, -17: 북행 2차선)
  direction: 1 | -1;
  speed: number;
  bodyColor: string;
  startZ: number;
  type: 'sedan' | 'suv' | 'taxi' | 'sports';
  licensePlate: string;
}

const TRAFFIC_CARS: TrafficCarData[] = [
  // 1차선 (X = -13.2, 포차와 인접한 도로, 남행 -Z 방향)
  { id: 1, laneX: -13.2, direction: -1, speed: 12.0, bodyColor: '#ffffff', startZ: 26, type: 'sedan', licensePlate: '12가 3456' },
  { id: 2, laneX: -13.2, direction: -1, speed: 10.5, bodyColor: '#fa8231', startZ: -6, type: 'taxi', licensePlate: '서울31 바 8921' },

  // 2차선 (X = -17.2, 빌딩 상가 쪽 도로, 북행 +Z 방향)
  { id: 3, laneX: -17.2, direction: 1, speed: 13.0, bodyColor: '#1e272e', startZ: -28, type: 'suv', licensePlate: '34나 7890' },
  { id: 4, laneX: -17.2, direction: 1, speed: 11.5, bodyColor: '#b71540', startZ: 6, type: 'sports', licensePlate: '56다 1234' },
];

export const RoadTraffic: React.FC = () => {
  const carRefs = useRef<(THREE.Group | null)[]>([]);
  const wheelRefs = useRef<(THREE.Group | null)[][]>([[], [], [], []]);
  const lastSoundTime = useRef<number>(0);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    TRAFFIC_CARS.forEach((car, idx) => {
      const grp = carRefs.current[idx];
      if (!grp) return;

      // 도로 주행 이동
      grp.position.z += car.speed * car.direction * delta;

      // 도로 끝에 도달하면 순환 루프 (+42 <-> -42)
      if (car.direction === 1 && grp.position.z > 42) {
        grp.position.z = -42;
      } else if (car.direction === -1 && grp.position.z < -42) {
        grp.position.z = 42;
      }

      // 주행 중 서스펜션 미세 흔들림
      grp.position.y = 0.02 + Math.sin(time * 18 + idx * 2.5) * 0.006;
      grp.rotation.z = Math.sin(time * 12 + idx) * 0.003;

      // 바퀴 회전
      const wheelAngleDelta = (car.speed / 0.32) * delta * car.direction;
      const wheels = wheelRefs.current[idx];
      if (wheels) {
        wheels.forEach((w) => {
          if (w) w.rotation.x += wheelAngleDelta;
        });
      }

      // 포차 부근(Z: -4 ~ +4)을 지나칠 때 촉촉한 빗길/노면 주행음
      if (Math.abs(grp.position.z) < 2.5 && time - lastSoundTime.current > 4.2) {
        lastSoundTime.current = time;
        soundManager.playWetRoadCar();
      }
    });
  });

  return (
    <group>
      {TRAFFIC_CARS.map((car, idx) => {
        const isTaxi = car.type === 'taxi';
        const isSuv = car.type === 'suv';
        const isSports = car.type === 'sports';

        const carLength = isSuv ? 4.7 : isSports ? 4.3 : 4.5;
        const carWidth = isSuv ? 2.05 : 1.95;
        const carHeight = isSuv ? 0.78 : isSports ? 0.52 : 0.62;
        const cabinHeight = isSuv ? 0.65 : isSports ? 0.42 : 0.52;

        return (
          <group
            key={car.id}
            ref={(el) => (carRefs.current[idx] = el)}
            position={[car.laneX, 0, car.startZ]}
            rotation={[0, car.direction === 1 ? 0 : Math.PI, 0]}
          >
            {/* 1. 차량 하부 섀시 & 메인 바디 (곡면 베벨 느낌의 하단 차체) */}
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
              <boxGeometry args={[carWidth, carHeight, carLength]} />
              <meshStandardMaterial
                color={car.bodyColor}
                roughness={0.18}
                metalness={0.82}
              />
            </mesh>

            {/* 범퍼 및 사이드 스커트 (블랙 몰딩) */}
            <mesh position={[0, 0.16, 0]}>
              <boxGeometry args={[carWidth + 0.04, 0.14, carLength + 0.06]} />
              <meshStandardMaterial color="#111722" roughness={0.7} />
            </mesh>

            {/* 전면 라디에이터 크롬 그릴 */}
            <mesh position={[0, 0.44, carLength / 2 + 0.02]}>
              <boxGeometry args={[carWidth * 0.55, 0.24, 0.04]} />
              <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* 2. 캐빈 & 틴팅 유리창 (윈드실드, 측면유리, 리어글래스) */}
            <group position={[0, carHeight + 0.16, isSports ? -0.35 : -0.18]}>
              {/* 캐빈 메인 필러/루프 프레임 */}
              <mesh position={[0, cabinHeight * 0.5, 0]} castShadow>
                <boxGeometry args={[carWidth * 0.88, cabinHeight, carLength * 0.52]} />
                <meshStandardMaterial color={car.bodyColor} roughness={0.2} metalness={0.8} />
              </mesh>

              {/* 전면 유리창 (Windshield: 35도 경사) */}
              <mesh position={[0, cabinHeight * 0.48, (carLength * 0.26) + 0.12]} rotation={[-0.45, 0, 0]}>
                <planeGeometry args={[carWidth * 0.84, cabinHeight * 1.15]} />
                <meshStandardMaterial color="#0b1118" roughness={0.05} metalness={0.95} transparent opacity={0.88} />
              </mesh>

              {/* 후면 유리창 (Rear Window: 30도 경사) */}
              <mesh position={[0, cabinHeight * 0.48, -(carLength * 0.26) - 0.12]} rotation={[0.42, 0, 0]}>
                <planeGeometry args={[carWidth * 0.84, cabinHeight * 1.1]} />
                <meshStandardMaterial color="#0b1118" roughness={0.05} metalness={0.95} transparent opacity={0.88} />
              </mesh>

              {/* 측면 유리창 (좌/우 틴팅 글래스) */}
              <mesh position={[-carWidth * 0.442, cabinHeight * 0.46, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[carLength * 0.48, cabinHeight * 0.88]} />
                <meshStandardMaterial color="#0b1118" roughness={0.05} metalness={0.95} transparent opacity={0.85} />
              </mesh>
              <mesh position={[carWidth * 0.442, cabinHeight * 0.46, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[carLength * 0.48, cabinHeight * 0.88]} />
                <meshStandardMaterial color="#0b1118" roughness={0.05} metalness={0.95} transparent opacity={0.85} />
              </mesh>

              {/* 사이드 미러 (좌/우) */}
              {[-carWidth * 0.47, carWidth * 0.47].map((mx, mi) => (
                <group key={mi} position={[mx, 0.1, carLength * 0.22]}>
                  <mesh>
                    <boxGeometry args={[0.16, 0.08, 0.12]} />
                    <meshStandardMaterial color={car.bodyColor} roughness={0.2} metalness={0.8} />
                  </mesh>
                  {/* 거울 면 */}
                  <mesh position={[mi === 0 ? 0.08 : -0.08, 0, -0.06]}>
                    <planeGeometry args={[0.08, 0.06]} />
                    <meshStandardMaterial color="#dfe6e9" metalness={0.98} roughness={0.02} />
                  </mesh>
                </group>
              ))}
            </group>

            {/* 3. 택시 전용 한국 서울 주황색 택시 갓등 (Roof Taxi Sign) */}
            {isTaxi && (
              <group position={[0, carHeight + cabinHeight + 0.24, -0.15]}>
                {/* 갓등 받침대 */}
                <mesh position={[0, -0.05, 0]}>
                  <boxGeometry args={[0.35, 0.03, 0.18]} />
                  <meshStandardMaterial color="#2d3436" metalness={0.9} />
                </mesh>
                {/* 갓등 조각 캡슐 */}
                <mesh position={[0, 0.06, 0]}>
                  <boxGeometry args={[0.54, 0.18, 0.24]} />
                  <meshStandardMaterial
                    color="#fed330"
                    emissive="#fed330"
                    emissiveIntensity={1.4}
                    roughness={0.3}
                  />
                </mesh>
                <pointLight color="#fed330" intensity={1.5} distance={6} />
              </group>
            )}

            {/* 스포츠카 스포일러 (Rear Wing) */}
            {isSports && (
              <group position={[0, carHeight + 0.15, -carLength * 0.45]}>
                <mesh position={[0, 0.12, 0]}>
                  <boxGeometry args={[carWidth * 0.92, 0.04, 0.22]} />
                  <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
                </mesh>
                {/* 지지대 */}
                {[-0.55, 0.55].map((sx, si) => (
                  <mesh key={si} position={[sx, 0.05, 0]}>
                    <boxGeometry args={[0.04, 0.12, 0.1]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                ))}
              </group>
            )}

            {/* 4. 고해상도 바퀴 4개 (타이어 고무 트레드 + 알로이 휠 림 + 브레이크 캘리퍼) */}
            {[-carWidth * 0.51, carWidth * 0.51].map((wx, wi) =>
              [-carLength * 0.32, carLength * 0.32].map((wz, wzi) => {
                const wheelKey = `${wi}-${wzi}`;
                const wheelIndex = wi * 2 + wzi;

                return (
                  <group
                    key={wheelKey}
                    ref={(el) => {
                      if (!wheelRefs.current[idx]) wheelRefs.current[idx] = [];
                      wheelRefs.current[idx][wheelIndex] = el;
                    }}
                    position={[wx, 0.3, wz]}
                  >
                    {/* 타이어 고무 */}
                    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                      <cylinderGeometry args={[0.3, 0.3, 0.24, 20]} />
                      <meshStandardMaterial color="#1a1e24" roughness={0.92} />
                    </mesh>

                    {/* 실버 알로이 휠 림 */}
                    <mesh position={[wi === 0 ? -0.02 : 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.21, 0.21, 0.22, 16]} />
                      <meshStandardMaterial color="#dfe6e9" metalness={0.9} roughness={0.15} />
                    </mesh>

                    {/* 휠 스포크 십자 패턴 */}
                    {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((ang, ai) => (
                      <mesh key={ai} position={[wi === 0 ? -0.125 : 0.125, 0, 0]} rotation={[ang, 0, 0]}>
                        <boxGeometry args={[0.02, 0.36, 0.03]} />
                        <meshStandardMaterial color="#b2bec3" metalness={0.95} />
                      </mesh>
                    ))}
                  </group>
                );
              })
            )}

            {/* 5. 실사 LED 프로젝션 전조등 헤드라이트 (White LED Headlights: 전방 +Z) */}
            {[-carWidth * 0.36, carWidth * 0.36].map((hx, hi) => (
              <group key={hi} position={[hx, 0.44, carLength / 2 + 0.02]}>
                {/* 헤드라이트 투명 커버 */}
                <mesh>
                  <boxGeometry args={[0.32, 0.16, 0.04]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={2.8}
                    roughness={0.05}
                  />
                </mesh>
                {/* 헤드라이트 내부 프로젝션 렌즈 2구 */}
                {[-0.08, 0.08].map((lx, li) => (
                  <mesh key={li} position={[lx, 0, 0.02]}>
                    <sphereGeometry args={[0.045, 12, 12]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                ))}
                {/* 전방 아스팔트와 비 내리는 밤길을 비추는 실사 헤드라이트 광원 */}
                <pointLight
                  color="#f1f2f6"
                  intensity={3.2}
                  distance={18}
                  decay={2}
                />
              </group>
            ))}

            {/* 6. 입체 LED 테일램프 (후방 -Z) */}
            {[-carWidth * 0.36, carWidth * 0.36].map((tx, ti) => (
              <group key={ti} position={[tx, 0.46, -carLength / 2 - 0.02]}>
                {/* 테일램프 라이트바 */}
                <mesh>
                  <boxGeometry args={[0.34, 0.12, 0.04]} />
                  <meshStandardMaterial
                    color="#ff3838"
                    emissive="#ff2222"
                    emissiveIntensity={2.5}
                    roughness={0.1}
                  />
                </mesh>
                {/* 젖은 아스팔트 도로에 붉게 반사되는 브레이크 후미등 빛 */}
                <pointLight
                  color="#ff3838"
                  intensity={2.0}
                  distance={8}
                  decay={2}
                />
              </group>
            ))}

            {/* 전면/후면 한국 자동차 번호판 */}
            <group position={[0, 0.28, carLength / 2 + 0.035]}>
              <mesh>
                <boxGeometry args={[0.48, 0.12, 0.02]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
            </group>
            <group position={[0, 0.36, -carLength / 2 - 0.035]}>
              <mesh>
                <boxGeometry args={[0.48, 0.12, 0.02]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};
