import { WeatherMood } from '../types';

// Web Audio API 기반 순수 자립형 앰비언스 & 사운드 이펙트 엔진
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainNode: AudioNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private currentMood: WeatherMood = 'rainy';
  private musicInterval: any = null;
  private ambientInterval: any = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastAmbientTimes = {
    car: 0,
    pedestrian: 0,
    murmur: 0,
    snowStep: 0,
    sizzle: 0,
  };

  public init() {
    if (this.isInitialized) {
      if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
        this.ctx.resume();
      }
      return;
    }
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } else if (this.ctx.state === 'suspended' && !this.isMuted) {
        this.ctx.resume();
      }
      this.isInitialized = true;
      this.createNoiseBuffer();
      this.startRainAmbience();
      this.startLoFiChords();
      this.startAmbientSoundScape();
    } catch (e) {
      console.warn('Web Audio 초기화 실패:', e);
    }
  }

  // 포차 나가기(퇴장) 시 모든 배경음, 음악, 인터벌 및 Web Audio 컨텍스트를 즉시 정지
  public stop() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch (e) {}
      this.rainSource = null;
    }
    if (this.rainNode) {
      try {
        (this.rainNode as any).disconnect();
      } catch (e) {}
      this.rainNode = null;
    }
    if (this.ctx) {
      try {
        this.ctx.suspend();
      } catch (e) {}
    }
    this.isInitialized = false;
  }

  // 공용 화이트 노이즈 버퍼 생성 (효율적인 재사용)
  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // 1. 밤 빗소리 앰비언스 (핑크 노이즈 + 필터링)
  private startRainAmbience() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // 핑크 노이즈 알고리즘 (부드러운 빗소리)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    this.rainSource = whiteNoise;

    // 포차 텐트 안에서 듣는 비 느낌을 위한 로우패스 필터
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.rainFilter = filter;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.rainGain = gainNode;

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    whiteNoise.start(0);
    this.rainNode = gainNode;
  }

  // 날씨 및 분위기 테마 변경 (비오는밤, 눈오는밤, 낙엽 가을밤, 노을, 별밤)
  public setWeatherMood(mood: 'rainy' | 'snowy' | 'autumn' | 'sunset' | 'starry') {
    this.currentMood = mood;
    if (!this.ctx || !this.rainFilter || !this.rainGain) return;
    const now = this.ctx.currentTime;
    if (mood === 'rainy') {
      this.rainFilter.frequency.setTargetAtTime(800, now, 0.5);
      this.rainGain.gain.setTargetAtTime(0.3, now, 0.5);
    } else if (mood === 'snowy') {
      // 포근하고 고요하게 스치는 겨울밤 바람 소리
      this.rainFilter.frequency.setTargetAtTime(260, now, 0.5);
      this.rainGain.gain.setTargetAtTime(0.18, now, 0.5);
    } else if (mood === 'autumn') {
      // 늦가을 낙엽이 바스락거리는 서늘하고 감성적인 가을밤 바람 소리
      this.rainFilter.frequency.setTargetAtTime(380, now, 0.5);
      this.rainGain.gain.setTargetAtTime(0.14, now, 0.5);
    } else if (mood === 'sunset') {
      // 노을빛 저녁 잔잔한 감성 앰비언스
      this.rainFilter.frequency.setTargetAtTime(160, now, 0.5);
      this.rainGain.gain.setTargetAtTime(0.06, now, 0.5);
    } else {
      // 맑고 시원한 별 헤는 밤 고요한 앰비언스
      this.rainFilter.frequency.setTargetAtTime(140, now, 0.5);
      this.rainGain.gain.setTargetAtTime(0.04, now, 0.5);
    }
  }

  // 2. 포차 감성 로파이(Lo-Fi) 잔잔한 코드 멜로디
  private startLoFiChords() {
    if (!this.ctx) return;

    // 늦은 밤 감성 코드 진행 (Cmaj7 -> Am7 -> Dm7 -> G7sus4)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [196.00, 261.63, 293.66, 392.00], // G7sus4
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.ctx || this.isMuted) return;
      const currentChord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      const now = this.ctx.currentTime;
      currentChord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 부드러운 사인파와 트라이앵글파 블렌딩
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // 로파이 패드 엔벨로프 (부드러운 서스테인과 릴리즈)
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    };

    playNextChord();
    this.musicInterval = setInterval(playNextChord, 6000);
  }

  // 3. 소주잔 '짠!' 맑은 부딪힘 사운드
  public playCheersSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2489, now); // 고음 벨소리 (D#7)
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.8);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.9);

    // 하모닉스 하나 더 추가하여 크리스탈 잔 느낌
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(4978, now);
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.5);
  }

  // 4. 소주 따르는 '쫄쫄쫄' 물소리 효과
  public playPouringSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const dropTime = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 700 + i * 90 + Math.random() * 80;
      osc.frequency.setValueAtTime(baseFreq, dropTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 350, dropTime + 0.08);

      gain.gain.setValueAtTime(0.07, dropTime);
      gain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(dropTime);
      osc.stop(dropTime + 0.09);
    }
  }

  // 5. 술 주문 포차 벨 & 병 오픈 효과음 ("띵~동~ 뻥!")
  public playOrderSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;

    // 1단계: 띵~ (1046Hz, C6)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // 2단계: 동~ (784Hz, G5)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(784, now + 0.22);
    gain2.gain.setValueAtTime(0.12, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.9);

    // 3단계: 소주병 뚜껑 시원하게 따는 "뻥!" 소리 (now + 0.5초)
    const popTime = now + 0.45;
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(220, popTime);
    popOsc.frequency.exponentialRampToValueAtTime(60, popTime + 0.08);
    popGain.gain.setValueAtTime(0.2, popTime);
    popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.09);
    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(popTime);
    popOsc.stop(popTime + 0.1);
  }

  // 6. 안주 한 입 맛있게 먹는 "바삭 냠냠" 효과음
  public playEatSound() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    // 두 번의 가벼운 씹는 바이트 사운드
    [0, 0.14].forEach((offset, idx) => {
      if (!this.ctx) return;
      const biteTime = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const startFreq = idx === 0 ? 380 : 440;
      osc.frequency.setValueAtTime(startFreq, biteTime);
      osc.frequency.exponentialRampToValueAtTime(140, biteTime + 0.09);

      gain.gain.setValueAtTime(0.14, biteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, biteTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(biteTime);
      osc.stop(biteTime + 0.1);
    });
  }

  // 7. [비소리] 포차 비닐 천막에 톡, 토독 떨어지는 빗방울 소리
  public playTarpRainDrop() {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    // 천막 비닐의 얇은 울림을 흉내낸 밴드패스 필터
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const centerFreq = 1600 + Math.random() * 1200;
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    const dropGain = 0.015 + Math.random() * 0.02;
    gain.gain.setValueAtTime(dropGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
    source.stop(now + 0.045);
  }

  // 8. [비소리] 빗길 도로 위를 차가 쏴아아- 지나가는 물보라 마찰음
  public playWetRoadCar() {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    const duration = 3.5;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(1400, now + duration * 0.45);
    filter.frequency.linearRampToValueAtTime(350, now + duration);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.022, now + duration * 0.45);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
    source.stop(now + duration);
  }

  // 9. [눈 밟는 소리] 눈 위를 걸을 때 나는 "뽀드득... 뽀득..." 소리
  public playSnowCrunchSteps(stepCount: number = 2) {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    for (let i = 0; i < stepCount; i++) {
      const stepTime = now + i * 0.55 + Math.random() * 0.08;
      const duration = 0.16;

      // 고주파 눈 마찰 노이즈
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800 + Math.random() * 800, stepTime);
      filter.Q.setValueAtTime(2.2, stepTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, stepTime);
      gain.gain.linearRampToValueAtTime(0.045, stepTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(stepTime);
      source.stop(stepTime + duration);

      // 저음 압축 펄스 (눈 뭉쳐지는 둔탁함)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, stepTime);
      osc.frequency.exponentialRampToValueAtTime(60, stepTime + 0.1);

      oscGain.gain.setValueAtTime(0.03, stepTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.1);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(stepTime);
      osc.stop(stepTime + 0.1);
    }
  }

  // 10. [행인 발걸음] 포차 밖 길거리를 지나가는 사람의 발자국 소리
  public playPedestrianFootstep(stepCount: number = 3) {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    for (let i = 0; i < stepCount; i++) {
      const stepTime = now + i * 0.42;
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550 + Math.random() * 200, stepTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, stepTime);
      gain.gain.linearRampToValueAtTime(0.018, stepTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.09);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(stepTime);
      source.stop(stepTime + 0.1);
    }
  }

  // 11. [행인 웅성거림] 포차 밖에서 도란도란 나지막하게 이야기를 나누며 지나가는 소리
  public playStreetMurmur() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    const duration = 2.4;

    // 사람 목소리 포먼트 대역을 흉내낸 부드러운 톤 합성
    const freqs = [420, 780, 1250];
    freqs.forEach((baseFreq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      // 나지막하게 말하는 듯한 주파수 미세 요동
      osc.frequency.linearRampToValueAtTime(baseFreq * (1 + (Math.random() * 0.08 - 0.04)), now + 1.2);
      osc.frequency.linearRampToValueAtTime(baseFreq, now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.006, now + 0.8);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // 12. [주방 소음] 포차 조리대에서 들리는 안주 볶는 지글지글 소리
  public playSizzleSound() {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    this.ensureRunning();

    const now = this.ctx.currentTime;
    const duration = 2.0;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.012, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
    source.stop(now + duration);
  }

  // 13. [환경음 자동 스케줄러] 날씨와 감성에 맞춰 주변 소음들을 자연스럽게 재생
  private startAmbientSoundScape() {
    if (this.ambientInterval) clearInterval(this.ambientInterval);

    this.ambientInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const now = Date.now();

      if (this.currentMood === 'rainy') {
        // 비 오는 날: 천막에 빗방울 토닥토닥 (빈번하게)
        if (Math.random() < 0.65) {
          this.playTarpRainDrop();
        }
        // 25~45초마다 빗길 지나가는 자동차
        if (now - this.lastAmbientTimes.car > 28000 + Math.random() * 15000) {
          this.lastAmbientTimes.car = now;
          this.playWetRoadCar();
        }
        // 14~24초마다 우산 쓰고 지나가는 행인
        if (now - this.lastAmbientTimes.pedestrian > 16000 + Math.random() * 10000) {
          this.lastAmbientTimes.pedestrian = now;
          this.playPedestrianFootstep(Math.floor(2 + Math.random() * 3));
        }
      } else if (this.currentMood === 'snowy') {
        // 눈 오는 날: 5~10초마다 길거리 눈 밟는 뽀드득 소리
        if (now - this.lastAmbientTimes.snowStep > 6000 + Math.random() * 5000) {
          this.lastAmbientTimes.snowStep = now;
          this.playSnowCrunchSteps(Math.floor(2 + Math.random() * 2));
        }
        // 16~28초마다 지나가는 행인
        if (now - this.lastAmbientTimes.pedestrian > 18000 + Math.random() * 12000) {
          this.lastAmbientTimes.pedestrian = now;
          this.playPedestrianFootstep(2);
        }
      } else {
        // 노을 / 별밤: 골목길 행인 발걸음 & 나지막한 웅성거림
        if (now - this.lastAmbientTimes.pedestrian > 12000 + Math.random() * 8000) {
          this.lastAmbientTimes.pedestrian = now;
          this.playPedestrianFootstep(Math.floor(2 + Math.random() * 3));
        }
        if (now - this.lastAmbientTimes.murmur > 18000 + Math.random() * 12000) {
          this.lastAmbientTimes.murmur = now;
          this.playStreetMurmur();
        }
        if (now - this.lastAmbientTimes.sizzle > 22000 + Math.random() * 15000) {
          this.lastAmbientTimes.sizzle = now;
          this.playSizzleSound();
        }
      }
    }, 280);
  }

  // 14. [플레이어 발걸음 연동] 아바타 이동 시 날씨별 발자국 소리
  public playPlayerFootstep(mood?: string) {
    if (!this.ctx || this.isMuted) return;
    const targetMood = mood || this.currentMood;
    if (targetMood === 'snowy') {
      this.playSnowCrunchSteps(1);
    } else {
      this.playPedestrianFootstep(1);
    }
  }

  private ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        this.ctx.suspend();
      } else {
        this.ctx.resume();
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new AudioEngine();
