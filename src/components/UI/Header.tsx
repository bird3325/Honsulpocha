import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Users, Moon, ChevronDown, CloudRain, Snowflake, Leaf, Sunset, Sparkles } from 'lucide-react';
import { soundManager } from '../AudioController';
import { WeatherMood } from '../../types';

interface HeaderProps {
  playerCount: number;
  myNickname: string;
  weatherMood?: WeatherMood;
  onWeatherMoodChange?: (mood: WeatherMood) => void;
}

export const Header: React.FC<HeaderProps> = ({
  playerCount,
  myNickname,
  weatherMood = 'rainy',
  onWeatherMoodChange,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMoodMenuOpen, setIsMoodMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMoodMenuOpen(false);
      }
    };
    if (isMoodMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoodMenuOpen]);

  // 분위기 테마 메타데이터 (아이콘 및 고대비 색상)
  const MOOD_OPTIONS: { id: WeatherMood; label: string; icon: React.ReactNode }[] = [
    {
      id: 'rainy',
      label: '비 오는 밤',
      icon: <CloudRain size={17} className="text-cyan-300" />,
    },
    {
      id: 'snowy',
      label: '눈 오는 밤',
      icon: <Snowflake size={17} className="text-sky-200" />,
    },
    {
      id: 'autumn',
      label: '낙엽 지는 밤',
      icon: <Leaf size={17} className="text-amber-400" />,
    },
    {
      id: 'sunset',
      label: '노을빛 저녁',
      icon: <Sunset size={17} className="text-orange-300" />,
    },
    {
      id: 'starry',
      label: '별 헤는 밤',
      icon: <Sparkles size={17} className="text-amber-300" />,
    },
  ];

  const currentMood = MOOD_OPTIONS.find((m) => m.id === weatherMood) || MOOD_OPTIONS[0];

  return (
    <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none z-10">
      {/* 좌측 타이틀 & 슬로건 */}
      <div className="flex items-center gap-3 bg-[#11141e]/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/20 pointer-events-auto shadow-2xl">
        <div className="p-2 bg-amber-500/25 text-amber-300 rounded-xl">
          <Moon size={20} />
        </div>
        <div>
          <h1 className="text-white font-extrabold text-base md:text-lg tracking-tight flex items-center gap-2">
            포차, 잠깐 쉬어가요
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/30 text-orange-200 font-bold border border-orange-400/40">
              혼술
            </span>
          </h1>
          <p className="text-xs text-gray-200 font-medium">
            {myNickname ? `${myNickname}님, 오늘 하루도 고생 많으셨어요.` : '로딩 중...'}
          </p>
        </div>
      </div>

      {/* 우측 접속자, 분위기 전환 & 사운드 컨트롤 */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* 분위기(날씨 테마) 선택 드롭다운 (고대비 시인성 강화) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMoodMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 transition-colors backdrop-blur-xl px-3.5 py-2.5 rounded-xl border text-white text-xs cursor-pointer shadow-xl active:scale-95"
            style={{
              backgroundColor: '#111522',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
            }}
            title="포장마차 분위기 변경"
          >
            {currentMood.icon}
            <span className="font-bold text-white text-[13px] tracking-wide">{currentMood.label}</span>
            <ChevronDown
              size={15}
              className={`text-gray-300 transition-transform duration-200 ${
                isMoodMenuOpen ? 'rotate-180 text-amber-300' : ''
              }`}
            />
          </button>

          {/* 감성 드롭다운 팝오버 (고대비 명도 개선) */}
          {isMoodMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 backdrop-blur-2xl border-2 rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{
                backgroundColor: '#0e121d',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.95)',
              }}
            >
              <div
                className="px-3 py-1.5 text-xs font-extrabold border-b mb-1 flex items-center justify-between"
                style={{ color: '#fcd34d', borderColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <span>포차 분위기 선택</span>
                <span className="text-[10px] text-gray-300 font-normal">실시간 전환</span>
              </div>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = mood.id === weatherMood;
                return (
                  <button
                    key={mood.id}
                    onClick={() => {
                      if (onWeatherMoodChange) {
                        onWeatherMoodChange(mood.id);
                      }
                      setIsMoodMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all cursor-pointer border"
                    style={{
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                      color: isSelected ? '#fcd34d' : '#f1f5f9',
                      borderColor: isSelected ? 'rgba(245, 158, 11, 0.6)' : 'transparent',
                      fontWeight: isSelected ? 800 : 600,
                    }}
                  >
                    <span>{mood.icon}</span>
                    <span className="flex-1 text-[13px]">{mood.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 접속자 수 */}
        <div className="hidden sm:flex items-center gap-2 bg-[#121622]/95 backdrop-blur-xl px-3.5 py-2.5 rounded-xl border border-white/25 text-white text-xs shadow-xl">
          <Users size={15} className="text-emerald-400" />
          <span className="font-medium text-gray-200">
            함께 머무는 손님 <strong className="text-emerald-300 font-bold">{playerCount}</strong>명
          </span>
        </div>

        {/* 사운드 토글 버튼 */}
        <button
          onClick={handleToggleSound}
          className="p-2.5 bg-[#121622]/95 hover:bg-[#1a2030] transition-colors backdrop-blur-xl rounded-xl border border-white/25 text-white cursor-pointer active:scale-95 shadow-xl"
          title={isMuted ? '소리 켜기' : '소리 끄기'}
        >
          {isMuted ? (
            <VolumeX size={18} className="text-red-400" />
          ) : (
            <Volume2 size={18} className="text-amber-300" />
          )}
        </button>
      </div>
    </header>
  );
};
