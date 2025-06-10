import * as THREE from 'three'
import { useCamera, useScene } from '../init'

export class InteractionManager {
  private raycaster: THREE.Raycaster
  private camera: THREE.Camera
  private scene: THREE.Scene
  private interactionText: THREE.Sprite
  private interactableObjects: THREE.Object3D[] = []
  private currentInteractable: THREE.Object3D | null = null
  private readonly INTERACTION_DISTANCE = 3
  private onInteract: ((object: THREE.Object3D) => void) | null = null

  constructor() {
    this.camera = useCamera()
    this.scene = useScene()
    this.raycaster = new THREE.Raycaster()

    // Create interaction text sprite
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64

    if (context) {
      context.fillStyle = 'white'
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.fillText('Press E to interact', canvas.width / 2, canvas.height / 2)
    }

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    this.interactionText = new THREE.Sprite(material)
    this.interactionText.scale.set(2, 0.5, 1)
    this.interactionText.visible = false
    this.scene.add(this.interactionText)

    // Add event listener for E key
    window.addEventListener('keydown', this.handleKeyPress.bind(this))
  }

  public addInteractable(object: THREE.Object3D) {
    this.interactableObjects.push(object)
  }

  public setInteractionCallback(callback: (object: THREE.Object3D) => void) {
    this.onInteract = callback
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'e' && this.currentInteractable && this.onInteract) {
      this.onInteract(this.currentInteractable)
    }
  }

  public update() {
    // Update raycaster
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    // Check for intersection with any interactable object
    const intersects = this.raycaster.intersectObjects(this.interactableObjects)

    if (intersects.length > 0) {
      const distance = intersects[0].distance
      const object = intersects[0].object

      if (distance <= this.INTERACTION_DISTANCE) {
        this.currentInteractable = object
        // Update interaction text position and visibility
        this.interactionText.position.copy(object.position)
        this.interactionText.position.y += 0.5
        this.interactionText.visible = true
      } else {
        this.currentInteractable = null
        this.interactionText.visible = false
      }
    } else {
      this.currentInteractable = null
      this.interactionText.visible = false
    }
  }
}