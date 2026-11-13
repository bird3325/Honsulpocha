// Web Audio API 기반 순수 자립형 앰비언스 & 사운드 이펙트 엔진
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private rainNode: AudioNode | null = null;
  private musicInterval: any = null;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.isInitialized = true;
      this.startRainAmbience();
      this.startLoFiChords();
    } catch (e) {
      console.warn('Web Audio 초기화 실패:', e);
    }
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

    // 포차 텐트 안에서 듣는 비 느낌을 위한 로우패스 필터
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    whiteNoise.start(0);
    this.rainNode = gainNode;
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
