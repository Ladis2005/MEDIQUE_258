import { Bounds, Center, ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { Color, Mesh, MeshStandardMaterial, type Material } from 'three'

/**
 * Materiais cujo nome contém uma destas palavras são considerados tecido e recebem a cor escolhida.
 * Se o modelo não tiver nenhum material com estes nomes, todos os materiais são pintados.
 */
const FABRIC = /fabric|tecido|scrub|cloth|body|uniform/i

function Model({ url, hex }: { url: string; hex: string }) {
  const { scene } = useGLTF(url)
  const tinted = useMemo(() => {
    const clone = scene.clone(true)
    const meshes: Mesh[] = []
    clone.traverse((o) => {
      if ((o as Mesh).isMesh) meshes.push(o as Mesh)
    })
    const named = meshes.some((m) => ([] as Material[]).concat(m.material).some((mat) => FABRIC.test(mat.name)))
    for (const m of meshes) {
      m.castShadow = true
      m.material = ([] as Material[]).concat(m.material).map((mat) => {
        const copy = mat.clone()
        if ((!named || FABRIC.test(mat.name)) && copy instanceof MeshStandardMaterial) copy.color = new Color(hex)
        return copy
      }) as unknown as Material
      if (Array.isArray(m.material) && m.material.length === 1) m.material = m.material[0]
    }
    return clone
  }, [scene, hex])
  return <primitive object={tinted} />
}

export default function ModelViewer({ url, hex }: { url: string; hex: string }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.4, 3.2], fov: 40 }} shadows gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={2} castShadow />
      <directionalLight position={[-3, 2, -3]} intensity={0.8} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.15}>
          <Center>
            <Model url={url} hex={hex} />
          </Center>
        </Bounds>
        <ContactShadows position={[0, -1.05, 0]} opacity={0.25} blur={2.5} scale={6} />
      </Suspense>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.8} enablePan={false} minDistance={0.6} maxDistance={6} />
    </Canvas>
  )
}
