import { Float } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

/** Elementos 3D discretos atrás da campanha: formas suaves nas cores da marca, que reagem ao cursor. */
function Shapes() {
  const g = useRef<Group>(null)
  useFrame((state, dt) => {
    if (!g.current) return
    g.current.rotation.y += (state.pointer.x * 0.25 - g.current.rotation.y) * Math.min(1, dt * 2)
    g.current.rotation.x += (-state.pointer.y * 0.15 - g.current.rotation.x) * Math.min(1, dt * 2)
  })
  return (
    <group ref={g}>
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh position={[1.9, 1.6, -1]} rotation={[0.9, 0.3, 0]}>
          <torusGeometry args={[0.85, 0.2, 48, 128]} />
          <meshPhysicalMaterial color="#159FA8" roughness={0.25} clearcoat={1} clearcoatRoughness={0.2} />
        </mesh>
      </Float>
      <Float speed={1} rotationIntensity={0.3} floatIntensity={1.6}>
        <mesh position={[-2.1, -1.7, -1.5]}>
          <sphereGeometry args={[0.5, 64, 64]} />
          <meshPhysicalMaterial color="#E8D7C3" roughness={0.45} sheen={1} sheenColor="#ffffff" />
        </mesh>
      </Float>
      <Float speed={1.4} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[-1.9, 1.8, -2]} rotation={[0.4, 0.2, 0.8]}>
          <capsuleGeometry args={[0.18, 0.7, 16, 32]} />
          <meshPhysicalMaterial color="#073B70" roughness={0.3} clearcoat={0.8} />
        </mesh>
      </Float>
      <Float speed={0.9} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh position={[2, -1.6, -1.6]}>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.15} transmission={0.6} thickness={0.6} />
        </mesh>
      </Float>
    </group>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      aria-hidden
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -2, 2]} intensity={0.6} color="#bfe7ea" />
      <Shapes />
    </Canvas>
  )
}
