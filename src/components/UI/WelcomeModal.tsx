import React from 'react';
import { Moon, Heart } from 'lucide-react';
import { soundManager } from '../AudioController';

interface WelcomeModalProps {
  nickname: string;
  onEnter: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ nickname, onEnter }) => {
  const handleStart = async () => {
    soundManager.init();
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {}
    onEnter();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-[#181a20] border border-orange-500/30 rounded-3xl p-6 md:p-8 text-center text-white shadow-2xl relative overflow-hidden">
        {/* 장식용 은은한 주황색 글로우 */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-5">
          <Moon size={32} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">
          포차, 잠깐 쉬어가요
        </h2>
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          늦은 밤, 조용히 혼자이고 싶은 날.<br />
          말 없이 같은 온기를 나누는 공간입니다.
        </p>

        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 text-left">
          <div className="text-xs text-gray-400 mb-1">오늘 당신의 포차 닉네임</div>
          <div className="text-base font-semibold text-amber-300 flex items-center gap-2">
            <span>🏷️</span>
            <span>{nickname || '조용한 소주'}</span>
          </div>
          <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
            <Heart size={13} className="text-pink-400" />
            <span>채팅이나 음성 대화 없이, 조용한 공존을 즐깁니다.</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] transition-all text-white font-medium text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
        >
          <span>포차 문 열고 들어가기</span>
          <span>🍶</span>
        </button>

        <p className="text-xs text-gray-400 mt-4">
          이어폰을 착용하시면 빗소리와 잔잔한 앰비언스를 온전히 느끼실 수 있습니다.
        </p>
      </div>
    </div>
  );
};
