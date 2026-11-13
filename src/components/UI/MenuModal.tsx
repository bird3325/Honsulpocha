import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { PochaMenuItem } from '../../types';
import { POCHA_MENUS } from '../../data/menuData';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrder: (item: PochaMenuItem) => void;
  isServing?: boolean;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onOrder,
  isServing = false,
}) => {
  const [orderedItem, setOrderedItem] = useState<PochaMenuItem | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const drinks = POCHA_MENUS.filter((m) => m.section === 'drink');
  const beverages = POCHA_MENUS.filter((m) => m.section === 'beverage');
  const meals = POCHA_MENUS.filter((m) => m.section === 'meal');
  const stews = POCHA_MENUS.filter((m) => m.section === 'stew');
  const snacksLeft = POCHA_MENUS.filter((m) => m.section === 'snack').slice(0, 7);
  const snacksRight = POCHA_MENUS.filter((m) => m.section === 'snack').slice(7);

  const handleItemClick = (item: PochaMenuItem) => {
    if (isServing) return;
    setOrderedItem(item);
    onOrder(item);
    setTimeout(() => {
      setOrderedItem(null);
      onClose();
    }, 600);
  };

  // 개별 메뉴 행 렌더링 컴포넌트
  const renderRow = (item: PochaMenuItem, customLabel?: string) => {
    const isOrdered = orderedItem?.id === item.id;
    const isHovered = hoveredId === item.id;

    return (
      <div
        key={item.id}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        className="flex items-center justify-between py-[2.5px] px-1.5 rounded transition-all cursor-pointer relative group"
        style={{
          backgroundColor: isOrdered
            ? 'rgba(235, 77, 75, 0.35)'
            : isHovered
              ? 'rgba(255, 255, 255, 0.55)'
              : 'transparent',
          transform: isHovered ? 'translateX(2px)' : 'none',
        }}
        title={`${item.name} - ${item.desc} (클릭 시 주문)`}
      >
        {/* 메뉴 이름 & 한자 */}
        <div className="flex items-center gap-1 overflow-hidden">
          <span
            className="font-black text-[13px] md:text-[14px] tracking-wider text-[#1e272e] whitespace-nowrap"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            {customLabel || item.name}
          </span>
          {item.hanja && (
            <span className="text-[10px] text-[#485460] font-normal tracking-tight">
              {item.hanja}
            </span>
          )}
        </div>

        {/* 가격 & 주문 상태 */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          {isOrdered ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#d63031] bg-white px-1.5 py-0.5 rounded shadow-sm">
              <Check size={12} /> 주문됨
            </span>
          ) : (
            <span className="font-extrabold text-[13px] md:text-[14px] text-[#d63031] tracking-tight">
              {item.price}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.22)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 1. 실제 코팅 필름 파우치 테두리 (투명 라미네이팅 마감) */}
      <div
        className="relative w-full max-w-[480px] rounded-[24px] p-2.5 md:p-3 transition-transform"
        style={{
          background: 'rgba(255, 255, 255, 0.42)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.75)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition shadow-lg active:scale-95"
          style={{
            backgroundColor: '#d63031',
            color: '#ffffff',
            border: '2px solid #ffffff',
          }}
          title="메뉴판 닫기"
        >
          <X size={18} strokeWidth={2.8} />
        </button>

        {/* 2. 실제 노란색 포장마차 메뉴판 용지 (사진 속 압구정포차 시그니처 옐로우) */}
        <div
          className="w-full rounded-[16px] px-4 py-4 md:px-5 md:py-4 select-none relative overflow-hidden"
          style={{
            backgroundColor: '#ffdc34',
            backgroundImage: 'linear-gradient(180deg, #ffea65 0%, #ffd32a 50%, #fec917 100%)',
            boxShadow: 'inset 0 0 25px rgba(212, 160, 23, 0.45)',
            border: '1.5px solid #d49e12',
          }}
        >
          {/* A. 상단 타이틀 헤더: "혼술포차" */}
          <div className="text-center mb-2.5">
            <h1
              className="text-3xl md:text-[34px] font-black tracking-tight text-[#1e272e] leading-none"
              style={{
                fontFamily: "'Nanum Gothic', 'Noto Sans KR', sans-serif",
                textShadow: '1px 1px 0px rgba(255,255,255,0.7)',
              }}
            >
              혼 술 포 차
            </h1>
            {/* 경고 문구: ★미성년자에게는 절.대 술을 팔지 않습니다. */}
            <p className="text-[12px] md:text-[13px] font-black text-[#d63031] mt-1.5 tracking-tight flex items-center justify-center gap-1">
              <span>★</span>
              <span>미성년자에게는 절.대 술을 팔지 않습니다.</span>
            </p>
          </div>

          {/* B. 상단 2단 레이아웃 (좌: 주류 + 술병 일러스트 / 우: 음료 + 식사 + 뚝배기) */}
          <div className="grid grid-cols-2 gap-3 pb-2.5 border-b-2 border-[#1e272e]/20">
            {/* [좌측 열]: 주류 */}
            <div className="flex flex-col justify-between">
              <div>
                {/* 섹션 타이틀: 주류 */}
                <div className="flex items-center gap-1.5 mb-1 pb-0.5 border-b border-[#d63031]">
                  <span className="font-black text-[13px] text-[#d63031] tracking-wider">주류</span>
                  <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
                </div>

                {/* 주류 리스트 */}
                <div className="space-y-[1px]">
                  {renderRow(drinks[0], '테　　라')}
                  {renderRow(drinks[1], '소　　주')}
                  {renderRow(drinks[2], '참 이 슬')}
                  {renderRow(drinks[3], '청　　하')}
                  {renderRow(drinks[4], '매 화 수')}
                  {renderRow(drinks[5], '자몽에이슬')}
                </div>
              </div>

              {/* 사진 속 실제 맥주/소주병 3종 그래픽 (TERRA / Kelly / 참이슬) */}
              <div className="flex items-end justify-center gap-2 pt-2 px-1">
                {/* 테라 녹색 맥주병 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-4 h-12 rounded-t-sm rounded-b-md relative flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: '#1e7e34', border: '1px solid #155724' }}
                  >
                    <div className="w-1.5 h-3 bg-[#1e7e34] absolute -top-2.5 rounded-t-sm"></div>
                    <span className="text-[6px] font-black text-[#ffeaa7] transform -rotate-90 tracking-tighter">
                      TERRA
                    </span>
                  </div>
                </div>

                {/* 켈리 골드 앰버 맥주병 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-4 h-13 rounded-t-sm rounded-b-md relative flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: '#d35400', border: '1px solid #b33939' }}
                  >
                    <div className="w-1.5 h-3 bg-[#d35400] absolute -top-2.5 rounded-t-sm"></div>
                    <span className="text-[6.5px] font-black text-[#ffffff] transform -rotate-90 tracking-tighter">
                      Kelly
                    </span>
                  </div>
                </div>

                {/* 참이슬 초록 소주병 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-3.5 h-10 rounded-t-sm rounded-b-md relative flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: '#009432', border: '1px solid #006266' }}
                  >
                    <div className="w-1.5 h-2.5 bg-[#009432] absolute -top-2 rounded-t-sm"></div>
                    <div className="w-2.5 h-4 bg-white/95 rounded-xs flex items-center justify-center">
                      <span className="text-[5px] font-black text-[#006266] leading-none text-center">
                        참이슬
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* [우측 열]: 음료 / 식사 / 뚝배기 */}
            <div className="space-y-1.5">
              {/* 1. 음료 */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5 pb-0.5 border-b border-[#d63031]">
                  <span className="font-black text-[12px] text-[#d63031] tracking-wider">음료</span>
                  <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
                </div>
                <div className="space-y-[1px]">
                  {renderRow(beverages[0], '콜　　라')}
                  {renderRow(beverages[1], '사 이 다')}
                </div>
              </div>

              {/* 2. 식사 */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5 pb-0.5 border-b border-[#d63031]">
                  <span className="font-black text-[12px] text-[#d63031] tracking-wider">식사</span>
                  <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
                </div>
                <div className="space-y-[1px]">
                  {renderRow(meals[0], '우　　동')}
                  {renderRow(meals[1], '라면계란')}
                  {renderRow(meals[2], '잔치국수')}
                </div>
              </div>

              {/* 3. 뚝배기 */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5 pb-0.5 border-b border-[#d63031]">
                  <span className="font-black text-[12px] text-[#d63031] tracking-wider">뚝배기</span>
                  <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
                </div>
                <div className="space-y-[1px]">
                  {renderRow(stews[0], '홍 합 탕')}
                  {renderRow(stews[1], '어 묵 탕')}
                  {renderRow(stews[2], '계 란 탕')}
                  {renderRow(stews[3], '번데기탕')}
                </div>
              </div>
            </div>
          </div>

          {/* C. 하단 섹션: 안주 (2열 그리드) */}
          <div className="pt-2">
            {/* 섹션 타이틀: 안주 */}
            <div className="flex items-center gap-1.5 mb-1 pb-0.5 border-b border-[#d63031]">
              <span className="font-black text-[14px] text-[#d63031] tracking-wider">안주</span>
              <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
            </div>

            {/* 안주 2열 그리드 리스트 */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-[1px]">
              {/* 왼쪽 안주 리스트 (7개) */}
              <div className="space-y-[1px]">
                {renderRow(snacksLeft[0], '오 돌 뼈')}
                {renderRow(snacksLeft[1], '닭 똥 집')}
                {renderRow(snacksLeft[2], '꼼 장 어')}
                {renderRow(snacksLeft[3], '오징어볶음')}
                {renderRow(snacksLeft[4], '닭　　발')}
                {renderRow(snacksLeft[5], '두부김치')}
                {renderRow(snacksLeft[6], '꽁치구이')}
              </div>

              {/* 오른쪽 안주 리스트 (6개) */}
              <div className="space-y-[1px]">
                {renderRow(snacksRight[0], '꼬　　막')}
                {renderRow(snacksRight[1], '피 꼬 막')}
                {renderRow(snacksRight[2], '석　　굴')}
                {renderRow(snacksRight[3], '계란말이')}
                {renderRow(snacksRight[4], '오징어데침')}
                {renderRow(snacksRight[5], '은행구이')}
              </div>
            </div>
          </div>

          {/* D. 하단 주문 도움말 힌트 */}
          <p className="text-[11px] text-center font-bold text-[#57606f] mt-3">
            ※ 원하시는 메뉴를 누르면 사장님이 테이블로 직접 배달해 드립니다.
          </p>
        </div>
      </div>
    </div>
  );
};
