import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { ServingOrder } from '../types';
import { soundManager } from './AudioController';
import { RealisticPochaFood } from './RealisticPochaFood';

type BossState = 'cooking' | 'preparing' | 'walk_to_table' | 'serving' | 'walk_to_kitchen';

export interface GrandmaBossProps {
  onServingChange?: (isServing: boolean) => void;
  bossPosRef?: React.MutableRefObject<[number, number, number]>;
}

export const GrandmaBoss: React.FC<GrandmaBossProps> = ({
  onServingChange,
  bossPosRef,
}) => {
  const bossGroupRef = useRef<THREE.Group>(null);
  const ladleRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const trayRef = useRef<THREE.Group>(null);

  // 기본 주방 위치 및 통로 웨이포인트 (카운터 및 테이블을 관통하지 않는 직각 복도 보행 시스템)
  const HOME_POS: [number, number, number] = [0, 0, -4.8];
  const KITCHEN_SIDE_EXIT: [number, number, number] = [3.0, 0, -4.8]; // 카운터 우측 통로
  const KITCHEN_CORNER: [number, number, number] = [3.0, 0, -3.5];    // 카운터 앞 코너
  const AISLE_KITCHEN_FRONT: [number, number, number] = [0, 0, -3.5]; // 포차 중앙 복도 합류점

  const [bossState, setBossState] = useState<BossState>('cooking');
  const [currentOrder, setCurrentOrder] = useState<ServingOrder | null>(null);
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [speechText, setSpeechText] = useState<string | null>(null);

  // 현재 사장님 위치 및 회전
  const currentPos = useRef<[number, number, number]>([0, 0, -4.8]);
  const currentRot = useRef<number>(0);
  const waypointsRef = useRef<[number, number, number][]>([]);
  const waypointIdxRef = useRef<number>(0);
  const serveTimer = useRef<number>(0);

  // 사장님의 따뜻한 평상시 위로 대사 목록
  const DIALOGUES = [
    '오늘 하루도 참 고생 많았어요. 따뜻한 국물 마셔요.',
    '천천히, 편하게 쉬다 가요.',
    '여기선 아무 걱정 말고 한잔 털어내요.',
    '밤바람이 쌀쌀하죠? 국물 더 줄까요?',
  ];

  // 메뉴 주문 이벤트 수신 (주인장이 직접 메뉴 들고 서빙)
  useEffect(() => {
    const handleOrder = (e: Event) => {
      const customEvent = e as CustomEvent<ServingOrder>;
      if (!customEvent.detail) return;

      const order = customEvent.detail;
      setCurrentOrder(order);
      const orderItems = order.items && order.items.length > 0 ? order.items : [order.item];
      const itemNames = orderItems.map((it) => it.name).join(', ');
      setSpeechText(`"네~ 손님! 주문하신 ${itemNames} 정성껏 가져다 드릴게요!"`);
      soundManager.playOrderSound();

      // 안전 복도 웨이포인트 생성: 조리대 -> 카운터 우측 통로 -> 카운터 코너 -> 중앙 복도 합류 -> 테이블 Z 복도 지점 -> 테이블 옆 서빙 스팟
      waypointsRef.current = [
        KITCHEN_SIDE_EXIT,
        KITCHEN_CORNER,
        AISLE_KITCHEN_FRONT,
        [0, 0, order.targetPos[2]],
        order.targetPos,
      ];
      waypointIdxRef.current = 0;

      // ★ 카메라가 먼저 사장님(조리대)을 포커싱하며 비추고, 정확히 1초(1000ms) 후에 사장님이 쟁반을 들고 이동 시작
      setBossState('preparing');
      setTimeout(() => {
        setBossState('walk_to_table');
      }, 1000);
    };

    window.addEventListener('pocha_serve_order', handleOrder);
    return () => window.removeEventListener('pocha_serve_order', handleOrder);
  }, []);

  // 평상시 대사 순환 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      if (bossState === 'cooking') {
        setDialogueIdx((prev) => (prev + 1) % DIALOGUES.length);
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [bossState]);

  // 주인장 배달(서빙) 상태 부모(PochaScene) 알림: 카메라 자동 포커싱 연동 (서빙 준비 즉시 카메라 이동)
  useEffect(() => {
    const isDelivering =
      bossState === 'preparing' || bossState === 'walk_to_table' || bossState === 'serving';
    if (onServingChange) {
      onServingChange(isDelivering);
    }
  }, [bossState, onServingChange]);

  // 프레임 루프 (서빙 보행 AI & 애니메이션)
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // 실시간 위치를 부모 카메라 타겟 참조용 Ref에 공유
    if (bossPosRef) {
      bossPosRef.current[0] = currentPos.current[0];
      bossPosRef.current[1] = currentPos.current[1];
      bossPosRef.current[2] = currentPos.current[2];
    }

    if (bossState === 'cooking' || bossState === 'preparing') {
      // 주방 조리대 대기 (preparing 시 쟁반 들고 손님 정면 응시하며 1초 대기)
      currentPos.current = [HOME_POS[0], 0, HOME_POS[2]];
      currentRot.current = 0; // 정면 응시

      if (bossState === 'cooking' && ladleRef.current) {
        ladleRef.current.position.x = -1.1 + Math.cos(time * 2.2) * 0.12;
        ladleRef.current.position.z = Math.sin(time * 2.2) * 0.12;
        ladleRef.current.rotation.z = Math.sin(time * 2.2) * 0.25;
        ladleRef.current.position.y = 1.05 + Math.sin(time * 4) * 0.03;
      }
    } else if (bossState === 'walk_to_table') {
      // 테이블로 걸어가기 (웨이포인트를 순차적으로 이동하여 손님 앞까지 확실하게 도착)
      const waypoints = waypointsRef.current;
      const target = waypoints[waypointIdxRef.current] || [0, 0, 0];

      const diffX = target[0] - currentPos.current[0];
      const diffZ = target[2] - currentPos.current[2];
      const distance = Math.hypot(diffX, diffZ);

      const isLastWaypoint = waypointIdxRef.current === waypoints.length - 1;
      const reachThreshold = isLastWaypoint ? 0.45 : 0.35;

      if (distance > reachThreshold) {
        const angle = Math.atan2(diffX, diffZ);
        currentRot.current = THREE.MathUtils.lerp(currentRot.current, angle, delta * 8);
        const speed = 2.4 * delta;
        currentPos.current[0] += Math.sin(angle) * speed;
        currentPos.current[2] += Math.cos(angle) * speed;
      } else {
        if (!isLastWaypoint) {
          // 다음 웨이포인트로 전진
          waypointIdxRef.current += 1;
        } else {
          // 손님 테이블에 최종 도착! 서빙 개시
          setBossState('serving');
          serveTimer.current = 0;
          soundManager.playPouringSound();

          const orderItems = currentOrder?.items && currentOrder.items.length > 0
            ? currentOrder.items
            : currentOrder?.item ? [currentOrder.item] : [];
          const itemNames = orderItems.map((it) => it.name).join(', ');
          setSpeechText(`"주문하신 ${itemNames || '메뉴'} 나왔습니다~ 맛있게 드셔요!"`);

          // 테이블 위에 주문한 모든 메뉴 세팅 이벤트 발송
          if (currentOrder && orderItems.length > 0) {
            orderItems.forEach((it) => {
              window.dispatchEvent(
                new CustomEvent('pocha_table_delivered', {
                  detail: {
                    tableId: currentOrder.tableId,
                    item: it,
                  },
                })
              );
            });
          }
        }
      }
    } else if (bossState === 'serving') {
      // 테이블 앞에서 테이블을 다정하게 바라보며 메뉴를 내려놓고 인사
      serveTimer.current += delta;

      // 테이블 방향을 다정하게 바라보며 메뉴를 내려놓고 인사
      if (currentOrder?.targetPos) {
        // 테이블 중심 좌표 찾기 (테이블 번호 기반 또는 서빙 위치 기준)
        const tableCenterPos: [number, number] = currentOrder.tableId && currentOrder.tableId.startsWith('t')
          ? [
              currentOrder.targetPos[0] < 0 ? -3.8 : 3.8,
              currentOrder.targetPos[2],
            ]
          : [currentOrder.targetPos[0], currentOrder.targetPos[2]];

        const dx = tableCenterPos[0] - currentPos.current[0];
        const dz = tableCenterPos[1] - currentPos.current[2];
        const faceAngle = Math.atan2(dx, dz);
        currentRot.current = THREE.MathUtils.lerp(currentRot.current, faceAngle, delta * 6);
      }

      if (serveTimer.current > 3.5) {
        // 서빙 완료 후 주방으로 복귀 경로 웨이포인트 설정:
        // 테이블 옆 -> 중앙 복도로 후퇴 -> 중앙 복도 따라 주방 앞 직진 -> 카운터 코너 -> 카운터 통로 -> 조리대
        const targetZ = currentOrder?.targetPos ? currentOrder.targetPos[2] : -3.3;
        waypointsRef.current = [
          [0, 0, targetZ],
          AISLE_KITCHEN_FRONT,
          KITCHEN_CORNER,
          KITCHEN_SIDE_EXIT,
          HOME_POS,
        ];
        waypointIdxRef.current = 0;
        setSpeechText('"천천히 편하게 드셔요. 필요한 것 있으면 언제든 불러요~"');
        setBossState('walk_to_kitchen');
      }
    } else if (bossState === 'walk_to_kitchen') {
      // 주방으로 복귀 걸음
      const waypoints = waypointsRef.current;
      const target = waypoints[waypointIdxRef.current] || HOME_POS;

      const diffX = target[0] - currentPos.current[0];
      const diffZ = target[2] - currentPos.current[2];
      const distance = Math.hypot(diffX, diffZ);

      const isLastWaypoint = waypointIdxRef.current === waypoints.length - 1;
      const reachThreshold = isLastWaypoint ? 0.2 : 0.35;

      if (distance > reachThreshold) {
        const angle = Math.atan2(diffX, diffZ);
        currentRot.current = THREE.MathUtils.lerp(currentRot.current, angle, delta * 8);
        const speed = 2.2 * delta;
        currentPos.current[0] += Math.sin(angle) * speed;
        currentPos.current[2] += Math.cos(angle) * speed;
      } else {
        if (!isLastWaypoint) {
          waypointIdxRef.current += 1;
        } else {
          // 주방 조리대 복귀 완료!
          setBossState('cooking');
          setCurrentOrder(null);
          setSpeechText(null);
        }
      }
    }

    // 그룹 위치 및 회전 반영
    if (bossGroupRef.current) {
      bossGroupRef.current.position.set(currentPos.current[0], 0, currentPos.current[2]);
      bossGroupRef.current.rotation.y = currentRot.current;

      // 1. 걸을 때 다정한 할머니 걸음걸이 뒤뚱거림 (sway & bounce)
      if (bossState === 'walk_to_table' || bossState === 'walk_to_kitchen') {
        bossGroupRef.current.position.y = Math.abs(Math.sin(time * 7)) * 0.05;
        bossGroupRef.current.rotation.z = Math.sin(time * 7) * 0.04;
        bossGroupRef.current.rotation.x = 0;
      } else if (bossState === 'serving') {
        // 2. ★ 서빙 시: 단순히 멈춰 서 있지 않고 테이블 위에 쟁반을 정성껏 내리고(bow & present),
        // 손님에게 다정하게 고개 숙여 인사하는 풍성한 리얼 서빙 모션 수행!
        const st = serveTimer.current;
        if (st < 1.4) {
          // [단계 1] 상체를 앞으로 부드럽게 숙이며(Pitch Forward) 쟁반을 테이블을 향해 깊숙이 내밈
          const bowProgress = Math.sin((st / 1.4) * (Math.PI / 2));
          bossGroupRef.current.rotation.x = bowProgress * 0.22; // 상체 정중하게 숙임
          bossGroupRef.current.position.y = -bowProgress * 0.04; // 무릎 살짝 굽힘
        } else if (st < 2.5) {
          // [단계 2] 숙인 채 테이블을 흐뭇하게 바라보며 인사 유지 (공손한 자세)
          bossGroupRef.current.rotation.x = 0.22 + Math.sin(time * 4) * 0.02;
          bossGroupRef.current.position.y = -0.04;
        } else {
          // [단계 3] 상체를 다시 반듯하게 세우며 인자하게 일어섬
          const riseProgress = Math.min(1.0, (st - 2.5) / 0.9);
          bossGroupRef.current.rotation.x = THREE.MathUtils.lerp(0.22, 0, riseProgress);
          bossGroupRef.current.position.y = THREE.MathUtils.lerp(-0.04, 0, riseProgress);
        }
        bossGroupRef.current.rotation.z = 0;
      } else {
        bossGroupRef.current.position.y = 0;
        bossGroupRef.current.rotation.z = 0;
        bossGroupRef.current.rotation.x = 0;
      }
    }

    // 쟁반(Tray) 실감 나는 서빙 모션: 테이블 상판 높이로 내렸다가 올려놓기
    if (trayRef.current) {
      if (bossState === 'serving') {
        const st = serveTimer.current;
        if (st < 1.4) {
          // 쟁반을 테이블 앞쪽으로 내밀며(Z +0.36 -> +0.55) 높이를 테이블 상판(0.85m) 높이에 맞춰 낮춤
          const p = Math.sin((st / 1.4) * (Math.PI / 2));
          trayRef.current.position.set(0, 0.72 - p * 0.16, 0.36 + p * 0.18);
          trayRef.current.rotation.x = -p * 0.12; // 쟁반 수평 보정
        } else if (st < 2.4) {
          // 메뉴를 테이블에 정갈하게 내려놓은 위치 유지
          trayRef.current.position.set(0, 0.56, 0.54);
          trayRef.current.rotation.x = -0.12;
        } else {
          // 빈 쟁반을 가슴 쪽으로 단정하게 다시 거둬들임
          const rp = Math.min(1.0, (st - 2.4) / 1.0);
          trayRef.current.position.set(
            0,
            THREE.MathUtils.lerp(0.56, 0.72, rp),
            THREE.MathUtils.lerp(0.54, 0.36, rp)
          );
          trayRef.current.rotation.x = THREE.MathUtils.lerp(-0.12, 0, rp);
        }
      } else if (bossState === 'walk_to_table' || bossState === 'walk_to_kitchen') {
        // 걸을 때 쟁반이 보행 리듬에 맞춰 자연스럽게 바운스
        trayRef.current.position.set(0, 0.72 + Math.sin(time * 7) * 0.02, 0.36);
        trayRef.current.rotation.x = 0;
      } else {
        trayRef.current.position.set(0, 0.72, 0.36);
        trayRef.current.rotation.x = 0;
      }
    }

    // 고개 끄덕임 및 서빙 시 다정한 인사 끄덕임
    if (headRef.current) {
      if (bossState === 'serving') {
        // 서빙 시 정성스러운 고개 끄덕임 인사 2회
        headRef.current.rotation.x = 0.12 + Math.abs(Math.sin(serveTimer.current * 3.5)) * 0.22;
        headRef.current.rotation.y = Math.sin(serveTimer.current * 1.5) * 0.08;
      } else {
        headRef.current.rotation.x = Math.sin(time * 1.5) * 0.05 + 0.08;
        headRef.current.rotation.y = Math.sin(time * 0.8) * 0.1;
      }
    }
  });

  const isServingMode = bossState !== 'cooking';

  return (
    <group ref={bossGroupRef} position={currentPos.current}>
      {/* 1. 사장님 명찰 및 따뜻한 말풍선 (Billboard) */}
      <Billboard position={[0, 2.05, 0]} follow={true}>
        <Text
          fontSize={0.16}
          color="#fbc531"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#2f3640"
        >
          포차 사장님 {isServingMode && '👵 (직접 서빙 중)'}
        </Text>
        {/* 말풍선 텍스트 */}
        <group position={[0, 0.28, 0]}>
          <Text
            fontSize={0.14}
            color={speechText ? '#ffeaa7' : '#ffffff'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#192a56"
          >
            {speechText ? `"${speechText}"` : `"${DIALOGUES[dialogueIdx]}"`}
          </Text>
        </group>
      </Billboard>

      {/* 2. 푸근한 몸체와 앞치마 */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.38, 12, 16]} />
        <meshStandardMaterial color="#8c7ae6" roughness={0.7} />
      </mesh>

      {/* 흰색 정감 있는 앞치마 */}
      <mesh position={[0, 0.68, 0.13]} castShadow>
        <boxGeometry args={[0.34, 0.52, 0.12]} />
        <meshStandardMaterial color="#f5f6fa" roughness={0.5} />
      </mesh>
      {/* 앞치마 주머니 */}
      <mesh position={[0, 0.55, 0.19]}>
        <boxGeometry args={[0.22, 0.14, 0.02]} />
        <meshStandardMaterial color="#dcdde1" roughness={0.5} />
      </mesh>

      {/* 3. 인자한 할머니 사장님 얼굴 & 머리 */}
      <group ref={headRef} position={[0, 1.25, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#ffeaa7" roughness={0.5} />
        </mesh>

        {/* 회색 올림머리 */}
        <mesh position={[0, 0.08, -0.06]} scale={[1.05, 1.05, 1.1]}>
          <sphereGeometry args={[0.23, 20, 20]} />
          <meshStandardMaterial color="#dcdde1" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.06, -0.22]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#bdc3c7" roughness={0.6} />
        </mesh>

        {/* 눈 (초승달 모양) */}
        <mesh position={[-0.08, 0.02, 0.19]} rotation={[0, 0, -0.1]}>
          <torusGeometry args={[0.025, 0.006, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#2d3436" />
        </mesh>
        <mesh position={[0.08, 0.02, 0.19]} rotation={[0, 0, -0.1]}>
          <torusGeometry args={[0.025, 0.006, 8, 12, Math.PI]} />
          <meshBasicMaterial color="#2d3436" />
        </mesh>

        {/* 인자하고 발그레한 볼터치 */}
        <mesh position={[-0.12, -0.05, 0.17]}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#ff7675" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.12, -0.05, 0.17]}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#ff7675" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 4-A. 평상시 주방 조리: 국자를 쥐고 어묵탕을 젓는 손 */}
      {!isServingMode && (
        <>
          <group ref={ladleRef} position={[-1.1, 1.05, 0]}>
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#ffeaa7" />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.35, 8]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <sphereGeometry args={[0.045, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#7f8c8d" metalness={0.9} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* 왼손 */}
          <mesh position={[0.45, 0.98, 0.25]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#ffeaa7" />
          </mesh>
        </>
      )}

      {/* 4-B. 서빙 중: 양손으로 레트로 은색 알루미늄 서빙 쟁반을 소중히 받쳐 들고 걷기 */}
      {isServingMode && (
        <group ref={trayRef} position={[0, 0.72, 0.36]}>
          {/* 양손 손목 및 손가락 (쟁반 양쪽 테두리를 안정감 있게 파지) */}
          <group position={[-0.26, 0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#ffeaa7" />
            </mesh>
            <mesh position={[0.02, 0.015, 0.01]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.03, 0.02, 0.04]} />
              <meshStandardMaterial color="#ffeaa7" />
            </mesh>
          </group>

          <group position={[0.26, 0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#ffeaa7" />
            </mesh>
            <mesh position={[-0.02, 0.015, 0.01]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.03, 0.02, 0.04]} />
              <meshStandardMaterial color="#ffeaa7" />
            </mesh>
          </group>

          {/* ★ 실제 한국 포차의 시그니처: 레트로 은색 원형 알루미늄 양은 쟁반 */}
          {/* 쟁반 본체 */}
          <mesh position={[0, -0.012, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.28, 0.25, 0.024, 32]} />
            <meshStandardMaterial color="#dcdde1" metalness={0.85} roughness={0.22} />
          </mesh>

          {/* 쟁반 둥근 테두리 림 (Rolled Rim) */}
          <mesh position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.278, 0.01, 10, 32]} />
            <meshStandardMaterial color="#f5f6fa" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* 쟁반 바닥 정겨운 레트로 빨간 장미꽃 원형 문양 디테일 */}
          <group position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh position={[0, 0, 0.001]}>
              <ringGeometry args={[0.035, 0.085, 24]} />
              <meshBasicMaterial color="#e84118" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0.002]}>
              <circleGeometry args={[0.028, 16]} />
              <meshBasicMaterial color="#ff6b6b" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* ★ 실제 주문한 모든 메뉴(주류 + 안주) 100% 실물 3D 렌더링 & 김(Steam) 효과 */}
          {(() => {
            const orderItems =
              currentOrder?.items && currentOrder.items.length > 0
                ? currentOrder.items
                : currentOrder?.item
                ? [currentOrder.item]
                : [];

            if (orderItems.length === 0) return null;

            // 1개 단일 주문: 쟁반 정중앙에 기품 있게 배치
            if (orderItems.length === 1) {
              return (
                <RealisticPochaFood
                  itemId={orderItems[0].id}
                  scale={0.82}
                  position={[0, 0.005, 0]}
                />
              );
            }

            // 2개 주문 (주류 1개 + 안주 1개 등): 쟁반 좌/우에 나란히 실감 나게 배치
            if (orderItems.length === 2) {
              return (
                <>
                  <RealisticPochaFood
                    itemId={orderItems[0].id}
                    scale={0.68}
                    position={[-0.09, 0.005, -0.04]}
                  />
                  <RealisticPochaFood
                    itemId={orderItems[1].id}
                    scale={0.68}
                    position={[0.08, 0.005, 0.04]}
                  />
                </>
              );
            }

            // 3개 이상 복수 주문: 쟁반 위에 정갈하게 균형 배치
            return (
              <>
                {orderItems.map((it, idx) => {
                  const angle = (idx / orderItems.length) * Math.PI * 2;
                  const rad = 0.11;
                  const px = Math.cos(angle) * rad;
                  const pz = Math.sin(angle) * rad;
                  return (
                    <RealisticPochaFood
                      key={`${it.id}_${idx}`}
                      itemId={it.id}
                      scale={orderItems.length >= 4 ? 0.5 : 0.58}
                      position={[px, 0.005, pz]}
                    />
                  );
                })}
              </>
            );
          })()}
        </group>
      )}
    </group>
  );
};
