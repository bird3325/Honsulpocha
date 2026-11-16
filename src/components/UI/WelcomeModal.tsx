import React, { useState, useEffect } from 'react';
import { Moon, Heart, Dices, RotateCcw } from 'lucide-react';
import { soundManager } from '../AudioController';

interface WelcomeModalProps {
  nickname: string;
  onEnter: (customNickname?: string) => void;
}

const RANDOM_NICKNAMES = [
  '퇴근길 김대리',
  '칼퇴 꿈나무',
  '야근 끝난 이주임',
  '퇴근 후 소주한잔',
  '조용한 혼술러',
  '새벽 감성 송주임',
  '마지막 잔',
  '지친 하루 끝',
  '달빛 아래 잔',
  '소소한 위로',
  '비 오는 날 소주',
  '내일도 출근러',
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ nickname, onEnter }) => {
  const [editName, setEditName] = useState<string>(nickname || '조용한 소주');

  useEffect(() => {
    if (nickname) {
      setEditName(nickname);
    }
  }, [nickname]);

  const handleRandomize = () => {
    const randomBase = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    const randomTag = Math.floor(Math.random() * 900 + 100);
    setEditName(`${randomBase} #${randomTag}`);
  };

  const handleStart = async () => {
    soundManager.init();
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {}
    const finalName = editName.trim() || nickname || '조용한 소주';
    onEnter(finalName);
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

        {/* 닉네임 확인 및 직접 수정 입력란 */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>오늘 당신의 포차 닉네임</span>
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1 text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
              title="다른 닉네임 랜덤 추천받기"
            >
              <RotateCcw size={12} />
              <span>랜덤 추천</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-base select-none pointer-events-none">🏷️</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={15}
              placeholder="원하시는 닉네임을 입력하세요"
              className="w-full pl-10 pr-4 py-2.5 bg-black/45 border border-amber-500/30 focus:border-amber-400 focus:bg-black/60 rounded-xl text-base font-semibold text-amber-300 placeholder-gray-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
            <Heart size={13} className="text-pink-400 shrink-0" />
            <span>원하는 닉네임으로 자유롭게 수정하여 입장하실 수 있습니다.</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] transition-all text-white font-medium text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
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
