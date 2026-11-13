import React from 'react';
import { Wine, Sparkles, X, Heart } from 'lucide-react';
import { ChairSlot } from '../../types';

interface JoinTableModalProps {
  targetChair: ChairSlot;
  hostNickname: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const JoinTableModal: React.FC<JoinTableModalProps> = ({
  targetChair,
  hostNickname,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#12151e]/95 border border-amber-500/25 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-center flex flex-col items-center overflow-hidden">
        {/* 상단 닫기 X 버튼 */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* 앰비언트 백그라운드 오라 글로우 */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* 상단 정감 있는 뱃지 아이콘 */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
            <Wine size={30} className="text-amber-300" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-md">
            <Sparkles size={13} className="text-amber-950 font-bold" />
          </div>
        </div>

        {/* 타이틀 */}
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          따뜻한 합석 한잔
        </h3>

        {/* 감성 대화 카드 */}
        <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300/90 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>혼술 손님 맞이 중</span>
          </div>
          <div className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
            <span>🏷️</span>
            <span className="text-amber-200">{hostNickname}</span>
            <span className="text-xs text-gray-400 font-normal">님의 술상</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed italic border-t border-white/5 pt-2">
            "저... 실례가 안 된다면, 맞은편에 앉아 조용히 한잔 기울여도 될까요?"
          </p>
        </div>

        {/* ★ 버튼 그룹 가운데 정렬 (Centered Action Buttons) */}
        <div className="flex items-center justify-center gap-3 w-full">
          {/* 혼자 마실래요 (취소) 버튼 */}
          <button
            onClick={onCancel}
            className="flex-1 max-w-[140px] py-3 px-4 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] active:scale-95 text-gray-300 hover:text-white font-medium text-sm transition-all border border-white/10 shadow-sm"
          >
            혼자 마실래요
          </button>

          {/* 합석하기 (수락) 버튼 */}
          <button
            onClick={onConfirm}
            className="flex-1 max-w-[150px] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-amber-500/30 border border-amber-300/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>합석 신청</span>
            <span>🍻</span>
          </button>
        </div>

        {/* 하단 포차 감성 풋터 문구 */}
        <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-gray-400">
          <Heart size={11} className="text-pink-400/80" />
          <span>말 없이도 통하는 따뜻한 온기를 나눕니다</span>
        </div>
      </div>
    </div>
  );
};
