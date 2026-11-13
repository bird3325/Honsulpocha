import * as THREE from 'three';

/**
 * 한국 길거리 및 인도에 널리 쓰이는 정겨운 인터로킹 보도블럭 텍스처를
 * Three.js CanvasTexture로 절차적(Procedural) 생성합니다.
 * 외부 이미지 로딩 없이 즉시 렌더링되며, 어두운 머리색과 확실한 대비를 제공합니다.
 */
export function createKoreanPavementTexture(options?: {
  repeatX?: number;
  repeatY?: number;
  mode?: 'tent' | 'street';
}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 기본 바탕 (메지/줄눈 색상: 촉촉하고 차분한 다크 슬레이트)
  ctx.fillStyle = '#3a3f44';
  ctx.fillRect(0, 0, 1024, 1024);

  // 한국 보도블럭 색상 팔레트 (밝은 회색, 온화한 테라코타 적갈색, 따뜻한 황토 베이지)
  // 어두운 머리색(#2d3436)과 강한 명도 대비를 이루도록 밝고 화사한 톤 위주로 구성
  const palette = [
    { base: '#d5ccc2', highlight: '#e8e2d9', shadow: '#b5aca1' }, // 밝은 웜그레이 콘크리트 블록
    { base: '#dfc6a3', highlight: '#eedec2', shadow: '#c4aa86' }, // 따뜻한 황토 베이지 블록
    { base: '#d88d74', highlight: '#e8a994', shadow: '#be735a' }, // 한국 특유의 연적색/테라코타 보도블럭
    { base: '#cf7b60', highlight: '#e2947a', shadow: '#b36147' }, // 적벽돌색 포인트 블록
    { base: '#e0d8cf', highlight: '#f0ece6', shadow: '#c5bcb2' }, // 연한 화강석 아이보리 블록
    { base: '#c7bcb0', highlight: '#ded4c8', shadow: '#aba094' }, // 내추럴 스톤 그레이 블록
  ];

  // 블록 그리드 설정 (200x100mm 비율 모방: 가로 128px, 세로 64px)
  const blockW = 128;
  const blockH = 64;
  const gap = 4; // 줄눈 간격

  const rows = Math.ceil(1024 / blockH);
  const cols = Math.ceil(1024 / blockW) + 2;

  // 시드 기반 또는 결정론적 의사 난수 생성기 (일관된 패턴 유지)
  let seed = 42;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let r = 0; r < rows; r++) {
    // 한국 보도블럭 러닝본드(엇갈림) 패턴: 짝수 행은 반 블록(64px) 오프셋
    const offsetX = (r % 2) * (blockW / 2);

    for (let c = -1; c < cols; c++) {
      const x = c * blockW + offsetX + gap / 2;
      const y = r * blockH + gap / 2;
      const w = blockW - gap;
      const h = blockH - gap;

      // 한국 보도블럭 특유의 패턴 배색 선택
      // 회색 45%, 테라코타/적색 30%, 베이지 25% 비율
      const randVal = random();
      let colorIndex = 0;
      if (randVal < 0.35) {
        colorIndex = 0; // 웜그레이
      } else if (randVal < 0.55) {
        colorIndex = 1; // 황토 베이지
      } else if (randVal < 0.75) {
        colorIndex = 2; // 테라코타
      } else if (randVal < 0.88) {
        colorIndex = 3; // 적벽돌
      } else if (randVal < 0.95) {
        colorIndex = 4; // 아이보리
      } else {
        colorIndex = 5; // 스톤그레이
      }

      const p = palette[colorIndex];

      // 1. 블록 기본 면 채우기 (라운드 챔퍼 느낌의 둥근 모서리)
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.fillStyle = p.base;
      ctx.fill();

      // 2. 모서리 입체 베벨 (위/왼쪽 하이라이트)
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.highlight;
      ctx.beginPath();
      ctx.moveTo(x + 1, y + h - 2);
      ctx.lineTo(x + 1, y + 1);
      ctx.lineTo(x + w - 2, y + 1);
      ctx.stroke();

      // 모서리 입체 베벨 (아래/오른쪽 음영)
      ctx.strokeStyle = p.shadow;
      ctx.beginPath();
      ctx.moveTo(x + w - 1, y + 2);
      ctx.lineTo(x + w - 1, y + h - 1);
      ctx.lineTo(x + 2, y + h - 1);
      ctx.stroke();

      // 3. 콘크리트 보도블럭 미세 입자 노이즈 질감
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      for (let n = 0; n < 12; n++) {
        const nx = x + 3 + random() * (w - 6);
        const ny = y + 3 + random() * (h - 6);
        const nSize = 1 + random() * 2;
        ctx.fillRect(nx, ny, nSize, nSize);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let n = 0; n < 10; n++) {
        const nx = x + 3 + random() * (w - 6);
        const ny = y + 3 + random() * (h - 6);
        const nSize = 1 + random() * 1.5;
        ctx.fillRect(nx, ny, nSize, nSize);
      }
    }
  }

  // 4. 비에 젖은 밤거리의 은은한 물기 반사/그라데이션 효과
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.02)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const repeatX = options?.repeatX ?? 8;
  const repeatY = options?.repeatY ?? 8;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;

  return texture;
}

