import * as THREE from 'three'
import {
  useCamera,
  useRenderSize,
  useScene,
  useLoader,
  useTick,
  useInteractionController,
} from './render/init'

import { _addGroundMesh, _addCubeMesh, _addChestMesh } from './render/controllers/utils/meshes'
import { TickData } from './render/controllers/tick-manager'

const startApp = async () => {
  // three
  const scene = useScene()
  const camera = useCamera()
  camera.position.x += 10
  camera.position.y += 10
  camera.lookAt(new THREE.Vector3(0))
  const { width, height } = useRenderSize()

  const dirLight = new THREE.DirectionalLight('#ffffff', 1)
  dirLight.position.y += 1
  dirLight.position.x += 0.5

  const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
  scene.add(dirLight, ambientLight)

  // * APP
  _addGroundMesh()

  const NUM_CUBES = 10
  for (let i = 0; i < NUM_CUBES; i++) {
    _addCubeMesh(
      new THREE.Vector3((Math.random() - 0.5) * 20, 20, (Math.random() - 0.5) * 20)
    )
  }

  // Create chest
  const chest = _addChestMesh(new THREE.Vector3(5, 0, 5))

  // Set up interaction system
  const interactionController = useInteractionController()
  interactionController.addInteractable(chest)
  interactionController.setInteractionCallback((object) => {
    // Spawn a cube above the interacted object using _addCubeMesh
    const spawnPos = new THREE.Vector3().copy(object.position)
    spawnPos.y += 1
    _addCubeMesh(spawnPos)
  })
}

export default startApp
