import * as THREE from 'three'
import { useCamera, useRenderSize, useScene } from './engine/init'
import { setupScene } from './game/setup-scene'

const startApp = async () => {
  // three
  const scene = useScene()
  const camera = useCamera()
  camera.position.x += 10
  camera.position.y += 10
  camera.lookAt(new THREE.Vector3(0))
  const { width, height } = useRenderSize()

  // Setup lighting
  const dirLight = new THREE.DirectionalLight('#ffffff', 1)
  dirLight.position.y += 1
  dirLight.position.x += 0.5

  const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
  scene.add(dirLight, ambientLight)

  // Initialize game elements
  setupScene()
}

export default startApp
