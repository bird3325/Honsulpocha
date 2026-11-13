import React, { useState } from 'react';
import * as THREE from 'three';
import { ChairSlot } from '../types';

interface PochaTableProps {
  id: string;
  position: [number, number, number];
  rotation?: number;
  chairSlots: ChairSlot[];
  onSitChair: (chair: ChairSlot) => void;
  mySeatedChairId: string | null;
}

export const PochaTable: React.FC<PochaTableProps> = ({
  id,
  position,
  rotation = 0,
  chairSlots,
  onSitChair,
  mySeatedChairId,
}) => {
  const [hoveredChair, setHoveredChair] = useState<string | null>(null);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 1. 포차 원형/사각 플라스틱 테이블 (빨간색/파란색 테이블) */}
      {/* 상판 */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.05, 32]} />
        <meshStandardMaterial color="#d63031" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* 테이블 다리 */}
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.72, 12]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} />
      </mesh>
      {/* 테이블 받침대 */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 16]} />
        <meshStandardMaterial color="#2d3436" metalness={0.7} />
      </mesh>

      {/* 2. 테이블 위 소품 (초록색 소주병, 맑은 소주잔, 안주 접시) */}
      <group position={[0, 0.78, 0]}>
        {/* 초록색 소주병 */}
        <group position={[-0.15, 0, 0.1]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.045, 0.22, 16]} />
            <meshStandardMaterial
              color="#00b894"
              roughness={0.15}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* 소주병 목 */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.018, 0.03, 0.07, 16]} />
            <meshStandardMaterial color="#00b894" roughness={0.15} transparent opacity={0.88} />
          </mesh>
          {/* 소주 라벨 */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.08, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        </group>

        {/* 맑은 소주잔 */}
        <mesh position={[0.15, 0.035, -0.05]}>
          <cylinderGeometry args={[0.03, 0.022, 0.06, 16]} />
          <meshStandardMaterial
            color="#ecf0f1"
            roughness={0.1}
            metalness={0.2}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* 안주 접시 (오뎅/골뱅이무침/두부김치) */}
        <group position={[0.08, 0.01, 0.18]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.02, 24]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.3} />
          </mesh>
          {/* 안주 내용물 */}
          <mesh position={[0, 0.02, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color="#e17055" roughness={0.6} />
          </mesh>
        </group>

        {/* 테이블 위 은은한 촛불/미니 조명 */}
        <pointLight color="#ffeaa7" intensity={0.5} distance={1.8} position={[0, 0.15, 0]} />
      </group>

      {/* 3. 테이블 주변 플라스틱 의자들 (클릭하여 앉기 상호작용) */}
      {chairSlots.map((chair) => {
        const isHovered = hoveredChair === chair.id;
        const isMeSitting = mySeatedChairId === chair.id;

        // 테이블 기준 로컬 좌표 계산
        const chairLocalPos: [number, number, number] = [
          chair.position[0] - position[0],
          chair.position[1] - position[1],
          chair.position[2] - position[2],
        ];

        return (
          <group
            key={chair.id}
            position={chairLocalPos}
            rotation={[0, chair.rotation, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredChair(chair.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredChair(null);
              document.body.style.cursor = 'default';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSitChair(chair);
            }}
          >
            {/* 원형 플라스틱 의자 방석 */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
              <meshStandardMaterial
                color={
                  isMeSitting
                    ? '#00cec9'
                    : isHovered
                    ? '#fdcb6e'
                    : chair.isOccupied
                    ? '#636e72'
                    : '#0984e3'
                }
                roughness={0.4}
              />
            </mesh>

            {/* 의자 가운데 구멍 (한국 포차 의자 디테일) */}
            <mesh position={[0, 0.455, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.05, 12]} />
              <meshStandardMaterial color="#2d3436" />
            </mesh>

            {/* 의자 다리 4개 */}
            {[
              [0.12, 0.12],
              [-0.12, 0.12],
              [0.12, -0.12],
              [-0.12, -0.12],
            ].map(([dx, dz], i) => (
              <mesh key={i} position={[dx, 0.22, dz]} castShadow>
                <cylinderGeometry args={[0.016, 0.016, 0.44, 8]} />
                <meshStandardMaterial color="#2d3436" metalness={0.6} />
              </mesh>
            ))}

            {/* 호버 시 "앉기" 유도 링 효과 */}
            {isHovered && !chair.isOccupied && (
              <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.24, 0.28, 24]} />
                <meshBasicMaterial color="#ffeaa7" side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
