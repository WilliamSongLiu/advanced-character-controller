import * as THREE from 'three'
import {
  useCamera,
  useRenderSize,
  useScene,
  useTick,
  useInteractionManager,
} from './engine/init'

import { createGroundMesh, createCuboidMesh } from './engine/game/objects'
import { TickData } from './engine/managers/tick-manager'

const startApp = async () => {
  // three
  const scene = useScene()
  const camera = useCamera()
  camera.position.x += 10
  camera.position.y += 10
  camera.lookAt(new THREE.Vector3(0))
  const { width, height } = useRenderSize()
  const interactionManager = useInteractionManager()

  const dirLight = new THREE.DirectionalLight('#ffffff', 1)
  dirLight.position.y += 1
  dirLight.position.x += 0.5

  const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
  scene.add(dirLight, ambientLight)

  // * APP
  createGroundMesh(new THREE.Vector3(0, 0, 0))

  for (let i = 0; i < 10; i++) {
    createCuboidMesh(
      new THREE.Vector3((Math.random() - 0.5) * 20, 20, (Math.random() - 0.5) * 20),
      3, 3, 3, true
    )
  }

  // Create buttons
  for (let i = 0; i < 2; i++) {
    const button = createCuboidMesh(new THREE.Vector3(5 * (i + 1), 0.5, 5), 1, 1, 1, false, 0xBB0000)
    interactionManager.addInteractable(button, () => {
      const spawnPos = new THREE.Vector3().copy(button.position)
      spawnPos.y += 3
      createCuboidMesh(spawnPos)
    })
  }
}

export default startApp
