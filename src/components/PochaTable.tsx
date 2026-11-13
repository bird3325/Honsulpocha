import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { ChairSlot } from '../types';
import { RealisticPochaFood } from './RealisticPochaFood';

export interface TableServing {
  hasDrink: boolean;
  drinkId?: string;
  drinkCount?: number; // 남은 술 잔 수 (한 병 기준 8잔)
  hasFood: boolean;
  foodId?: string;
  foodCount?: number;  // 남은 안주 입 수 (메뉴 한 개 기준 8입)
}

interface PochaTableProps {
  id: string;
  position: [number, number, number];
  rotation?: number;
  chairSlots: ChairSlot[];
  onSitChair: (chair: ChairSlot) => void;
  mySeatedChairId: string | null;
  tableColor?: string;
  servedOrder?: TableServing;
  isPouringAction?: boolean;
}

export const PochaTable: React.FC<PochaTableProps> = ({
  id,
  position,
  rotation = 0,
  chairSlots,
  onSitChair,
  mySeatedChairId,
  tableColor = '#d63031',
  servedOrder,
  isPouringAction = false,
}) => {
  const [hoveredChair, setHoveredChair] = useState<string | null>(null);

  const hasDrink = !!servedOrder?.hasDrink;
  const hasFood = !!servedOrder?.hasFood;

  // 내가 앉은 의자의 각도(rotation) 파악 -> 캐릭터 바로 앞으로 술병과 잔, 안주를 배치
  const myChair = chairSlots.find((c) => c.id === mySeatedChairId);
  const myTableAngle = myChair ? myChair.rotation : 0;
  // 캐릭터가 앉은 쪽에서 테이블 중심 쪽을 바라보는 전방 각도 벡터
  // 캐릭터는 테이블을 바라보고 있으므로, 캐릭터의 전방은 chair.rotation 방향
  // 캐릭터 쪽 테이블 모서리 좌표 (반지름 약 0.3m 지점)
  // c1: z = tz - 0.85 (rot: 0) -> 캐릭터 앞 테이블 지점: x=0, z=-0.28
  // c2: x = tx - 0.85 (rot: PI/2) -> 캐릭터 앞 테이블 지점: x=-0.28, z=0
  // c3: z = tz + 0.85 (rot: PI) -> 캐릭터 앞 테이블 지점: x=0, z=0.28
  // c4: x = tx + 0.85 (rot: -PI/2) -> 캐릭터 앞 테이블 지점: x=0.28, z=0
  const characterForwardVec = useMemo(() => {
    if (!myChair) {
      return { frontX: 0, frontZ: 0.26, perpX: 0.14, perpZ: 0 };
    }
    // chair.position -> table.position 방향
    const dx = position[0] - myChair.position[0];
    const dz = position[2] - myChair.position[2];
    const len = Math.hypot(dx, dz) || 1;
    // 캐릭터 바로 앞 테이블 지점 (테이블 중심에서 캐릭터 쪽으로 약 0.26m)
    const frontX = -(dx / len) * 0.26;
    const frontZ = -(dz / len) * 0.26;
    // 전방 기준 좌/우 수직 벡터
    const perpX = -(dz / len) * 0.14;
    const perpZ = (dx / len) * 0.14;
    return { frontX, frontZ, perpX, perpZ };
  }, [myChair, position]);

  // 실제 사진 속 생생한 포차 빨강/파랑 색상
  const isRedTable = tableColor === '#d63031';
  const primaryColor = isRedTable ? '#e84118' : '#0984e3';

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 1. 실제 한국 포차 X자 접이식 원형 플라스틱 테이블 */}
      {/* 상판 (반지름 0.58m, 살짝 둥근 테두리 몰딩) */}
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.035, 32]} />
        <meshStandardMaterial color={primaryColor} roughness={0.35} metalness={0.08} />
      </mesh>
      {/* 상판 밑면 테두리 보강 리브 */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.015, 24]} />
        <meshStandardMaterial color="#2d3436" roughness={0.6} />
      </mesh>

      {/* ★ 사진 속 실제 포차의 "흰색 X자 교차 접이식 철제 파이프 다리 (White X-Folding Legs)" */}
      <group position={[0, 0.36, 0]}>
        {/* X자 대각 파이프 1 (앞/뒤 대칭 2조) */}
        {[-0.24, 0.24].map((zOffset, zi) => (
          <group key={zi} position={[0, 0, zOffset]}>
            {/* 왼쪽에서 오른쪽 아래로 내려가는 파이프 */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0.44]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 0.82, 10]} />
              <meshStandardMaterial color="#ecf0f1" metalness={0.5} roughness={0.35} />
            </mesh>
            {/* 오른쪽에서 왼쪽 아래로 내려가는 파이프 */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, -0.44]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 0.82, 10]} />
              <meshStandardMaterial color="#ecf0f1" metalness={0.5} roughness={0.35} />
            </mesh>
            {/* 중앙 교차 힌지 볼트 */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.05, 8]} />
              <meshStandardMaterial color="#7f8c8d" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* 상단 수평 연결 바 (상판 아래 지지) */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.52]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.6} />
        </mesh>
        {/* 하단 수평 지지 바 2개 (바닥 지지 파이프) */}
        <mesh position={[-0.32, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.56, 10]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.6} />
        </mesh>
        <mesh position={[0.32, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.56, 10]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.6} />
        </mesh>
        {/* 바닥 검은 고무 패킹 캡 4개 */}
        {[
          [-0.32, 0.28],
          [-0.32, -0.28],
          [0.32, 0.28],
          [0.32, -0.28],
        ].map(([px, pz], pzi) => (
          <mesh key={pzi} position={[px, -0.345, pz]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* 사진 속 테이블 위 상시 기본 소품: 스테인리스 앞접시/물컵 */}
      <group position={[0.04, 0.76, -0.06]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.065, 0.045, 0.035, 16]} />
          <meshStandardMaterial color="#dfe6e9" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* 2. 테이블 위 주문 서빙 소품 (실제 주문한 메뉴와 100% 동일한 3D 음식 모델) */}
      <group position={[0, 0.76, 0]}>
        {/* A. 주류 서빙 완료 시 나타나는 술병과 잔 (캐릭터가 앉은 바로 앞으로 배치, 술 따르는 중(isPouringAction)일 때는 테이블 병 숨김) */}
        {hasDrink && servedOrder?.drinkId && (!isPouringAction || !mySeatedChairId) && (
          <RealisticPochaFood
            itemId={servedOrder.drinkId}
            position={
              myChair
                ? [characterForwardVec.frontX - characterForwardVec.perpX, 0, characterForwardVec.frontZ - characterForwardVec.perpZ]
                : [-0.15, 0, 0.08]
            }
            rotation={myChair ? [0, myChair.rotation + Math.PI, 0] : [0, 0, 0]}
            scale={0.7 + ((servedOrder.drinkCount ?? 8) / 8) * 0.3}
          />
        )}

        {/* B. 안주 서빙 완료 시 나타나는 정갈한 음식 요리 접시/냄비/뚝배기 (캐릭터 앞 테이블 중앙에 먹음직스럽게 배치) */}
        {hasFood && servedOrder?.foodId && (
          <RealisticPochaFood
            itemId={servedOrder.foodId}
            position={
              myChair
                ? [characterForwardVec.frontX * 0.7 + characterForwardVec.perpX * 0.6, 0, characterForwardVec.frontZ * 0.7 + characterForwardVec.perpZ * 0.6]
                : [0.08, 0, -0.04]
            }
            rotation={myChair ? [0, myChair.rotation, 0] : [0, 0, 0]}
            scale={0.6 + ((servedOrder.foodCount ?? 8) / 8) * 0.4}
          />
        )}

        {/* 테이블 위 은은한 조명 */}
        {(hasDrink || hasFood) && (
          <pointLight color="#ffeaa7" intensity={0.65} distance={2.0} position={[0, 0.25, 0]} />
        )}
      </group>

      {/* 3. ★ 사진 속 실제 한국 포장마차 플라스틱 스툴 (손잡이 구멍 & 사출 다리 & 보강 링) */}
      {chairSlots.map((chair, cIdx) => {
        const isMySeat = mySeatedChairId === chair.id;
        const isOccupied = chair.isOccupied;
        const isHovered = hoveredChair === chair.id;

        // 부모 테이블 group(position) 기준 의자의 로컬 상대 좌표
        const localPos: [number, number, number] = [
          chair.position[0] - position[0],
          0,
          chair.position[2] - position[2],
        ];

        // 사진처럼 빨간 스툴과 파란 스툴이 자연스럽게 교차 믹스됨
        const stoolBaseColor =
          isMySeat
            ? '#00cec9'
            : isHovered
            ? '#ffeaa7'
            : cIdx % 2 === 0
            ? '#e84118' // 빨간 포차 스툴
            : '#0984e3'; // 파란 포차 스툴

        return (
          <group
            key={chair.id}
            position={localPos}
            rotation={[0, chair.rotation, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredChair(chair.id);
            }}
            onPointerOut={() => setHoveredChair(null)}
          >
            {/* 의자 클릭 히트박스 */}
            <mesh
              position={[0, 0.44, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSitChair(chair);
              }}
              visible={false}
            >
              <cylinderGeometry args={[0.35, 0.35, 0.9, 16]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* A. 플라스틱 본체 상단 림 (빨강 or 파랑 사출) */}
            <mesh position={[0, 0.44, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.19, 0.04, 20]} />
              <meshStandardMaterial
                color={stoolBaseColor}
                roughness={0.45}
                emissive={isHovered && !isOccupied ? '#f39c12' : '#000000'}
                emissiveIntensity={0.25}
              />
            </mesh>

            {/* B. 사진 속 원형 시트 (검정/어두운 톤 + 중앙 손잡이 구멍 디테일) */}
            <group position={[0, 0.462, 0]}>
              {/* 바깥 둥근 쿠션/시트 도넛 */}
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <ringGeometry args={[0.035, 0.17, 24]} />
                <meshStandardMaterial color="#2d3436" roughness={0.7} side={THREE.DoubleSide} />
              </mesh>
              {/* 중앙 손잡이 타원 구멍 테두리 */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.015, 0.035, 16]} />
                <meshStandardMaterial color="#1e272e" roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
            </group>

            {/* C. 살짝 바깥으로 벌어진 4개의 사출 다리 */}
            {[
              [-0.12, -0.12],
              [0.12, -0.12],
              [-0.12, 0.12],
              [0.12, 0.12],
            ].map(([dx, dz], di) => (
              <mesh
                key={di}
                position={[dx * 1.15, 0.21, dz * 1.15]}
                rotation={[0.08 * (dz > 0 ? 1 : -1), 0, 0.08 * (dx > 0 ? 1 : -1)]}
                castShadow
              >
                <boxGeometry args={[0.032, 0.43, 0.032]} />
                <meshStandardMaterial color={stoolBaseColor} roughness={0.5} />
              </mesh>
            ))}

            {/* D. 사진 속 스툴 특유의 중간 가로 보강 리브 링 (발받침 링) */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.155, 0.165, 0.025, 16, 1, true]} />
              <meshStandardMaterial color={stoolBaseColor} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
