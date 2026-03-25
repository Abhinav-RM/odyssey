import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Spaceship({ barrelRollRef, steerRef }) {
  const groupRef = useRef();
  const rollAngleRef = useRef(0);
  const isRollingRef = useRef(false);
  const timeRef = useRef(0);
  const engineGlowRef = useRef();

  // Smoothed steer values for visual banking
  const smoothSteerRef = useRef({ x: 0, y: 0 });

  // Materials
  const hullMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8899aa',
    metalness: 0.92,
    roughness: 0.08,
    envMapIntensity: 1.2,
  }), []);

  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0088bb',
    metalness: 0.95,
    roughness: 0.05,
    emissive: '#003366',
    emissiveIntensity: 0.3,
  }), []);

  const engineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00d2ff',
    emissive: '#00d2ff',
    emissiveIntensity: 2,
    metalness: 0.1,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
  }), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    const steer = steerRef?.current || { x: 0, y: 0 };

    // Smooth the steer values
    smoothSteerRef.current.x += (steer.x - smoothSteerRef.current.x) * delta * 3;
    smoothSteerRef.current.y += (steer.y - smoothSteerRef.current.y) * delta * 3;

    const sx = smoothSteerRef.current.x;
    const sy = smoothSteerRef.current.y;

    // Base idle bob
    const bobY = Math.sin(timeRef.current * 0.8) * 0.08;
    const bobZ = Math.sin(timeRef.current * 0.5) * 0.02;
    const bobX = Math.sin(timeRef.current * 0.3) * 0.015;

    // Barrel roll
    if (barrelRollRef.current && !isRollingRef.current) {
      isRollingRef.current = true;
      barrelRollRef.current = false;
    }

    if (isRollingRef.current) {
      rollAngleRef.current += delta * 8;
      groupRef.current.rotation.z = rollAngleRef.current;
      // Keep position stable during roll
      groupRef.current.position.y = bobY;
      groupRef.current.rotation.x = bobX;
      if (rollAngleRef.current >= Math.PI * 2) {
        rollAngleRef.current = 0;
        isRollingRef.current = false;
        groupRef.current.rotation.z = 0;
      }
    } else {
      // Normal steering visuals
      // Bank into the turn (tilt Z opposite to steer direction)
      groupRef.current.rotation.z = bobZ + sx * -0.4;
      // Pitch slightly when steering up/down
      groupRef.current.rotation.x = bobX + sy * 0.25;
      // Slight yaw
      groupRef.current.rotation.y = sx * -0.15;
      // Position offset based on steer
      groupRef.current.position.x = sx * 0.8;
      groupRef.current.position.y = bobY + sy * -0.5;
    }

    // Engine flicker
    if (engineGlowRef.current) {
      engineGlowRef.current.intensity = 1.5 + Math.sin(timeRef.current * 20) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={0.7}>
      {/* Main fuselage */}
      <mesh material={hullMat} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 2.2, 8]} />
      </mesh>

      {/* Cockpit dome */}
      <mesh position={[0, 0.12, -0.3]} material={accentMat}>
        <sphereGeometry args={[0.15, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Left wing */}
      <mesh position={[-0.7, -0.02, 0.2]} material={hullMat}>
        <boxGeometry args={[1.0, 0.04, 0.6]} />
      </mesh>
      {/* Left wing tip */}
      <mesh position={[-1.15, -0.02, 0.35]} rotation={[0, 0.4, 0]} material={accentMat}>
        <boxGeometry args={[0.15, 0.03, 0.35]} />
      </mesh>

      {/* Right wing */}
      <mesh position={[0.7, -0.02, 0.2]} material={hullMat}>
        <boxGeometry args={[1.0, 0.04, 0.6]} />
      </mesh>
      {/* Right wing tip */}
      <mesh position={[1.15, -0.02, 0.35]} rotation={[0, -0.4, 0]} material={accentMat}>
        <boxGeometry args={[0.15, 0.03, 0.35]} />
      </mesh>

      {/* Left engine */}
      <mesh position={[-0.45, -0.05, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={hullMat}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
      </mesh>
      <mesh position={[-0.45, -0.05, 0.78]} material={engineMat}>
        <sphereGeometry args={[0.07, 8, 8]} />
      </mesh>

      {/* Right engine */}
      <mesh position={[0.45, -0.05, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={hullMat}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
      </mesh>
      <mesh position={[0.45, -0.05, 0.78]} material={engineMat}>
        <sphereGeometry args={[0.07, 8, 8]} />
      </mesh>

      {/* Tail fin */}
      <mesh position={[0, 0.2, 0.65]} material={accentMat}>
        <boxGeometry args={[0.03, 0.35, 0.3]} />
      </mesh>

      {/* Engine glow lights */}
      <pointLight
        ref={engineGlowRef}
        position={[0, -0.05, 1.0]}
        color="#00d2ff"
        intensity={1.5}
        distance={4}
        decay={2}
      />
    </group>
  );
}
