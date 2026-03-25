import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import StarField from './StarField';
import Spaceship from './Spaceship';
import PlanetFlyBy, { PLANETS } from './PlanetFlyBy';
import SoundEngine from './SoundEngine';

/* Camera rig that gently rotates when steering */
function CameraRig({ steerRef }) {
  const { camera } = useThree();
  const smoothRef = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    const steer = steerRef.current;
    smoothRef.current.x += (steer.x - smoothRef.current.x) * delta * 2;
    smoothRef.current.y += (steer.y - smoothRef.current.y) * delta * 2;

    camera.rotation.y = smoothRef.current.x * 0.08;
    camera.rotation.x = smoothRef.current.y * -0.05;
    camera.position.x = smoothRef.current.x * 1.5;
    camera.position.y = 0.5 + smoothRef.current.y * -0.8;
  });

  return null;
}

export default function FlightScene({ onBack }) {
  const speedRef = useRef(1.0);
  const barrelRollRef = useRef(false);
  const steerRef = useRef({ x: 0, y: 0 });
  const planetPhaseRef = useRef('idle'); // approaching, passing, leaving, idle
  const keysRef = useRef({});
  const containerRef = useRef();
  
  // States for UI
  const planetFlyByRef = useRef();
  const [currentPlanet, setCurrentPlanet] = useState(PLANETS[0]);
  const [showVisitList, setShowVisitList] = useState(false);
  const [phaseTrigger, setPhaseTrigger] = useState(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'KeyR') {
        e.preventDefault();
        barrelRollRef.current = true;
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
        keysRef.current[e.code] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        keysRef.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update steerRef each frame via RAF
  useEffect(() => {
    let raf;
    const update = () => {
      const keys = keysRef.current;
      let tx = 0, ty = 0;
      if (keys['ArrowLeft']) tx -= 1;
      if (keys['ArrowRight']) tx += 1;
      if (keys['ArrowUp']) ty += 1;
      if (keys['ArrowDown']) ty -= 1;

      const s = steerRef.current;
      s.x += (tx - s.x) * 0.05;
      s.y += (ty - s.y) * 0.05;

      if (!keys['ArrowLeft'] && !keys['ArrowRight']) {
        s.x *= 0.95;
      }
      if (!keys['ArrowUp'] && !keys['ArrowDown']) {
        s.y *= 0.95;
      }

      // Hack to update UI when phase changes
      if (Math.random() < 0.1) {
          setPhaseTrigger(Date.now());
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Touch swipe for barrel roll
  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 60) {
        barrelRollRef.current = true;
      }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const handlePlanetChange = useCallback((idx, planet) => {
      setCurrentPlanet(planet);
  }, []);

  const jumpToPlanet = (idx) => {
      if (planetFlyByRef.current) {
          planetFlyByRef.current.jumpToPlanet(idx);
          setShowVisitList(false);
      }
  };

  return (
    <div className="flight-scene" ref={containerRef} style={{ touchAction: 'none' }}>
      <Canvas
        className="flight-canvas"
        camera={{ position: [0, 0.5, 5], fov: 75, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050505');
          gl.toneMapping = 3; // ACESFilmic
          gl.toneMappingExposure = 1.2;
        }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 5, -5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-3, 2, 3]} intensity={0.3} color="#00d2ff" />

        <CameraRig steerRef={steerRef} />
        <StarField speedRef={speedRef} />
        <Spaceship barrelRollRef={barrelRollRef} steerRef={steerRef} />
        <PlanetFlyBy 
            ref={planetFlyByRef} 
            speedRef={speedRef} 
            phaseRef={planetPhaseRef} 
            onPlanetChange={handlePlanetChange} 
        />
        {/* Sound engine properly inside Canvas for useFrame access */}
        <SoundEngine barrelRollRef={barrelRollRef} planetPhaseRef={planetPhaseRef} />
      </Canvas>

      {/* HUD overlay */}
      <div className="hud-overlay">
        
        <div className="hud-top-left">
          <div className="hud-title">VANGUARD // ODYSSEY</div>
          {onBack && (
            <button className="hud-back-btn" onClick={onBack}>
              ← BACK
            </button>
          )}
        </div>

        <div className="hud-top-right">
            <button 
                className="visit-btn" 
                onClick={() => setShowVisitList(!showVisitList)}
            >
                VISIT {showVisitList ? '▲' : '▼'}
            </button>
            {showVisitList && (
                <div className="visit-dropdown">
                    {PLANETS.map((p, idx) => (
                        <button 
                            key={p.name} 
                            className="visit-option"
                            onClick={() => jumpToPlanet(idx)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="hud-bottom-center">
          <div className="hud-hint">
            {('ontouchstart' in window)
              ? 'SWIPE TO BARREL ROLL'
              : 'ARROWS TO STEER · SPACE TO BARREL ROLL'}
          </div>
        </div>
      </div>
      {/* Hidden div to consume phaseTrigger */}
      <div style={{ display: 'none' }}>{phaseTrigger}</div>
    </div>
  );
}
