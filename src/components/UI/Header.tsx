import React, { useState } from 'react';
import { Volume2, VolumeX, Users, Moon } from 'lucide-react';
import { soundManager } from '../AudioController';

interface HeaderProps {
  playerCount: number;
  myNickname: string;
}

export const Header: React.FC<HeaderProps> = ({ playerCount, myNickname }) => {
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none z-10">
      {/* 좌측 타이틀 & 슬로건 */}
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 pointer-events-auto">
        <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
          <Moon size={20} />
        </div>
        <div>
          <h1 className="text-white font-bold text-base md:text-lg tracking-tight flex items-center gap-2">
            포차, 잠깐 쉬어가요
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-300 font-normal">
              혼술
            </span>
          </h1>
          <p className="text-xs text-gray-300/80">
            {myNickname ? `${myNickname}님, 오늘 하루도 고생 많으셨어요.` : '로딩 중...'}
          </p>
        </div>
      </div>

      {/* 우측 접속자 & 사운드 컨트롤 */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* 접속자 수 */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-xs">
          <Users size={15} className="text-emerald-400" />
          <span>함께 머무는 손님 <strong className="text-emerald-300">{playerCount}</strong>명</span>
        </div>

        {/* 사운드 토글 버튼 */}
        <button
          onClick={handleToggleSound}
          className="p-2.5 bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md rounded-xl border border-white/10 text-white"
          title={isMuted ? '소리 켜기' : '소리 끄기'}
        >
          {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-amber-300" />}
        </button>
      </div>
    </header>
  );
};
