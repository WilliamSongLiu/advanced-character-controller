import * as THREE from 'three'
import { useScene } from '../init'
import { addPhysics } from '../physics/physics'

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

const _addGroundMesh = () => {
  const scene = useScene()
  // * Settings
  const planeWidth = 100
  const planeHeight = 100

  // * Mesh
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
  const material = new THREE.MeshPhysicalMaterial({
    color: '#333',
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(geometry, material)

  // * Physics
  const collider = addPhysics(
    plane,
    'fixed',
    true,
    () => {
      plane.rotation.x -= Math.PI / 2
    },
    'cuboid',
    {
      width: planeWidth / 2,
      height: 0.001,
      depth: planeHeight / 2,
    }
  ).collider

  // * Add the mesh to the scene
  scene.add(plane)

  return plane
}

const _addCubeMesh = (pos: THREE.Vector3) => {
  const scene = useScene()
  // * Settings
  const size = 1

  // * Mesh
  const geometry = new THREE.BoxGeometry(size, size, size)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide,
  })
  const cube = new THREE.Mesh(geometry, material)

  cube.position.copy(pos)
  cube.position.y += 2

  // * Physics
  const collider = addPhysics(cube, 'dynamic', true, undefined, 'cuboid', {
    width: size / 2,
    height: size / 2,
    depth: size / 2,
  }).collider

  // * Add the mesh to the scene
  scene.add(cube)

  return cube
}

const _addChestMesh = (pos: THREE.Vector3) => {
  const scene = useScene()
  // * Settings
  const size = 1

  // * Mesh
  const geometry = new THREE.BoxGeometry(size, size, size)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x8B4513, // Brown color
    side: THREE.DoubleSide,
  })
  const chest = new THREE.Mesh(geometry, material)

  chest.position.copy(pos)
  chest.position.y += size / 2 // Place it on the ground

  // * Physics
  const collider = addPhysics(chest, 'fixed', true, undefined, 'cuboid', {
    width: size / 2,
    height: size / 2,
    depth: size / 2,
  }).collider

  // * Add the mesh to the scene
  scene.add(chest)

  return chest
}

export { _addCapsule, _addGroundMesh, _addCubeMesh, _addChestMesh }
