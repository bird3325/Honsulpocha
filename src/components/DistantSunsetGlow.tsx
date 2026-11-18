import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * 노을빛 저녁(sunset) 모드일 때 서쪽 먼 지평선에만 은은하게 걸려 있는 저녁 노을빛 연출
 * (전체 씬의 색상은 일반 밤처럼 유지되면서, 저 멀리 지평선에만 노을이 살짝 보임)
 */
export const DistantSunsetGlow: React.FC = () => {
  // 1. 절차적 먼 지평선 노을 그라데이션 텍스처 (상단: 투명 밤하늘 -> 중단: 살구 오렌지 -> 하단: 은은한 노을빛)
  const sunsetTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // 세로 방향 그라데이션: 상공 밤하늘은 100% 투명하게 페이드아웃하여 어두운 밤하늘과 자연스럽게 블렌딩
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, 'rgba(5, 7, 10, 0.0)');
    grad.addColorStop(0.3, 'rgba(108, 92, 231, 0.08)');  // 상공의 은은한 저녁 보랏빛 잔상
    grad.addColorStop(0.55, 'rgba(235, 94, 40, 0.45)');  // 부드러운 살구빛 웜톤
    grad.addColorStop(0.75, 'rgba(243, 156, 18, 0.65)'); // 지평선 바로 위 따뜻한 노을빛
    grad.addColorStop(0.92, 'rgba(230, 126, 34, 0.5)');
    grad.addColorStop(1.0, 'rgba(18, 14, 24, 0.15)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // 가로 방향 양쪽 끝단 부드러운 페이드아웃 (지평선 중심부에서 좌우로 부드럽게 감쇄)
    ctx.globalCompositeOperation = 'destination-in';
    const horizGrad = ctx.createLinearGradient(0, 0, 512, 0);
    horizGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    horizGrad.addColorStop(0.18, 'rgba(0, 0, 0, 0.85)');
    horizGrad.addColorStop(0.5, 'rgba(0, 0, 0, 1.0)');
    horizGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0.85)');
    horizGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = horizGrad;
    ctx.fillRect(0, 0, 512, 256);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <group>
      {/* 1. 서쪽 도심 마천루 뒤편 먼 지평선에 완만하게 펼쳐진 노을빛 곡면 파노라마 */}
      <mesh
        position={[0, 11, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        {/* 반경 68m, 높이 24m, 서쪽 90도 시야각을 완만하게 감싸는 곡면 스크린 */}
        <cylinderGeometry args={[68, 68, 24, 32, 1, true, Math.PI * 0.75, Math.PI * 0.5]} />
        <meshBasicMaterial
          map={sunsetTexture}
          transparent
          opacity={0.82}
          depthWrite={false}
          side={THREE.BackSide} // 원통 안쪽(포차 방향)을 바라봄
        />
      </mesh>

      {/* 2. 서쪽 먼 마천루 실루엣 틈새로 살짝 걸려 있는 은은한 저녁 해 잔상 글로우 */}
      <mesh position={[-62, 5.2, -6]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[5.2, 32]} />
        <meshBasicMaterial
          color="#ff793f"
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
