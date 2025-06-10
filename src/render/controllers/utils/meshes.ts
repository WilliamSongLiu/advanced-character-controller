import * as THREE from 'three'
import { useScene } from '../../init'

const _addCapsule = (
  height: number,
  radius: number,
  capSegments: number,
  radialSegments: number
) => {
  const scene = useScene()
  const geometry = new THREE.CapsuleGeometry(radius, height, capSegments, radialSegments)
  const material = new THREE.MeshStandardMaterial({ color: 0xd60019, transparent: true })
  const capsule = new THREE.Mesh(geometry, material)
  capsule.position.y += height / 2 + radius

  capsule.position.y += 10

  scene.add(capsule)

  return capsule
}

export { _addCapsule }
