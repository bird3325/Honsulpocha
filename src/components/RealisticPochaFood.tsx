import React from 'react';
import * as THREE from 'three';

interface RealisticPochaFoodProps {
  itemId: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const RealisticPochaFood: React.FC<RealisticPochaFoodProps> = ({
  itemId,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* 1. 주류: 테라 맥주 (초록병 + TERRA 라벨 + 맥주잔 거품) */}
      {itemId === 'beer_terra' && (
        <group>
          {/* 테라 녹색 맥주병 본체 */}
          <mesh position={[0, 0.11, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.042, 0.2, 16]} />
            <meshStandardMaterial color="#1e7e34" roughness={0.15} metalness={0.1} transparent opacity={0.92} />
          </mesh>
          {/* 어깨 및 병목 */}
          <mesh position={[0, 0.23, 0]} castShadow>
            <cylinderGeometry args={[0.016, 0.036, 0.07, 16]} />
            <meshStandardMaterial color="#1e7e34" roughness={0.15} transparent opacity={0.92} />
          </mesh>
          {/* 병 주둥이 & 왕관 캡 */}
          <mesh position={[0, 0.27, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.015, 12]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.8} />
          </mesh>
          {/* TERRA 녹색/금색 라벨 */}
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.043, 0.043, 0.075, 16]} />
            <meshStandardMaterial color="#27ae60" roughness={0.4} />
          </mesh>
          {/* 시원한 500cc 유리 맥주잔 */}
          <group position={[0.13, 0, 0.03]}>
            <mesh position={[0, 0.065, 0]}>
              <cylinderGeometry args={[0.036, 0.03, 0.13, 16]} />
              <meshStandardMaterial color="#f1c40f" roughness={0.15} transparent opacity={0.75} />
            </mesh>
            {/* 맥주 거품 (화이트 크림 헤드) */}
            <mesh position={[0, 0.132, 0]}>
              <cylinderGeometry args={[0.037, 0.036, 0.02, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
            {/* 맥주잔 손잡이 */}
            <mesh position={[0.038, 0.065, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.032, 0.007, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#dfe6e9" transparent opacity={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. 주류: 참이슬 / 소주 (맑은 초록 소주병 + 참이슬 라벨 + 소주잔) */}
      {(itemId === 'soju_chamisul' || itemId === 'soju_general' || itemId === 'drink_grapefruit') && (
        <group>
          {/* 초록 소주병 본체 */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.036, 0.039, 0.18, 16]} />
            <meshStandardMaterial
              color={itemId === 'drink_grapefruit' ? '#009432' : '#00a86b'}
              roughness={0.15}
              metalness={0.08}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* 병목 */}
          <mesh position={[0, 0.21, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.032, 0.065, 16]} />
            <meshStandardMaterial color="#00a86b" roughness={0.15} transparent opacity={0.9} />
          </mesh>
          {/* 초록 뚜껑 */}
          <mesh position={[0, 0.245, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.012, 12]} />
            <meshStandardMaterial color="#27ae60" metalness={0.7} />
          </mesh>
          {/* 하얀색 사각 종이 라벨 */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.07, 16]} />
            <meshStandardMaterial color={itemId === 'drink_grapefruit' ? '#ff7675' : '#ffffff'} roughness={0.4} />
          </mesh>
          {/* 투명한 소주잔 (살얼음 소주) */}
          <group position={[0.11, 0, 0.02]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.024, 0.017, 0.055, 14]} />
              <meshStandardMaterial color="#dfe6e9" roughness={0.1} transparent opacity={0.65} />
            </mesh>
            {/* 찰랑거리는 소주 */}
            <mesh position={[0, 0.038, 0]}>
              <cylinderGeometry args={[0.021, 0.015, 0.035, 12]} />
              <meshStandardMaterial color="#f1f2f6" transparent opacity={0.85} />
            </mesh>
          </group>
        </group>
      )}

      {/* 3. 주류: 청하 (맑은 청주 투명병 + 푸른 라벨 + 전용 잔) */}
      {itemId === 'drink_cheongha' && (
        <group>
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.038, 0.18, 16]} />
            <meshStandardMaterial color="#ecf0f1" roughness={0.1} metalness={0.1} transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0.21, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.032, 0.065, 16]} />
            <meshStandardMaterial color="#ecf0f1" roughness={0.1} transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0.245, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.012, 12]} />
            <meshStandardMaterial color="#0984e3" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.039, 0.039, 0.065, 16]} />
            <meshStandardMaterial color="#0984e3" roughness={0.3} />
          </mesh>
          <group position={[0.11, 0, 0.02]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.024, 0.017, 0.055, 14]} />
              <meshStandardMaterial color="#dfe6e9" roughness={0.1} transparent opacity={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. 주류: 매화수 (슬림한 유리병 + 붉은 매화 라벨) */}
      {itemId === 'drink_maehwasu' && (
        <group>
          <mesh position={[0, 0.11, 0]} castShadow>
            <cylinderGeometry args={[0.033, 0.035, 0.2, 16]} />
            <meshStandardMaterial color="#dfe6e9" roughness={0.1} transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0.23, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.03, 0.07, 16]} />
            <meshStandardMaterial color="#dfe6e9" roughness={0.1} transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.08, 16]} />
            <meshStandardMaterial color="#fd79a8" roughness={0.3} />
          </mesh>
          <group position={[0.11, 0, 0.02]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.024, 0.017, 0.055, 14]} />
              <meshStandardMaterial color="#fd79a8" roughness={0.1} transparent opacity={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* 5. 음료: 콜라 (빨간 캔 + 얼음컵) */}
      {itemId === 'bev_cola' && (
        <group>
          {/* 빨간 알루미늄 캔 */}
          <mesh position={[0, 0.065, 0]} castShadow>
            <cylinderGeometry args={[0.033, 0.033, 0.12, 16]} />
            <meshStandardMaterial color="#d63031" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.126, 0]}>
            <cylinderGeometry args={[0.031, 0.031, 0.005, 16]} />
            <meshStandardMaterial color="#bdc3c7" metalness={0.9} />
          </mesh>
          {/* 얼음 콜라컵 */}
          <group position={[0.1, 0, 0.02]}>
            <mesh position={[0, 0.055, 0]}>
              <cylinderGeometry args={[0.034, 0.026, 0.11, 16]} />
              <meshStandardMaterial color="#2d3436" roughness={0.1} transparent opacity={0.8} />
            </mesh>
            <mesh position={[0, 0.11, 0]} rotation={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.14, 8]} />
              <meshStandardMaterial color="#e74c3c" />
            </mesh>
          </group>
        </group>
      )}

      {/* 6. 음료: 사이다 (초록 캔 + 얼음컵) */}
      {itemId === 'bev_cider' && (
        <group>
          <mesh position={[0, 0.065, 0]} castShadow>
            <cylinderGeometry args={[0.033, 0.033, 0.12, 16]} />
            <meshStandardMaterial color="#00b894" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.126, 0]}>
            <cylinderGeometry args={[0.031, 0.031, 0.005, 16]} />
            <meshStandardMaterial color="#bdc3c7" metalness={0.9} />
          </mesh>
          <group position={[0.1, 0, 0.02]}>
            <mesh position={[0, 0.055, 0]}>
              <cylinderGeometry args={[0.034, 0.026, 0.11, 16]} />
              <meshStandardMaterial color="#dfe6e9" roughness={0.1} transparent opacity={0.7} />
            </mesh>
          </group>
        </group>
      )}

      {/* 7. 식사: 라면계란 (추억의 양은냄비 + 칼칼한 라면 + 계란 탁) */}
      {itemId === 'food_ramen' && (
        <group>
          {/* 노란 황동 양은냄비 */}
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.11, 0.08, 20]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* 냄비 양쪽 손잡이 */}
          {[-0.145, 0.145].map((xP, xi) => (
            <mesh key={xi} position={[xP, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.022, 0.006, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#f1c40f" metalness={0.85} />
            </mesh>
          ))}
          {/* 얼큰한 붉은 라면 국물과 꼬들 면발 */}
          <mesh position={[0, 0.068, 0]}>
            <cylinderGeometry args={[0.128, 0.128, 0.015, 20]} />
            <meshStandardMaterial color="#d35400" roughness={0.3} />
          </mesh>
          {/* 가운데 계란 노른자 */}
          <mesh position={[0, 0.076, 0]}>
            <sphereGeometry args={[0.026, 12, 12]} />
            <meshStandardMaterial color="#f39c12" roughness={0.2} />
          </mesh>
          {/* 파송송 고명 */}
          {[-0.04, 0.03, -0.02].map((gx, gi) => (
            <mesh key={gi} position={[gx, 0.077, gi * 0.03 - 0.03]}>
              <boxGeometry args={[0.015, 0.004, 0.015]} />
              <meshStandardMaterial color="#27ae60" />
            </mesh>
          ))}
        </group>
      )}

      {/* 8. 식사: 포차 우동 (양은냄비 + 쑥갓 + 유부 고명) */}
      {itemId === 'food_udon' && (
        <group>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.11, 0.08, 20]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.85} roughness={0.25} />
          </mesh>
          {[-0.145, 0.145].map((xP, xi) => (
            <mesh key={xi} position={[xP, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.022, 0.006, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#f1c40f" metalness={0.85} />
            </mesh>
          ))}
          {/* 맑고 진한 어묵 우동 국물 */}
          <mesh position={[0, 0.068, 0]}>
            <cylinderGeometry args={[0.128, 0.128, 0.015, 20]} />
            <meshStandardMaterial color="#e67e22" roughness={0.2} />
          </mesh>
          {/* 쑥갓 초록잎 & 유부 */}
          <mesh position={[-0.03, 0.076, 0.02]}>
            <boxGeometry args={[0.045, 0.005, 0.035]} />
            <meshStandardMaterial color="#2ecc71" />
          </mesh>
          <mesh position={[0.03, 0.076, -0.02]}>
            <boxGeometry args={[0.035, 0.006, 0.04]} />
            <meshStandardMaterial color="#f5cd79" />
          </mesh>
          {/* 고춧가루 포인트 */}
          <mesh position={[0, 0.076, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.003, 8]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
        </group>
      )}

      {/* 9. 식사: 잔치국수 (도자기 대접 + 소면 + 호박/당근/김가루) */}
      {itemId === 'food_guksu' && (
        <group>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.08, 0.08, 20]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.068, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.015, 20]} />
            <meshStandardMaterial color="#f5cd79" roughness={0.2} />
          </mesh>
          {/* 김가루 & 호박 & 당근 고명 */}
          <mesh position={[0, 0.077, 0]}>
            <boxGeometry args={[0.04, 0.004, 0.02]} />
            <meshStandardMaterial color="#2d3436" />
          </mesh>
          <mesh position={[-0.03, 0.077, 0.02]}>
            <boxGeometry args={[0.025, 0.004, 0.02]} />
            <meshStandardMaterial color="#27ae60" />
          </mesh>
          <mesh position={[0.03, 0.077, -0.02]}>
            <boxGeometry args={[0.025, 0.004, 0.02]} />
            <meshStandardMaterial color="#e67e22" />
          </mesh>
        </group>
      )}

      {/* 10. 뚝배기: 산더미 홍합탕 (양푼 냄비 + 뽀얀 국물 + 검은 홍합 껍질) */}
      {itemId === 'food_mussel' && (
        <group>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.155, 0.11, 0.085, 20]} />
            <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.068, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.015, 20]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.25} />
          </mesh>
          {/* 산더미 홍합 껍질들 (자연스러운 회전 배치) */}
          {[
            [-0.05, 0.08, 0.03, 0.3],
            [0.05, 0.08, -0.02, -0.4],
            [-0.01, 0.09, -0.04, 0.8],
            [0.02, 0.09, 0.04, -0.2],
            [-0.04, 0.085, -0.02, 0.6],
          ].map(([mx, my, mz, mrot], mi) => (
            <group key={mi} position={[mx, my, mz]} rotation={[0.3, mrot, 0.2]}>
              <mesh>
                <boxGeometry args={[0.042, 0.018, 0.05]} />
                <meshStandardMaterial color="#2d3436" roughness={0.4} />
              </mesh>
              {/* 속살 */}
              <mesh position={[0, 0.008, 0]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshStandardMaterial color="#e67e22" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 11. 뚝배기: 어묵탕 (뚝배기 + 어묵 꼬치 3개) */}
      {itemId === 'food_fishcake' && (
        <group>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.1, 0.085, 20]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.068, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.015, 18]} />
            <meshStandardMaterial color="#e67e22" roughness={0.2} />
          </mesh>
          {/* 꼬치에 꽂힌 3개의 어묵 */}
          {[-0.04, 0, 0.04].map((ox, oi) => (
            <group key={oi} position={[ox, 0.09, (oi - 1) * 0.02]} rotation={[0.4, 0, (oi - 1) * 0.25]}>
              {/* 나무 꼬챙이 */}
              <mesh>
                <cylinderGeometry args={[0.004, 0.004, 0.22, 6]} />
                <meshStandardMaterial color="#f5cd79" />
              </mesh>
              {/* 접힌 어묵 */}
              <mesh position={[0, -0.03, 0]}>
                <boxGeometry args={[0.03, 0.07, 0.035]} />
                <meshStandardMaterial color="#fed330" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 12. 뚝배기: 계란탕 (검정 뚝배기 + 봉긋하게 솟아오른 황금 계란찜) */}
      {itemId === 'food_egg_soup' && (
        <group>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.09, 0.08, 18]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>
          {/* 봉긋 솟아오른 계란찜 */}
          <mesh position={[0, 0.075, 0]}>
            <sphereGeometry args={[0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#fed330" roughness={0.4} />
          </mesh>
          {/* 파송송 & 통깨 */}
          {[-0.03, 0.02, 0].map((px, pi) => (
            <mesh key={pi} position={[px, 0.135, (pi - 1) * 0.02]}>
              <boxGeometry args={[0.015, 0.005, 0.015]} />
              <meshStandardMaterial color="#27ae60" />
            </mesh>
          ))}
        </group>
      )}

      {/* 13. 뚝배기: 번데기탕 (검정 뚝배기 + 고소한 번데기 알갱이들) */}
      {itemId === 'food_beondegi' && (
        <group>
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.09, 0.08, 18]} />
            <meshStandardMaterial color="#2d3436" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.068, 0]}>
            <cylinderGeometry args={[0.115, 0.115, 0.015, 18]} />
            <meshStandardMaterial color="#533c2a" roughness={0.3} />
          </mesh>
          {/* 번데기 알갱이들 */}
          {[-0.04, 0.03, 0, -0.02, 0.04].map((bx, bi) => (
            <mesh key={bi} position={[bx, 0.076, (bi - 2) * 0.025]} rotation={[0.2, bi, 0.1]}>
              <capsuleGeometry args={[0.008, 0.016, 4, 8]} />
              <meshStandardMaterial color="#3d2714" roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {/* 14. 안주: 왕계란말이 (길쭉한 사각 접시 + 노란 계란말이 조각들 + 케첩 & 머스터드 드리즐) */}
      {itemId === 'food_gyeranmari' && (
        <group>
          {/* 긴 사각 백자 접시 */}
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <boxGeometry args={[0.34, 0.02, 0.14]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          {/* 두툼하게 썰린 계란말이 조각 6개 */}
          {[-0.125, -0.075, -0.025, 0.025, 0.075, 0.125].map((gx, gi) => (
            <mesh key={gi} position={[gx, 0.04, 0]} castShadow>
              <boxGeometry args={[0.044, 0.035, 0.095]} />
              <meshStandardMaterial color="#f6e58d" roughness={0.4} />
            </mesh>
          ))}
          {/* 케첩 빨간 드리즐 라인 */}
          <mesh position={[0, 0.06, 0.02]}>
            <boxGeometry args={[0.29, 0.005, 0.012]} />
            <meshStandardMaterial color="#eb4d4b" roughness={0.3} />
          </mesh>
          {/* 머스터드 노란 드리즐 라인 */}
          <mesh position={[0, 0.06, -0.02]}>
            <boxGeometry args={[0.29, 0.005, 0.012]} />
            <meshStandardMaterial color="#f0932b" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 15. 안주: 두부김치 (타원 접시 + 양옆 하얀 손두부 블록 + 중앙 볶음김치 제육) */}
      {itemId === 'food_tofu_kimchi' && (
        <group>
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          {/* 양옆 가지런한 하얀 두부 슬라이스들 */}
          {[-0.1, 0.1].map((sideX, si) => (
            <group key={si} position={[sideX, 0.035, 0]}>
              {[-0.04, 0, 0.04].map((tz, ti) => (
                <mesh key={ti} position={[0, 0, tz]} castShadow>
                  <boxGeometry args={[0.045, 0.028, 0.032]} />
                  <meshStandardMaterial color="#f5f6fa" roughness={0.6} />
                </mesh>
              ))}
            </group>
          ))}
          {/* 중앙 매콤달콤 볶음김치 & 제육 */}
          <mesh position={[0, 0.035, 0]} scale={[1, 0.45, 1]} castShadow>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshStandardMaterial color="#c0392b" roughness={0.5} />
          </mesh>
          {/* 통깨 솔솔 */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.003, 8]} />
            <meshStandardMaterial color="#f1f2f6" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* 16. 안주: 통 꽁치구이 (긴 생선 접시 + 노릇노릇 구워진 꽁치 + 레몬 조각) */}
      {itemId === 'food_kkongchi' && (
        <group>
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <boxGeometry args={[0.36, 0.018, 0.12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          {/* 노릇하게 구워진 꽁치 몸통 */}
          <group position={[0, 0.035, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <capsuleGeometry args={[0.02, 0.22, 6, 12]} />
              <meshStandardMaterial color="#7f8c8d" metalness={0.4} roughness={0.6} />
            </mesh>
            {/* 꽁치 꼬리 지느러미 */}
            <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.025, 0.025, 0.006]} />
              <meshStandardMaterial color="#57606f" />
            </mesh>
            {/* 사선 칼집 그릴 자국 */}
            {[-0.06, -0.02, 0.02, 0.06].map((cx, ci) => (
              <mesh key={ci} position={[cx, 0.021, 0]} rotation={[0, 0.4, 0]}>
                <boxGeometry args={[0.008, 0.004, 0.03]} />
                <meshStandardMaterial color="#2d3436" />
              </mesh>
            ))}
            {/* 노란 레몬 조각 */}
            <mesh position={[0.13, 0.01, 0.03]} rotation={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.008, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#fed330" roughness={0.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* 17. 안주: 매콤 무뼈닭발 / 오돌뼈 / 꼼장어 / 오징어볶음 (빨간 매콤 포차 볶음류) */}
      {(itemId === 'food_dakbal' ||
        itemId === 'food_odolppyeo' ||
        itemId === 'food_kkomjangeo' ||
        itemId === 'food_ojingeo_bokkeum') && (
        <group>
          {/* 하얀 도자기 원형 접시 */}
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.155, 0.135, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          {/* 매콤한 불맛 양념 덩어리 */}
          <mesh position={[0, 0.032, 0]} scale={[1, 0.38, 1]} castShadow>
            <sphereGeometry args={[0.11, 12, 10]} />
            <meshStandardMaterial color="#b71540" roughness={0.45} />
          </mesh>
          {/* 오독오독 조각 / 닭발 쫄깃 살 디테일 */}
          {[
            [-0.04, 0.045, 0.03],
            [0.05, 0.045, -0.02],
            [-0.01, 0.05, -0.04],
            [0.03, 0.048, 0.04],
          ].map(([px, py, pz], pi) => (
            <mesh key={pi} position={[px, py, pz]}>
              <capsuleGeometry args={[0.012, 0.022, 4, 8]} />
              <meshStandardMaterial color="#e84118" roughness={0.4} />
            </mesh>
          ))}
          {/* 고소한 참깨 솔솔 */}
          <mesh position={[0, 0.065, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.003, 10]} />
            <meshStandardMaterial color="#f1f2f6" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* 18. 안주: 닭똥집 (철판 구이 + 마늘/양파 + 참기름 소금장) */}
      {itemId === 'food_dakttongjip' && (
        <group>
          {/* 검은 무쇠 철판 */}
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.15, 0.13, 0.02, 20]} />
            <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* 쫄깃한 닭똥집 조각들과 통마늘 */}
          {[
            [-0.04, 0.03, 0.02],
            [0.04, 0.03, -0.03],
            [0, 0.035, 0.04],
            [-0.02, 0.035, -0.04],
            [0.05, 0.03, 0.02],
          ].map(([gx, gy, gz], gi) => (
            <mesh key={gi} position={[gx, gy, gz]} rotation={[0.2, gi, 0.1]} castShadow>
              <capsuleGeometry args={[0.014, 0.025, 4, 8]} />
              <meshStandardMaterial color="#784212" roughness={0.6} />
            </mesh>
          ))}
          {/* 노릇 통마늘 */}
          {[-0.05, 0.02, -0.01].map((mx, mi) => (
            <mesh key={mi} position={[mx, 0.032, mi * 0.03]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshStandardMaterial color="#f5cd79" />
            </mesh>
          ))}
          {/* 고소한 기름장 종지 */}
          <group position={[0.11, 0.018, 0.08]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.022, 0.018, 12]} />
              <meshStandardMaterial color="#dfe6e9" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.007, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.005, 12]} />
              <meshStandardMaterial color="#d35400" transparent opacity={0.85} />
            </mesh>
          </group>
        </group>
      )}

      {/* 19. 안주: 신선 꼬막 / 피꼬막 / 석굴 (해산물 패류 접시 + 초장) */}
      {(itemId === 'food_kkomak' || itemId === 'food_pikkomaek' || itemId === 'food_seokgul') && (
        <group>
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          {/* 둥글게 둘러진 꼬막/석굴 조개 껍데기들 */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const angle = (idx * Math.PI * 2) / 6;
            const r = 0.08;
            return (
              <group
                key={idx}
                position={[Math.cos(angle) * r, 0.03, Math.sin(angle) * r]}
                rotation={[0.2, angle, 0]}
              >
                <mesh castShadow>
                  <sphereGeometry args={[0.024, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial
                    color={itemId === 'food_seokgul' ? '#747d8c' : '#2f3542'}
                    roughness={0.7}
                  />
                </mesh>
                {/* 조개 속살과 양념장 */}
                <mesh position={[0, 0.012, 0]}>
                  <sphereGeometry args={[0.014, 8, 8]} />
                  <meshStandardMaterial
                    color={
                      itemId === 'food_pikkomaek'
                        ? '#c0392b'
                        : itemId === 'food_seokgul'
                        ? '#dcdde1'
                        : '#e67e22'
                    }
                  />
                </mesh>
              </group>
            );
          })}
          {/* 중앙 매콤 초장 종지 */}
          <group position={[0, 0.02, 0]}>
            <mesh>
              <cylinderGeometry args={[0.034, 0.025, 0.02, 16]} />
              <meshStandardMaterial color="#dfe6e9" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.008, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.006, 14]} />
              <meshStandardMaterial color="#c0392b" />
            </mesh>
          </group>
        </group>
      )}

      {/* 20. 안주: 오징어데침 (야들야들 통오징어 숙회 링 + 초장) */}
      {itemId === 'food_ojingeo_dechim' && (
        <group>
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.155, 0.135, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          {/* 정갈하게 썰린 뽀얀 오징어 링 조각들 */}
          {[-0.06, -0.02, 0.02, 0.06].map((ox, oi) => (
            <mesh key={oi} position={[ox, 0.035, (oi % 2) * 0.02]} rotation={[Math.PI / 2, 0, 0.3]} castShadow>
              <torusGeometry args={[0.024, 0.008, 8, 16]} />
              <meshStandardMaterial color="#f5f6fa" roughness={0.3} />
            </mesh>
          ))}
          {/* 초장 종지 */}
          <group position={[0.09, 0.02, 0.05]}>
            <mesh>
              <cylinderGeometry args={[0.032, 0.024, 0.02, 14]} />
              <meshStandardMaterial color="#dfe6e9" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.008, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.006, 12]} />
              <meshStandardMaterial color="#c0392b" />
            </mesh>
          </group>
        </group>
      )}

      {/* 21. 안주: 고소한 은행구이 (버터구이 은행알 + 미니 철판) */}
      {itemId === 'food_eunhaeng' && (
        <group>
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.02, 16]} />
            <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* 동글동글 연두빛/황금빛 버터 은행알들 */}
          {[-0.04, -0.01, 0.02, 0.04, -0.02, 0.01, -0.04].map((ex, ei) => (
            <mesh key={ei} position={[ex, 0.028, ((ei * 3) % 7) * 0.018 - 0.05]} castShadow>
              <sphereGeometry args={[0.014, 10, 10]} />
              <meshStandardMaterial color={ei % 2 === 0 ? '#badc58' : '#fed330'} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}

      {/* 기본 폴백: 맛있는 포차 안주 접시 */}
      {![
        'beer_terra',
        'soju_chamisul',
        'soju_general',
        'drink_grapefruit',
        'drink_cheongha',
        'drink_maehwasu',
        'bev_cola',
        'bev_cider',
        'food_ramen',
        'food_udon',
        'food_guksu',
        'food_mussel',
        'food_fishcake',
        'food_egg_soup',
        'food_beondegi',
        'food_gyeranmari',
        'food_tofu_kimchi',
        'food_kkongchi',
        'food_dakbal',
        'food_odolppyeo',
        'food_kkomjangeo',
        'food_ojingeo_bokkeum',
        'food_dakttongjip',
        'food_kkomak',
        'food_pikkomaek',
        'food_seokgul',
        'food_ojingeo_dechim',
        'food_eunhaeng',
      ].includes(itemId) && (
        <group>
          <mesh position={[0, 0.015, 0]} receiveShadow>
            <cylinderGeometry args={[0.15, 0.13, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]} scale={[1, 0.35, 1]} castShadow>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#e17055" roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
};

