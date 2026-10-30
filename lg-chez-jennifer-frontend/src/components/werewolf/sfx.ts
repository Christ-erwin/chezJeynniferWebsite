/**
 * Petits sons synthétisés (aucun fichier audio) : battement de cœur pendant
 * le compte à rebours, et coup final à la révélation du rôle.
 */
let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export const sfx = {
  setMuted(v: boolean) {
    muted = v;
  },
  /** à appeler sur un clic : débloque l'audio du navigateur */
  unlock() {
    audio();
  },
  /**
   * Battement de cœur (« boum-boum ») : un par seconde du compte à rebours,
   * de plus en plus fort. `level` va de 0 (premier) à 1 (dernier).
   */
  heartbeat(level = 0) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const vol = 0.55 + 0.45 * Math.min(1, Math.max(0, level));
    const thump = (at: number, gain: number) => {
      // corps grave + une harmonique pour rester audible sur les haut-parleurs de télé
      for (const [f0, f1, g] of [
        [62, 38, 1],
        [124, 70, 0.35],
      ] as const) {
        const o = a.createOscillator();
        const env = a.createGain();
        const lp = a.createBiquadFilter();
        o.type = "sine";
        o.frequency.setValueAtTime(f0, at);
        o.frequency.exponentialRampToValueAtTime(f1, at + 0.16);
        lp.type = "lowpass";
        lp.frequency.value = 260;
        env.gain.setValueAtTime(0.0001, at);
        env.gain.exponentialRampToValueAtTime(gain * g, at + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, at + 0.26);
        o.connect(lp).connect(env).connect(a.destination);
        o.start(at);
        o.stop(at + 0.3);
      }
    };
    thump(t, 0.9 * vol); // « boum »
    thump(t + 0.24, 0.6 * vol); // « boum » plus léger
  },
  /** Résurrection : un accord qui monte et s'ouvre, avec un souffle lumineux. */
  resurrect() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    for (const [f0, f1] of [
      [196, 392],
      [247, 494],
      [294, 587],
      [392, 784],
    ]) {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + 1.6);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + 3.1);
    }
    const len = a.sampleRate * 2.4;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len) * 0.6;
    const n = a.createBufferSource();
    const f = a.createBiquadFilter();
    const g = a.createGain();
    f.type = "highpass";
    f.frequency.setValueAtTime(800, t);
    f.frequency.exponentialRampToValueAtTime(5000, t + 2.2);
    g.gain.value = 0.12;
    n.buffer = buf;
    n.connect(f).connect(g).connect(a.destination);
    n.start(t);
  },
  /** Couronnement : carillon de cloches. */
  coronation() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const at = t + i * 0.14;
      for (const [mult, gain] of [
        [1, 0.16],
        [2.76, 0.05],
        [5.4, 0.02],
      ]) {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "sine";
        o.frequency.value = f * mult;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 1.8);
        o.connect(g).connect(a.destination);
        o.start(at);
        o.stop(at + 1.9);
      }
    });
  },
  /**
   * Nappe sombre et continue pour la cinématique d'introduction (vent grave
   * + bourdon). Renvoie une fonction qui l'éteint en fondu.
   */
  drone(): () => void {
    const a = audio();
    if (!a) return () => {};
    const t = a.currentTime;
    const master = a.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.5, t + 4);
    master.connect(a.destination);
    const nodes: AudioScheduledSourceNode[] = [];
    for (const [f, g] of [
      [55, 0.12],
      [82.4, 0.06],
      [110.6, 0.03],
    ]) {
      const o = a.createOscillator();
      const og = a.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      og.gain.value = g;
      // léger vibrato pour que la nappe respire
      const lfo = a.createOscillator();
      const lg = a.createGain();
      lfo.frequency.value = 0.07 + f / 2000;
      lg.gain.value = f * 0.012;
      lfo.connect(lg).connect(o.frequency);
      o.connect(og).connect(master);
      o.start(t);
      lfo.start(t);
      nodes.push(o, lfo);
    }
    // vent : bruit filtré qui ondule
    const len = a.sampleRate * 4;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const n = a.createBufferSource();
    n.buffer = buf;
    n.loop = true;
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.8;
    const wind = a.createOscillator();
    const wg = a.createGain();
    wind.frequency.value = 0.11;
    wg.gain.value = 260;
    wind.connect(wg).connect(bp.frequency);
    const ng = a.createGain();
    ng.gain.value = 0.05;
    n.connect(bp).connect(ng).connect(master);
    n.start(t);
    wind.start(t);
    nodes.push(n, wind);
    return () => {
      const now = a.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 2);
      for (const node of nodes) node.stop(now + 2.1);
    };
  },
  /** Hurlement de loup au loin. */
  howl() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator();
    const vib = a.createOscillator();
    const vg = a.createGain();
    const f = a.createBiquadFilter();
    const g = a.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(330, t);
    o.frequency.exponentialRampToValueAtTime(560, t + 0.7);
    o.frequency.setValueAtTime(560, t + 2);
    o.frequency.exponentialRampToValueAtTime(400, t + 3.2);
    vib.frequency.value = 5.5;
    vg.gain.value = 7;
    vib.connect(vg).connect(o.frequency);
    f.type = "bandpass";
    f.frequency.value = 900;
    f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.6);
    g.gain.setValueAtTime(0.13, t + 2.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
    // écho lointain
    const d = a.createDelay();
    const dg = a.createGain();
    d.delayTime.value = 0.38;
    dg.gain.value = 0.35;
    o.connect(f).connect(g).connect(a.destination);
    g.connect(d).connect(dg).connect(a.destination);
    o.start(t);
    vib.start(t);
    o.stop(t + 3.5);
    vib.stop(t + 3.5);
  },
  /** Coup sourd de cinéma (titre, phrase finale). */
  impact(level = 1) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 1.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7 * level, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 2.5);
    const len = a.sampleRate * 2.5;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const n = a.createBufferSource();
    const lp = a.createBiquadFilter();
    const ng = a.createGain();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    ng.gain.value = 0.35 * level;
    n.buffer = buf;
    n.connect(lp).connect(ng).connect(a.destination);
    n.start(t);
  },
  /** Note brève quand un habitant entre en scène (monte doucement avec `step`). */
  pluck(step = 0) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const scale = [0, 3, 5, 7, 10];
    const semis = scale[step % 5] + 12 * Math.floor((step % 15) / 5);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "triangle";
    o.frequency.value = 196 * 2 ** (semis / 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.65);
  },
  reveal(wolf: boolean) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    // impact
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(wolf ? 110 : 220, t);
    o.frequency.exponentialRampToValueAtTime(wolf ? 38 : 70, t + 1.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    const f = a.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 1.2);
    o.connect(f).connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 1.35);
    // souffle (bruit filtré)
    const len = a.sampleRate * 1.2;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const n = a.createBufferSource();
    const ng = a.createGain();
    const nf = a.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = wolf ? 500 : 1400;
    ng.gain.value = 0.25;
    n.buffer = buf;
    n.connect(nf).connect(ng).connect(a.destination);
    n.start(t);
  },
};
