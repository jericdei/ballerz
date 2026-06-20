const AUTO_BUZZER_MS = 3000;
const STOP_FADE_S = 0.04;

type BuzzerSession = {
  ctx: AudioContext;
  master: GainNode;
  sources: AudioScheduledSourceNode[];
  autoStopTimeout: ReturnType<typeof setTimeout> | null;
};

let audioContext: AudioContext | null = null;
let session: BuzzerSession | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  audioContext ??= new AudioContextClass();
  return audioContext;
}

async function ensureAudioReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) {
    return null;
  }

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  return ctx;
}

function createHarshBuzzer(ctx: AudioContext, startTime: number) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, startTime);
  master.gain.linearRampToValueAtTime(0.5, startTime + 0.006);
  master.connect(ctx.destination);

  const sources: AudioScheduledSourceNode[] = [];
  const tones: Array<{ freq: number; type: OscillatorType; gain: number }> = [
    { freq: 720, type: "square", gain: 0.34 },
    { freq: 540, type: "square", gain: 0.28 },
    { freq: 1080, type: "square", gain: 0.16 },
    { freq: 360, type: "sawtooth", gain: 0.2 },
  ];

  for (const tone of tones) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.freq, startTime);
    gainNode.gain.setValueAtTime(tone.gain, startTime);
    oscillator.connect(gainNode);
    gainNode.connect(master);
    oscillator.start(startTime);
    sources.push(oscillator);
  }

  const bufferSize = ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) {
    noiseData[index] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(900, startTime);
  noiseFilter.Q.setValueAtTime(1.2, startTime);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, startTime);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(startTime);
  sources.push(noise);

  return { master, sources };
}

export function stopGameBuzzer(): void {
  const active = session;
  if (!active) {
    return;
  }

  session = null;

  if (active.autoStopTimeout) {
    clearTimeout(active.autoStopTimeout);
  }

  const now = active.ctx.currentTime;
  active.master.gain.cancelScheduledValues(now);
  active.master.gain.setValueAtTime(active.master.gain.value, now);
  active.master.gain.exponentialRampToValueAtTime(0.001, now + STOP_FADE_S);

  for (const source of active.sources) {
    try {
      source.stop(now + STOP_FADE_S);
    } catch {
      // Already stopped.
    }
  }
}

export async function startGameBuzzer(): Promise<void> {
  try {
    if (session) {
      return;
    }

    const ctx = await ensureAudioReady();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const { master, sources } = createHarshBuzzer(ctx, now);

    session = {
      ctx,
      master,
      sources,
      autoStopTimeout: null,
    };
  } catch {
    // Autoplay may be blocked until the user interacts with the page.
  }
}

export async function playGameBuzzerFor(
  durationMs = AUTO_BUZZER_MS,
): Promise<void> {
  stopGameBuzzer();
  await startGameBuzzer();

  if (!session) {
    return;
  }

  session.autoStopTimeout = setTimeout(() => {
    stopGameBuzzer();
  }, durationMs);
}

export { AUTO_BUZZER_MS };
