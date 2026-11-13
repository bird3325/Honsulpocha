import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { ServingOrder } from '../types';
import { soundManager } from './AudioController';
import { RealisticPochaFood } from './RealisticPochaFood';

type BossState = 'cooking' | 'walk_to_table' | 'serving' | 'walk_to_kitchen';

export const GrandmaBoss: React.FC = () => {
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
      setBossState('walk_to_table');
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

  // 프레임 루프 (서빙 보행 AI & 애니메이션)
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (bossState === 'cooking') {
      // 주방에서 어묵 국물 젓기
      currentPos.current = [HOME_POS[0], 0, HOME_POS[2]];
      currentRot.current = 0; // 정면 응시

      if (ladleRef.current) {
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

      // 테이블 방향(좌측 테이블이면 -90도, 우측 테이블이면 +90도)으로 부드럽게 시선 회전
      if (currentOrder?.targetPos) {
        const faceAngle = currentOrder.targetPos[0] < 0 ? -Math.PI / 2 : Math.PI / 2;
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

      // 걸을 때 다정한 할머니 걸음걸이 뒤뚱거림 (sway & bounce)
      if (bossState === 'walk_to_table' || bossState === 'walk_to_kitchen') {
        bossGroupRef.current.position.y = Math.abs(Math.sin(time * 7)) * 0.05;
        bossGroupRef.current.rotation.z = Math.sin(time * 7) * 0.04;
      } else {
        bossGroupRef.current.position.y = 0;
        bossGroupRef.current.rotation.z = 0;
      }
    }

    // 고개 끄덕임
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 1.5) * 0.05 + 0.08;
      headRef.current.rotation.y = Math.sin(time * 0.8) * 0.1;
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

      {/* 4-B. 서빙 중: 양손으로 은색 알루미늄 서빙 쟁반을 소중히 받쳐 들고 걷기 */}
      {isServingMode && (
        <group ref={trayRef} position={[0, 0.72, 0.36]}>
          {/* 양손 손목 */}
          <mesh position={[-0.22, 0.02, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color="#ffeaa7" />
          </mesh>
          <mesh position={[0.22, 0.02, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color="#ffeaa7" />
          </mesh>

          {/* 은색 포차 레트로 원형 서빙 쟁반 */}
          <mesh position={[0, -0.02, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.24, 0.02, 24]} />
            <meshStandardMaterial color="#bdc3c7" metalness={0.75} roughness={0.3} />
          </mesh>

          {/* 쟁반 위 주문 메뉴와 100% 동일한 실물 3D 음식 렌더링 */}
          {currentOrder && (
            <RealisticPochaFood
              itemId={currentOrder.item.id}
              scale={0.92}
              position={[0, 0, 0]}
            />
          )}
        </group>
      )}
    </group>
  );
};
