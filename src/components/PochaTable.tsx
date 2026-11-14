import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { ChairSlot } from '../types';
import { RealisticPochaFood } from './RealisticPochaFood';

export interface FoodItemServing {
  foodId: string;
  foodCount: number;  // 남은 안주 입 수 (메뉴 한 개 기준 8입)
}

export interface DrinkItemServing {
  drinkId: string;
  drinkCount: number; // 남은 술 잔/모금 수 (소주/맥주 8, 음료 3)
}

export interface TableServing {
  hasDrink: boolean;
  drinkId?: string;
  drinkCount?: number; // 남은 술 잔 수 (한 병 기준 8잔)
  drinks?: DrinkItemServing[]; // 복수 주류/음료 목록
  hasFood: boolean;
  foodId?: string;
  foodCount?: number;  // 남은 안주 입 수 (메뉴 한 개 기준 8입)
  foods?: FoodItemServing[];   // 복수 안주 목록
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

  // 내가 앉은 의자 객체
  const myChair = chairSlots.find((c) => c.id === mySeatedChairId);

  // 캐릭터가 앉은 쪽에서 테이블 중심 쪽을 바라보는 전방/좌/우 단위 벡터 계산
  const characterForwardVec = useMemo(() => {
    if (!myChair) {
      return { dirX: 0, dirZ: 1, leftX: -1, leftZ: 0, rightX: 1, rightZ: 0 };
    }
    // chair.position -> table.position 방향 (캐릭터가 테이블 중심을 향하는 방향)
    const dx = position[0] - myChair.position[0];
    const dz = position[2] - myChair.position[2];
    const len = Math.hypot(dx, dz) || 1;
    const dirX = dx / len;
    const dirZ = dz / len;
    // 캐릭터 기준 좌측 단위 벡터
    const leftX = -dirZ;
    const leftZ = dirX;
    // 캐릭터 기준 우측 단위 벡터
    const rightX = dirZ;
    const rightZ = -dirX;
    return { dirX, dirZ, leftX, leftZ, rightX, rightZ };
  }, [myChair, position]);

  // 서빙된 모든 안주 목록 (배열 우선, 단일 필드 하위 호환)
  const servedFoods = useMemo(() => {
    if (servedOrder?.foods && servedOrder.foods.length > 0) {
      return servedOrder.foods.filter((f) => f.foodCount > 0);
    }
    if (hasFood && servedOrder?.foodId && (servedOrder?.foodCount ?? 8) > 0) {
      return [{ foodId: servedOrder.foodId, foodCount: servedOrder.foodCount ?? 8 }];
    }
    return [];
  }, [servedOrder, hasFood]);

  // 서빙된 모든 음료/주류 목록 (배열 우선, 단일 필드 하위 호환)
  const servedDrinks = useMemo(() => {
    if (servedOrder?.drinks && servedOrder.drinks.length > 0) {
      return servedOrder.drinks.filter((d) => d.drinkCount > 0);
    }
    if (hasDrink && servedOrder?.drinkId && (servedOrder?.drinkCount ?? 8) > 0) {
      return [{
        drinkId: servedOrder.drinkId,
        drinkCount: servedOrder.drinkCount ?? (servedOrder.drinkId.startsWith('bev_') ? 3 : 8),
      }];
    }
    return [];
  }, [servedOrder, hasDrink]);

