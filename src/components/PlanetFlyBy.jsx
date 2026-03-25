import { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const PLANETS = [
  {
    name: 'MERCURY',
    color: '#a0856c',
    desc: 'Innermost sentinel of the solar system\nSurface scarred by eons of cosmic bombardment',
    size: 3,
    ring: false,
  },
  {
    name: 'VENUS',
    color: '#e8c06a',
    desc: 'Veiled in sulfuric clouds and crushing heat\nAtmospheric pressure: 90x Earth standard',
    size: 4,
    ring: false,
  },
  {
    name: 'EARTH',
    color: '#4488cc',
    desc: 'Pale blue cradle of human civilization\nOrigin point of the Vanguard program',
    size: 4.5,
    ring: false,
    isEarth: true,
  },
  {
    name: 'MARS',
    color: '#c45a3a',
    desc: "The red frontier — humanity's first colony\nOlympus Mons visible on approach",
    size: 3.8,
    ring: false,
  },
  {
    name: 'JUPITER',
    color: '#c4935a',
    desc: 'Gas giant — mass exceeds all others combined\nGreat Red Spot: a storm older than Earth itself',
    size: 8,
    ring: false,
  },
  {
    name: 'SATURN',
    color: '#d4b876',
    desc: 'Lord of the rings — ice and rock in harmony\nDensity so low it would float on water',
    size: 7,
    ring: true,
  },
];

/* ── Realistic Earth texture drawn on canvas ── */
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Ocean base — gradient from deep blue to lighter blue
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#1a3a5c');
  oceanGrad.addColorStop(0.3, '#1e5799');
  oceanGrad.addColorStop(0.5, '#2076b8');
  oceanGrad.addColorStop(0.7, '#1e5799');
  oceanGrad.addColorStop(1, '#1a3a5c');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle ocean texture
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(${30 + Math.random() * 30}, ${80 + Math.random() * 40}, ${140 + Math.random() * 60}, ${Math.random() * 0.15})`;
    ctx.fillRect(x, y, Math.random() * 3, Math.random() * 2);
  }

  // Helper to draw landmass blobs
  const drawLand = (cx, cy, radiusX, radiusY, color, rotation = 0) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.beginPath();
    // Irregular blob shape
    const points = 12 + Math.floor(Math.random() * 6);
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const jitterX = radiusX * (0.7 + Math.random() * 0.6);
      const jitterY = radiusY * (0.7 + Math.random() * 0.6);
      const px = Math.cos(angle) * jitterX;
      const py = Math.sin(angle) * jitterY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };

  // Continent colors
  const green1 = '#2d5a27';
  const green2 = '#3a7a33';
  const brown1 = '#6b5b3a';
  const brown2 = '#8a7a4a';

  // North America
  drawLand(220, 140, 70, 50, green1);
  drawLand(240, 120, 40, 30, green2);
  drawLand(200, 170, 30, 20, brown1);

  // South America
  drawLand(280, 280, 35, 70, green1);
  drawLand(275, 310, 25, 40, green2);

  // Europe
  drawLand(500, 130, 40, 25, green2);
  drawLand(520, 145, 25, 15, brown1);

  // Africa
  drawLand(520, 240, 50, 70, brown2);
  drawLand(530, 220, 35, 40, green1);
  drawLand(510, 280, 30, 30, brown1);

  // Asia
  drawLand(620, 140, 100, 50, green1, 0.1);
  drawLand(680, 120, 60, 35, brown1);
  drawLand(700, 160, 40, 30, green2);
  drawLand(630, 180, 30, 20, brown2);

  // India
  drawLand(640, 230, 20, 30, green2);

  // Australia
  drawLand(780, 310, 45, 30, brown2);
  drawLand(790, 300, 30, 20, brown1);

  // Antarctica
  drawLand(512, 480, 200, 25, '#dce8f0');
  drawLand(512, 490, 160, 20, '#c8dae8');

  // Polar ice caps — white gradient overlays
  const northPole = ctx.createLinearGradient(0, 0, 0, 60);
  northPole.addColorStop(0, 'rgba(220, 235, 245, 0.8)');
  northPole.addColorStop(1, 'rgba(220, 235, 245, 0)');
  ctx.fillStyle = northPole;
  ctx.fillRect(0, 0, 1024, 60);

  const southPole = ctx.createLinearGradient(0, 460, 0, 512);
  southPole.addColorStop(0, 'rgba(220, 235, 245, 0)');
  southPole.addColorStop(1, 'rgba(220, 235, 245, 0.7)');
  ctx.fillStyle = southPole;
  ctx.fillRect(0, 460, 1024, 52);

  // Cloud wisps
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * 1024;
    const cy = 80 + Math.random() * 350;
    const w = 30 + Math.random() * 100;
    const h = 5 + Math.random() * 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/* ── Generic planet texture ── */
function createPlanetTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const base = new THREE.Color(color);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 256);

  // Noise bands
  for (let y = 0; y < 256; y++) {
    const variation = Math.sin(y * 0.05) * 0.15 + Math.random() * 0.08;
    const r = Math.min(255, Math.max(0, base.r * 255 + variation * 60));
    const g = Math.min(255, Math.max(0, base.g * 255 + variation * 40));
    const b = Math.min(255, Math.max(0, base.b * 255 + variation * 30));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 512, 1);
  }

  // Surface features
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const radius = Math.random() * 20 + 5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'}, ${Math.random() * 0.12})`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function PlanetMesh({ planet, planetRef }) {
  const texture = useMemo(() => {
    if (planet.isEarth) return createEarthTexture();
    return createPlanetTexture(planet.color);
  }, [planet.color, planet.isEarth]);

  return (
    <group ref={planetRef}>
      <mesh>
        <sphereGeometry args={[planet.size, 64, 48]} />
        <meshStandardMaterial
          map={texture}
          metalness={planet.isEarth ? 0.05 : 0.1}
          roughness={planet.isEarth ? 0.8 : 0.7}
        />
      </mesh>
      {planet.ring && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[planet.size * 1.3, planet.size * 2, 64]} />
          <meshStandardMaterial
            color="#d4b876"
            emissive="#d4b876"
            emissiveIntensity={0.2}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      )}
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[planet.size * 1.03, 32, 24]} />
        <meshBasicMaterial
          color={planet.isEarth ? '#4499ff' : planet.color}
          transparent
          opacity={planet.isEarth ? 0.15 : 0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Earth gets a second thinner atmosphere layer */}
      {planet.isEarth && (
        <mesh>
          <sphereGeometry args={[planet.size * 1.06, 32, 24]} />
          <meshBasicMaterial
            color="#88ccff"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

const PlanetFlyBy = forwardRef(({ speedRef, phaseRef: externalPhaseRef, onPlanetChange }, ref) => {
  const { camera } = useThree();
  const planetRef = useRef();
  const [currentPlanetIdx, setCurrentPlanetIdx] = useState(0);
  const [showLabel, setShowLabel] = useState(false);
  const phaseRef = useRef('idle'); // idle, approaching, passing, leaving
  const timerRef = useRef(0);
  const planetZRef = useRef(-300);
  const baseFovRef = useRef(75);
  const currentFovRef = useRef(75);
  // Side offset: alternates left/right so planets don't all come from the same side
  const sideRef = useRef(1);

  const planet = PLANETS[currentPlanetIdx];

  const startFlyBy = useCallback(() => {
    phaseRef.current = 'approaching';
    if (externalPhaseRef) externalPhaseRef.current = 'approaching';
    planetZRef.current = -250;
    sideRef.current = sideRef.current * -1; // alternate sides
    setShowLabel(false);
  }, [externalPhaseRef]);

  useImperativeHandle(ref, () => ({
    jumpToPlanet: (idx) => {
      // Force change planet and trigger approach
      setCurrentPlanetIdx(idx);
      phaseRef.current = 'idle'; // reset briefly
      if (externalPhaseRef) externalPhaseRef.current = 'idle';
      planetZRef.current = -300;
      setTimeout(() => startFlyBy(), 100);
    }
  }));

  useEffect(() => {
    if (onPlanetChange) onPlanetChange(currentPlanetIdx, PLANETS[currentPlanetIdx]);
  }, [currentPlanetIdx, onPlanetChange]);

  useEffect(() => {
    // Initial delay of 15s, then natural cycle
    const initialTimer = setTimeout(startFlyBy, 15000);
    return () => clearTimeout(initialTimer);
  }, [startFlyBy]);

  // Sync external phase ref
  useEffect(() => {
    if (externalPhaseRef) {
      externalPhaseRef.current = phaseRef.current;
    }
  });

  useFrame((_, delta) => {
    timerRef.current += delta;

    if (!planetRef.current) return;

    const phase = phaseRef.current;

    // Earth specific rotation
    if (planet.isEarth) {
        planetRef.current.rotation.y += delta * 0.05;
        // slightly tilt the earth axis
        planetRef.current.rotation.z = Math.PI * 0.05;
    }

    if (phase === 'idle') {
      planetRef.current.position.set(0, 0, -300);
      speedRef.current += (1.0 - speedRef.current) * delta * 0.5;
      currentFovRef.current += (baseFovRef.current - currentFovRef.current) * delta * 2;
      camera.fov = currentFovRef.current;
      camera.updateProjectionMatrix();
      return;
    }

    // Normal planet rotation
    if (!planet.isEarth) {
        planetRef.current.rotation.y += delta * 0.1;
    }

    // Offset X: far enough to the side so the ship never clips through
    const sideOffset = sideRef.current * (18 + planet.size * 0.5);
    const yOffset = 4; // Constant height to prevent HTML tracking jitter

    if (phase === 'approaching') {
      speedRef.current += (0.15 - speedRef.current) * delta * 2;

      planetZRef.current += delta * 18;
      planetRef.current.position.set(
        sideOffset,
        yOffset,
        planetZRef.current
      );

      if (planetZRef.current > -60) {
        setShowLabel(true);
      }

      if (planetZRef.current > -40) {
        currentFovRef.current += (95 - currentFovRef.current) * delta * 3;
        camera.fov = currentFovRef.current;
        camera.updateProjectionMatrix();
      }

      if (planetZRef.current > -10) {
        phaseRef.current = 'passing';
        if (externalPhaseRef) externalPhaseRef.current = 'passing';
      }
    }

    if (phase === 'passing') {
      planetZRef.current += delta * 25;
      planetRef.current.position.set(
        sideOffset,
        yOffset,
        planetZRef.current
      );

      currentFovRef.current += (baseFovRef.current - currentFovRef.current) * delta * 4;
      camera.fov = currentFovRef.current;
      camera.updateProjectionMatrix();

      if (planetZRef.current > 50) {
        phaseRef.current = 'leaving';
        if (externalPhaseRef) externalPhaseRef.current = 'leaving';
        setShowLabel(false);
      }
    }

    if (phase === 'leaving') {
      planetZRef.current += delta * 40;
      planetRef.current.position.z = planetZRef.current;

      speedRef.current += (1.0 - speedRef.current) * delta * 1.5;

      currentFovRef.current += (baseFovRef.current - currentFovRef.current) * delta * 3;
      camera.fov = currentFovRef.current;
      camera.updateProjectionMatrix();

      if (planetZRef.current > 120) {
        phaseRef.current = 'idle';
        if (externalPhaseRef) externalPhaseRef.current = 'idle';
        setTimeout(() => {
          setCurrentPlanetIdx(prev => (prev + 1) % PLANETS.length);
          startFlyBy();
        }, 20000);
      }
    }
  });

  return (
    <group>
      <PlanetMesh planet={planet} planetRef={planetRef} />
      {showLabel && planetRef.current && (
        <Html
          position={[
            planetRef.current.position.x,
            planetRef.current.position.y + planet.size + 2,
            planetRef.current.position.z,
          ]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="planet-label" style={{
            opacity: showLabel ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <div className="planet-label-name">{planet.name}</div>
            <div className="planet-label-desc">{planet.desc}</div>
          </div>
        </Html>
      )}
    </group>
  );
});

export default PlanetFlyBy;
