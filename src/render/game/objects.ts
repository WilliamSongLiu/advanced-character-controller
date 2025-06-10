import * as THREE from 'three'
import { useScene } from '../init'
import { addPhysics } from '../physics/physics'

const _addCapsule = (pos: THREE.Vector3, height: number, radius: number, capSegments: number, radialSegments: number) => {
  const scene = useScene()

  const geometry = new THREE.CapsuleGeometry(radius, height, capSegments, radialSegments)
  const material = new THREE.MeshStandardMaterial({ color: 0xd60019, transparent: true })
  const capsule = new THREE.Mesh(geometry, material)
  capsule.position.copy(pos)

  scene.add(capsule)

  return capsule
}

const _addGroundMesh = (pos: THREE.Vector3) => {
  const scene = useScene()

  const size = 100

  const geometry = new THREE.PlaneGeometry(size, size)
  const material = new THREE.MeshPhysicalMaterial({ color: '#333', side: THREE.DoubleSide })
  const plane = new THREE.Mesh(geometry, material)
  plane.position.copy(pos)

  addPhysics(
    plane,
    'fixed',
    true,
    () => {
      plane.rotation.x -= Math.PI / 2
    },
    'cuboid',
    {
      width: size / 2,
      height: 0.001,
      depth: size / 2,
    }
  )

  scene.add(plane)

  return plane
}

const _addCubeMesh = (pos: THREE.Vector3) => {
  const scene = useScene()

  const size = 3

  const geometry = new THREE.BoxGeometry(size, size, size)
  const material = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF })
  const cube = new THREE.Mesh(geometry, material)
  cube.position.copy(pos)

  addPhysics(cube, 'dynamic', true, undefined, 'cuboid', {
    width: size / 2,
    height: size / 2,
    depth: size / 2,
  })

  scene.add(cube)

  return cube
}

const _addChestMesh = (pos: THREE.Vector3) => {
  const scene = useScene()

  const size = 1

  const geometry = new THREE.BoxGeometry(size, size, size)
  const material = new THREE.MeshPhysicalMaterial({ color: 0x8B4513 })
  const chest = new THREE.Mesh(geometry, material)
  chest.position.copy(pos)

  addPhysics(chest, 'fixed', true, undefined, 'cuboid', {
    width: size / 2,
    height: size / 2,
    depth: size / 2,
  })

  scene.add(chest)

  return chest
}

export { _addCapsule, _addGroundMesh, _addCubeMesh, _addChestMesh }