  // 안주 배치 좌표 (테이블 중앙 메인 요리 구역 - 술병과 절대 겹치지 않도록 분리)
  const getFoodPosition = (index: number, total: number): [number, number, number] => {
    if (!myChair) {
      if (total === 1) return [0.06, 0, 0];
      if (total === 2) {
        return index === 0 ? [0.06, 0, -0.16] : [0.06, 0, 0.16];
      }
      const angle = (index / total) * Math.PI * 2;
      return [0.06 + Math.cos(angle) * 0.16, 0, Math.sin(angle) * 0.16];
    }

    const { dirX, dirZ, leftX, leftZ, rightX, rightZ } = characterForwardVec;

    // 1개: 테이블 중앙 약간 앞쪽
    if (total === 1) {
      return [dirX * 0.05, 0, dirZ * 0.05];
    }
    // 2개: 중앙 기준 좌/우로 16cm씩 나란히 배치
    if (total === 2) {
      return index === 0
        ? [dirX * 0.06 + leftX * 0.16, 0, dirZ * 0.06 + leftZ * 0.16]
        : [dirX * 0.06 + rightX * 0.16, 0, dirZ * 0.06 + rightZ * 0.16];
    }
    // 3개: 전방 중앙 1개, 뒤쪽 좌/우 2개 삼각형 배치
    if (total === 3) {
      if (index === 0) return [dirX * 0.18, 0, dirZ * 0.18];
      return index === 1
        ? [-dirX * 0.06 + leftX * 0.16, 0, -dirZ * 0.06 + leftZ * 0.16]
        : [-dirX * 0.06 + rightX * 0.16, 0, -dirZ * 0.06 + rightZ * 0.16];
    }
    // 4개 이상: 테이블 중심 기준 고른 원형 배치
    const ang = (index / total) * Math.PI * 2;
    const rad = 0.17;
    return [Math.cos(ang) * rad, 0, Math.sin(ang) * rad];
  };

  // 주류/음료 배치 좌표 (캐릭터 좌측 전방 전용 음료 구역 - 안주 접시 밖으로 36cm 완전 분리)
  const getDrinkPosition = (index: number, total: number): [number, number, number] => {
    if (!myChair) {
      // NPC 또는 빈 테이블: 안주(X=0.06)와 34cm 이상 떨어진 좌측 전용 배치
      const zOffset = total === 1 ? 0 : -0.12 + index * 0.18;
      return [-0.28, 0, zOffset];
    }

    const { dirX, dirZ, leftX, leftZ } = characterForwardVec;

    // 캐릭터의 좌측 36cm 전용 음료 라인에 나란히 정렬 (안주 접시와 20cm 이상 안전 거리 확보로 절대 겹침 없음)
    const fOffset = total === 1 ? -0.06 : -0.16 + index * 0.18;
    return [
      dirX * fOffset + leftX * 0.36,
      0,
      dirZ * fOffset + leftZ * 0.36,
    ];
  };

  // 실제 사진 속 생생한 포차 빨강/파랑 테이블 색상
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

      {/* 2. 테이블 위 주문 서빙 소품 (주문 추가 시 기존 메뉴와 함께 테이블 위에 모두 배치) */}
      <group position={[0, 0.76, 0]}>
        {/* A. 주류/음료 서빙 완료 시 나타나는 병/캔과 잔 (추가 주문 시 나란히 늘어섬) */}
        {servedDrinks.map((drinkItem, dIdx) => {
          // 캐릭터가 술을 따르는 중(isPouringAction)일 때, 현재 마시는 첫 번째 음료는 손에 쥐므로 테이블에서만 일시 숨김
          const isPouringThis = isPouringAction && mySeatedChairId && dIdx === 0;
          if (isPouringThis) return null;

          const isBev = drinkItem.drinkId.startsWith('bev_');
          const maxCount = isBev ? 3 : 8;
          const drinkScale = 0.7 + ((drinkItem.drinkCount ?? maxCount) / maxCount) * 0.3;

          return (
            <RealisticPochaFood
              key={`drink_${drinkItem.drinkId}_${dIdx}`}
              itemId={drinkItem.drinkId}
              position={getDrinkPosition(dIdx, servedDrinks.length)}
              rotation={myChair ? [0, myChair.rotation + Math.PI, 0] : [0, 0, 0]}
              scale={drinkScale}
            />
          );
        })}

        {/* B. 안주 서빙 완료 시 나타나는 음식 요리 접시/냄비/뚝배기 (추가 주문 시 테이블 위에 함께 정갈하게 배치) */}
        {servedFoods.map((foodItem, fIdx) => {
          const foodScale = 0.6 + ((foodItem.foodCount ?? 8) / 8) * 0.4;
          return (
            <RealisticPochaFood
              key={`food_${foodItem.foodId}_${fIdx}`}
              itemId={foodItem.foodId}
              position={getFoodPosition(fIdx, servedFoods.length)}
              rotation={myChair ? [0, myChair.rotation + (fIdx % 2 === 1 ? 0.3 : 0), 0] : [0, 0, 0]}
              scale={foodScale}
            />
          );
        })}
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
