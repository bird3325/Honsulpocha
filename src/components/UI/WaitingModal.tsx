import React from 'react';
import { Clock, Users, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChairSlot } from '../../types';

interface WaitingModalProps {
  isOpen: boolean;
  mode: 'register' | 'called'; // 'register': 웨이팅 등록 신청, 'called': 자리 나서 호출 알림
  waitingNumber?: number;
  assignedChair?: ChairSlot | null;
  onRegister: () => void;
  onAcceptSeat?: () => void;
  onClose: () => void;
}

export const WaitingModal: React.FC<WaitingModalProps> = ({
  isOpen,
  mode,
  waitingNumber = 1,
  assignedChair,
  onRegister,
  onAcceptSeat,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#12151e]/95 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-center flex flex-col items-center overflow-hidden">
        {/* 상단 닫기 X 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* 앰비언트 백그라운드 오라 글로우 */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600/15 rounded-full blur-2xl pointer-events-none" />

        {mode === 'register' ? (
          <>
            {/* 1. 웨이팅 등록 모드 */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Clock size={32} className="text-amber-300 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-md">
                <Sparkles size={13} className="text-amber-950 font-bold" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight">
              포차 만석 안내
            </h3>
            <p className="text-xs text-amber-200/90 font-medium mb-4">
              현재 포차 안 모든 테이블에 손님이 가득 찼습니다
            </p>

            <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-5 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Users size={14} className="text-orange-400" />
                  <span>현재 대기 팀</span>
                </span>
                <span className="text-white font-bold">{waitingNumber - 1}팀 대기 중</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  <span>예상 대기 시간</span>
                </span>
                <span className="text-amber-300 font-bold">약 1~2분 내외</span>
              </div>
              <div className="border-t border-white/5 pt-2 text-[11px] text-gray-300 leading-relaxed italic">
                👵 사장님: "비도 오는데 밖에서 너무 서 계시지 말고, 대기 명부에 올려두시면 자리가 나는 즉시 제일 먼저 불러드릴게요~"
              </div>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={onRegister}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] transition-all text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>대기 명부 작성 (웨이팅 등록)</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-gray-300 text-xs font-medium cursor-pointer"
              >
                포차 구경하며 둘러보기
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 2. 사장님 호출 모드 (자리가 났을 때) */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner animate-bounce">
                <Sparkles size={32} className="text-emerald-300" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight flex items-center justify-center gap-1.5">
              <span>🔔 자리가 준비되었습니다!</span>
            </h3>
            <p className="text-xs text-emerald-300 font-semibold mb-4">
              웨이팅 {waitingNumber}번 손님 차례입니다
            </p>

            <div className="w-full bg-white/[0.04] border border-emerald-500/20 rounded-2xl p-4 mb-5 text-left space-y-2">
              <div className="text-xs text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-200">
                  {assignedChair ? `${assignedChair.tableId.replace('t', '')}번 테이블` : '포차 명당 테이블'} 정갈하게 정리 완료
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed italic border-t border-white/5 pt-2">
                👵 사장님: "오래 기다리셨지요? 마침 따뜻하고 편안한 자리가 났어요! 얼른 들어와 앉으셔요~"
              </p>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => {
                  if (onAcceptSeat) onAcceptSeat();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>지금 자리로 안내받기</span>
                <span>🍶</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-gray-400 text-xs font-medium cursor-pointer"
              >
                조금 더 서성이다 앉기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
