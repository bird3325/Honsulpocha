import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Sparkles, UtensilsCrossed } from 'lucide-react';
import { PochaMenuItem } from '../../types';
import { POCHA_MENUS } from '../../data/menuData';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrder: (items: PochaMenuItem[]) => void;
  isServing?: boolean;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onOrder,
  isServing = false,
}) => {
  const [selectedItems, setSelectedItems] = useState<PochaMenuItem[]>([]);
  const [isOrdered, setIsOrdered] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 모달이 열릴 때 항상 최상단('혼술포차' 타이틀)으로 스크롤 초기화
  useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      setSelectedItems([]);
      setIsOrdered(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const drinks = POCHA_MENUS.filter((m) => m.section === 'drink');
  const beverages = POCHA_MENUS.filter((m) => m.section === 'beverage');
  const meals = POCHA_MENUS.filter((m) => m.section === 'meal');
  const stews = POCHA_MENUS.filter((m) => m.section === 'stew');
  const snacksLeft = POCHA_MENUS.filter((m) => m.section === 'snack').slice(0, 7);
  const snacksRight = POCHA_MENUS.filter((m) => m.section === 'snack').slice(7);

  // 메뉴 선택 토글 (복수 선택 지원)
  const handleToggleItem = (item: PochaMenuItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  // 총 선택 금액 합산 계산
  const totalPrice = selectedItems.reduce((acc, it) => {
    const priceNum = parseInt(it.price.replace(/[^0-9]/g, ''), 10) || 0;
    return acc + priceNum;
  }, 0);

  // 주문하기 버튼 클릭 시 주문 실행
  const handleConfirmOrder = () => {
    if (selectedItems.length === 0 || isServing || isOrdered) return;
    setIsOrdered(true);
    onOrder(selectedItems);
    setTimeout(() => {
      setIsOrdered(false);
      setSelectedItems([]);
      onClose();
    }, 600);
  };

  // 개별 메뉴 행 렌더링 컴포넌트 (국문 + 영문 병기)
  const renderRow = (item: PochaMenuItem, customLabel?: string) => {
    const isSelected = selectedItems.some((p) => p.id === item.id);

    return (
      <div
        key={item.id}
        onClick={() => handleToggleItem(item)}
        className="flex items-center justify-between py-[2px] md:py-[2.5px] px-1 md:px-1.5 rounded transition-all cursor-pointer relative select-none"
        style={{
          backgroundColor: isSelected
            ? 'rgba(214, 48, 49, 0.22)'
            : 'transparent',
          outline: isSelected ? '1.5px solid #d63031' : 'none',
          boxShadow: isSelected ? '0 0 8px rgba(214, 48, 49, 0.35)' : 'none',
          borderRadius: '6px',
        }}
        title={`${item.name} (${item.enName || ''}) - ${item.desc} (터치하여 선택/해제)`}
      >
        {/* 메뉴 이름 & 영문명 & 한자 */}
        <div className="flex items-center gap-1 overflow-hidden">
          <span
            className="font-black text-[12px] sm:text-[13px] md:text-[14px] tracking-wide text-[#1e272e] whitespace-nowrap"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            {customLabel || item.name}
          </span>
          {item.enName && (
            <span className="text-[8.5px] sm:text-[9.5px] text-[#2d3436]/75 font-bold tracking-tight whitespace-nowrap">
              {item.enName}
            </span>
          )}
          {item.hanja && (
            <span className="text-[8px] sm:text-[9px] text-[#636e72] font-normal tracking-tight hidden sm:inline">
              {item.hanja}
            </span>
          )}
        </div>

        {/* 가격 & 선택 뱃지 */}
        <div className="flex items-center gap-1 shrink-0 pl-1">
          {isSelected && (
            <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black text-white bg-[#d63031] px-1.5 py-0.5 rounded shadow-xs">
              <Check size={10} strokeWidth={3} /> 선택됨
            </span>
          )}
          <span className="font-extrabold text-[12px] sm:text-[13px] md:text-[14px] text-[#d63031] tracking-tight">
            {item.price}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-start sm:items-center p-2 sm:p-4 md:p-6 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 1. 실제 코팅 필름 파우치 테두리 (모바일 화면에 맞춰 최대 높이 및 스크롤 지원) */}
      <div
        className="relative w-full max-w-[480px] rounded-[20px] md:rounded-[24px] p-2 md:p-3 transition-transform my-auto flex flex-col"
        style={{
          maxHeight: 'min(88dvh, 88vh)',
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 닫기 버튼 (모바일 화면 밖으로 잘리지 않도록 안전 배치) */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 sm:-top-2.5 sm:-right-2.5 z-30 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition shadow-lg active:scale-95"
          style={{
            backgroundColor: '#d63031',
            color: '#ffffff',
            border: '2px solid #ffffff',
          }}
          title="메뉴판 닫기"
        >
          <X size={18} strokeWidth={2.8} />
        </button>

        {/* 2. 실제 노란색 포장마차 메뉴판 용지 (내부 스크롤 가능 및 진입 시 상단 정렬) */}
        <div
          ref={scrollContainerRef}
          className="w-full rounded-[14px] md:rounded-[16px] px-3 py-3 md:px-5 md:py-4 select-none relative overflow-y-auto flex-1 flex flex-col justify-between"
          style={{
            backgroundColor: '#ffdc34',
            backgroundImage: 'linear-gradient(180deg, #ffea65 0%, #ffd32a 50%, #fec917 100%)',
            boxShadow: 'inset 0 0 25px rgba(212, 160, 23, 0.45)',
            border: '1.5px solid #d49e12',
          }}
        >
          <div>
            {/* A. 상단 타이틀 헤더: "혼술포차 (HONSUL POCHA)" */}
            <div className="text-center mb-1.5">
              <h1
                className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-tight text-[#1e272e] leading-none"
                style={{
                  fontFamily: "'Nanum Gothic', 'Noto Sans KR', sans-serif",
                  textShadow: '1px 1px 0px rgba(255,255,255,0.7)',
                }}
              >
                혼 술 포 차
              </h1>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold text-[#2d3436]/70 tracking-widest uppercase mt-0.5">
                HONSUL POCHA • KOREAN STREET PUB
              </p>
              {/* 경고 문구 */}
              <p className="text-[10px] sm:text-[11px] md:text-[12px] font-black text-[#d63031] mt-0.5 tracking-tight flex items-center justify-center gap-1">
                <span>★</span>
                <span>미성년자에게는 절.대 술을 팔지 않습니다. (No Minors)</span>
              </p>
            </div>

            {/* B. 상단 2단 레이아웃 (좌: 주류 + 술병 일러스트 / 우: 음료 + 식사 + 뚝배기) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-2 border-b-2 border-[#1e272e]/20">
              {/* [좌측 열]: 주류 */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1 pb-0.5 border-b border-[#d63031]">
                    <span className="font-black text-[12px] sm:text-[13px] text-[#d63031] tracking-wider">주류</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#d63031]/80">DRINKS</span>
                    <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
                  </div>

                  <div className="space-y-[1px]">
                    {renderRow(drinks[0], '테　　라')}
                    {renderRow(drinks[1], '소　　주')}
                    {renderRow(drinks[2], '참 이 슬')}
                    {renderRow(drinks[3], '청　　하')}
                    {renderRow(drinks[4], '매 화 수')}
                    {renderRow(drinks[5], '자몽에이슬')}
                  </div>
                </div>

                {/* 테라 / Kelly / 참이슬 미니어처 병 그래픽 */}
                <div className="flex items-end justify-center gap-1.5 pt-1.5 px-0.5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-3.5 h-10 md:w-4 md:h-12 rounded-t-xs rounded-b-sm relative flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: '#1e7e34', border: '1px solid #155724' }}
                    >
                      <div className="w-1.5 h-2.5 bg-[#1e7e34] absolute -top-2 rounded-t-xs"></div>
                      <span className="text-[5px] md:text-[6px] font-black text-[#ffeaa7] transform -rotate-90 tracking-tighter">
                        TERRA
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className="w-3.5 h-11 md:w-4 md:h-13 rounded-t-xs rounded-b-sm relative flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: '#d35400', border: '1px solid #b33939' }}
                    >
                      <div className="w-1.5 h-2.5 bg-[#d35400] absolute -top-2 rounded-t-xs"></div>
                      <span className="text-[5.5px] md:text-[6.5px] font-black text-[#ffffff] transform -rotate-90 tracking-tighter">
                        Kelly
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className="w-3 h-9 md:w-3.5 md:h-10 rounded-t-xs rounded-b-sm relative flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: '#009432', border: '1px solid #006266' }}
                    >
                      <div className="w-1 h-2 bg-[#009432] absolute -top-1.5 rounded-t-xs"></div>
                      <div className="w-2 h-3.5 bg-white/95 rounded-xs flex items-center justify-center">
                        <span className="text-[4px] md:text-[5px] font-black text-[#006266] leading-none text-center">
                          참이슬
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* [우측 열]: 음료 / 식사 / 뚝배기 */}
              <div className="space-y-1">
                {/* 1. 음료 */}
                <div>
                  <div className="flex items-center gap-1 mb-0.5 pb-0.5 border-b border-[#d63031]">
                    <span className="font-black text-[11px] sm:text-[12px] text-[#d63031] tracking-wider">음료</span>
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#d63031]/80">BEVERAGES</span>
                    <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
                  </div>
                  <div className="space-y-[1px]">
                    {renderRow(beverages[0], '콜　　라')}
                    {renderRow(beverages[1], '사 이 다')}
                  </div>
                </div>

                {/* 2. 식사 */}
                <div>
                  <div className="flex items-center gap-1 mb-0.5 pb-0.5 border-b border-[#d63031]">
                    <span className="font-black text-[11px] sm:text-[12px] text-[#d63031] tracking-wider">식사</span>
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#d63031]/80">MEALS</span>
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
                  <div className="flex items-center gap-1 mb-0.5 pb-0.5 border-b border-[#d63031]">
                    <span className="font-black text-[11px] sm:text-[12px] text-[#d63031] tracking-wider">뚝배기</span>
                    <span className="text-[8.5px] sm:text-[9.5px] font-bold text-[#d63031]/80">STEW</span>
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
            <div className="pt-1.5">
              <div className="flex items-center gap-1 mb-1 pb-0.5 border-b border-[#d63031]">
                <span className="font-black text-[13px] sm:text-[14px] text-[#d63031] tracking-wider">안주</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#d63031]/80">ANJU • DISHES</span>
                <div className="h-[1px] bg-[#d63031] flex-1 opacity-60"></div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-[1px]">
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
          </div>

          {/* D. 하단 주문하기 실행 바 (Sticky Bottom - 복수 선택 후 주문하기 버튼 클릭 시 주문) */}
          <div className="sticky bottom-0 z-20 pt-2.5 pb-0.5 mt-2 border-t-2 border-[#1e272e]/15 bg-[#ffd32a]/95 backdrop-blur-sm">
            <button
              onClick={handleConfirmOrder}
              disabled={selectedItems.length === 0 || isServing || isOrdered}
              className="w-full py-2.5 md:py-3 px-3 rounded-xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              style={{
                backgroundColor: isOrdered
                  ? '#2ed573'
                  : selectedItems.length > 0
                  ? '#d63031'
                  : 'rgba(45, 52, 54, 0.35)',
                color: isOrdered || selectedItems.length > 0 ? '#ffffff' : '#4a5568',
                border: selectedItems.length > 0 ? '1.5px solid #ff7675' : '1px solid rgba(0,0,0,0.1)',
                cursor: selectedItems.length > 0 && !isServing ? 'pointer' : 'not-allowed',
              }}
            >
              {isOrdered ? (
                <>
                  <Check size={18} strokeWidth={3} />
                  <span>주문 접수 완료! 사장님이 준비 중... (Order Placed!)</span>
                </>
              ) : selectedItems.length > 0 ? (
                <>
                  <Sparkles size={18} />
                  <span>
                    {selectedItems.length === 1
                      ? `[${selectedItems[0].name} (${selectedItems[0].enName || ''}) ${selectedItems[0].price}원] 주문하기 (Order)`
                      : `[총 ${selectedItems.length}개 (${totalPrice.toLocaleString()}원)] 주문하기 (Order)`}
                  </span>
                </>
              ) : (
                <>
                  <UtensilsCrossed size={16} />
                  <span>원하시는 메뉴를 터치해 선택해 주세요 (Select Menu)</span>
                </>
              )}
            </button>
            <p className="text-[10px] md:text-[11px] text-center font-bold text-[#57606f] mt-1.5">
              ※ 메뉴를 여러 개 선택하신 후 [주문하기] 버튼을 누르면 사장님이 한 번에 배달해 드립니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
