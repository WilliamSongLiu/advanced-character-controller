import * as THREE from 'three'
import { useScene } from './init'
import { addPhysics } from './physics/physics'

const createCapsule = (pos: THREE.Vector3, height: number, radius: number, capSegments: number, radialSegments: number) => {
  const scene = useScene()

  const geometry = new THREE.CapsuleGeometry(radius, height, capSegments, radialSegments)
  const material = new THREE.MeshStandardMaterial({ color: 0xd60019, transparent: true })
  const capsule = new THREE.Mesh(geometry, material)
  capsule.position.copy(pos)

  scene.add(capsule)

  return capsule
}

const createGroundMesh = (pos: THREE.Vector3) => {
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

const createCuboidMesh = (
  pos: THREE.Vector3,
  width: number = 1,
  height: number = 1,
  depth: number = 1,
  isDynamic: boolean = true,
  color: number | string = 0xFFFFFF
) => {
  const scene = useScene()

  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshPhysicalMaterial({ color })
  const cube = new THREE.Mesh(geometry, material)
  cube.position.copy(pos)

  addPhysics(cube, isDynamic ? 'dynamic' : 'fixed', true, undefined, 'cuboid', {
    width: width / 2,
    height: height / 2,
    depth: depth / 2,
  })

  scene.add(cube)

  return cube
}

export { createCapsule, createGroundMesh, createCuboidMesh }
