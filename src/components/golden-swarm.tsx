"use client";

import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Define props for the CelestialOrb component
interface CelestialOrbProps {
  particleColor?: number;
  particleSize?: number;
  animationSpeed?: number;
  animationAmplitude?: number;
  cameraDistanceFactor?: number;
  orbRadius?: number;
  particleCount?: number; // Added for controlling density
}

const CelestialOrb: FC<CelestialOrbProps> = ({
  particleColor = 0xFF8C00, // Default: Dark Orange / Coral
  particleSize = 0.03,
  animationSpeed = 0.2,
  animationAmplitude = 0.08,
  cameraDistanceFactor = 2.5, // Adjusted for sphere
  orbRadius = 1.8,
  particleCount = 15000, // Number of particles
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleMeshRef = useRef<THREE.Points | null>(null);
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setClearColor(0x000000, 0);
    currentMount.appendChild(rendererRef.current.domElement);

    // Create Sphere Geometry for particle distribution
    const sphereGeometry = new THREE.SphereGeometry(orbRadius, 64, 32); // Higher segments for better distribution
    
    // Create positions for particles. We'll distribute them somewhat randomly within the sphere volume.
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribute points within a sphere volume
      // Using spherical coordinates with random radius up to orbRadius
      const r = orbRadius * Math.cbrt(Math.random()); // Cube root for uniform volume distribution
      const theta = Math.random() * 2 * Math.PI; // Azimuthal angle
      const phi = Math.acos(2 * Math.random() - 1); // Polar angle (from -1 to 1 for Math.acos)

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
    }
    originalPositionsRef.current = basePositions;

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: particleSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7, // Make particles slightly transparent for a softer look
      blending: THREE.AdditiveBlending, // For a brighter, glowing effect where particles overlap
    });

    particleMeshRef.current = new THREE.Points(bufferGeometry, particleMaterial);
    sceneRef.current.add(particleMeshRef.current);

    // Adjust camera
    if (cameraRef.current && sceneRef.current && particleMeshRef.current) {
        const distance = orbRadius * cameraDistanceFactor;
        cameraRef.current.position.z = Math.max(distance, orbRadius * 1.5);
        cameraRef.current.lookAt(sceneRef.current.position);
        cameraRef.current.updateProjectionMatrix();
    }
    

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clockRef.current.getElapsedTime();

      if (particleMeshRef.current && originalPositionsRef.current && particleMeshRef.current.geometry.attributes.position) {
        const currentPositions = particleMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const original = originalPositionsRef.current;

        for (let i = 0; i < particleCount; i++) {
          const ox = original[i * 3];
          const oy = original[i * 3 + 1];
          const oz = original[i * 3 + 2];

          currentPositions.setX(i, ox + Math.sin(elapsedTime * animationSpeed + oy * 0.5 + ox * 0.2) * animationAmplitude);
          currentPositions.setY(i, oy + Math.cos(elapsedTime * animationSpeed + ox * 0.5 + oy * 0.2) * animationAmplitude);
          currentPositions.setZ(i, oz + Math.sin(elapsedTime * animationSpeed * 0.8 + oz * 0.5) * animationAmplitude * 0.6);
        }
        currentPositions.needsUpdate = true;
      }
      
      if(rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && currentMount) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (particleMeshRef.current) {
        sceneRef.current?.remove(particleMeshRef.current);
        particleMeshRef.current.geometry.dispose();
        if(Array.isArray(particleMeshRef.current.material)) {
            particleMeshRef.current.material.forEach(m => m.dispose());
        } else {
            particleMeshRef.current.material.dispose();
        }
      }
      sphereGeometry.dispose(); // Dispose of the sphere geometry too
      
      if (rendererRef.current) {
        if (rendererRef.current.domElement && currentMount.contains(rendererRef.current.domElement)) {
             currentMount.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      particleMeshRef.current = null;
      originalPositionsRef.current = null;
    };
  }, [particleColor, particleSize, animationSpeed, animationAmplitude, cameraDistanceFactor, orbRadius, particleCount]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default CelestialOrb;