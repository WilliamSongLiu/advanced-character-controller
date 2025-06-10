import * as THREE from 'three'
import { createGroundMesh, createCuboidMesh } from '@/engine/meshes'
import { useInteractionManager } from '@/engine/init'

export const setupScene = () => {
  const interactionManager = useInteractionManager()

  // Create ground
  createGroundMesh(new THREE.Vector3(0, 0, 0))

  // Spawn random cubes
  for (let i = 0; i < 10; i++) {
    createCuboidMesh(
      new THREE.Vector3((Math.random() - 0.5) * 20, 20, (Math.random() - 0.5) * 20),
      3, 3, 3, true
    )
  }

  // Create interactive buttons
  for (let i = 0; i < 2; i++) {
    const button = createCuboidMesh(new THREE.Vector3(5 * (i + 1), 0.5, 5), 1, 1, 1, false, 0xBB0000)
    interactionManager.addInteractable(button, () => {
      const spawnPos = new THREE.Vector3().copy(button.position)
      spawnPos.y += 3
      createCuboidMesh(spawnPos)
    })
  }
}