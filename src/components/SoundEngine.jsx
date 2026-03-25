import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export default function SoundEngine({ barrelRollRef, planetPhaseRef }) {
  const audioCtxRef = useRef(null);
  
  // Nodes
  const compressorRef = useRef(null);
  const masterGainRef = useRef(null);
  
  const engineGainRef = useRef(null);
  const engineOsc1Ref = useRef(null);
  const engineOsc2Ref = useRef(null);
  
  const whooshGainRef = useRef(null);
  const swooshGainRef = useRef(null);

  const [initialized, setInitialized] = useState(false);

  // Initialize Audio Context on first interaction
  useEffect(() => {
    const initAudio = () => {
      if (initialized) return;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Master Compressor to prevent clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 10;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      compressor.connect(ctx.destination);
      compressorRef.current = compressor;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.6; // Overall volume
      masterGain.connect(compressor);
      masterGainRef.current = masterGain;

      // --- Engine Hum (Constant) ---
      // We use higher frequencies (80Hz and 150Hz) so it's audible on laptop speakers
      const engineGain = ctx.createGain();
      engineGain.gain.value = 0.3; // Always playing
      engineGain.connect(masterGain);
      engineGainRef.current = engineGain;

      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.value = 80;
      osc1.connect(engineGain);
      osc1.start();
      engineOsc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.value = 150;
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'lowpass';
      filter2.frequency.value = 300; // Muffle the sawtooth
      osc2.connect(filter2);
      filter2.connect(engineGain);
      osc2.start();
      engineOsc2Ref.current = osc2;

      // --- Planet Fly-by Whoosh ---
      const whooshGain = ctx.createGain();
      whooshGain.gain.value = 0; // Starts silent
      whooshGain.connect(masterGain);
      whooshGainRef.current = whooshGain;

      const whooshOsc = ctx.createOscillator();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.value = 120;
      whooshOsc.connect(whooshGain);
      whooshOsc.start();

      // --- Barrel Roll Swoosh ---
      const swooshGain = ctx.createGain();
      swooshGain.gain.value = 0;
      swooshGain.connect(masterGain);
      swooshGainRef.current = swooshGain;

      const swooshOsc = ctx.createOscillator();
      swooshOsc.type = 'sine';
      swooshOsc.frequency.value = 300;
      swooshOsc.connect(swooshGain);
      swooshOsc.start();

      setInitialized(true);
      
      // Cleanup events once initialized
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [initialized]);

  // Handle dynamic events
  useFrame(() => {
    if (!initialized || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Do not constantly call ctx.resume() here!
    
    const t = ctx.currentTime;

    // 1. Engine Hum
    if (engineGainRef.current) {
        engineGainRef.current.gain.setTargetAtTime(0.35, t, 0.1);
    }

    // 2. Flyby Whoosh based on planet phase
    if (planetPhaseRef && planetPhaseRef.current && whooshGainRef.current) {
        const phase = planetPhaseRef.current;
        if (phase === 'approaching') {
            whooshGainRef.current.gain.setTargetAtTime(0.3, t, 1.5);
        } else if (phase === 'passing') {
            whooshGainRef.current.gain.setTargetAtTime(0.6, t, 0.5);
        } else if (phase === 'leaving') {
            whooshGainRef.current.gain.setTargetAtTime(0, t, 2.0);
        } else {
            whooshGainRef.current.gain.setTargetAtTime(0, t, 0.5);
        }
    }

    // 3. Barrel Roll Swoosh
    if (barrelRollRef && barrelRollRef.current && swooshGainRef.current) {
      barrelRollRef.current = false; // Reset trigger
      
      // Quick swoosh up and down
      swooshGainRef.current.gain.cancelScheduledValues(t);
      swooshGainRef.current.gain.setValueAtTime(0, t);
      swooshGainRef.current.gain.linearRampToValueAtTime(0.7, t + 0.1);
      swooshGainRef.current.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    }
  });

  return null;
}
