import * as THREE from 'three'
import { RAPIER, usePhysics, useRenderSize } from '@/engine/init'
import { useRenderer } from '@/engine/init'
import { PhysicsObject, addPhysics } from '@/engine/physics/physics'
import Rapier from '@dimforge/rapier3d'
import { GRAVITY } from '@/engine/physics/constants'
import { clamp, lerp, easeOutExpo, _calculateObjectSize } from '@/engine/managers/utils'

// * constants
const MIN_ZOOM_LEVEL = 0.001 // needs to be slightly bigger than zero
const MAX_ZOOM_LEVEL = 20
const SCROLL_LEVEL_STEP = 1.5
const SCROLL_ANIMATION_SPEED = 2
const WALK_SPEED = 0.4
const SPRINT_SPEED = 0.6
const JUMP_FORCE = 8

// * supported keyboard keys
enum KEYS {
  a = 'KeyA',
  s = 'KeyS',
  w = 'KeyW',
  d = 'KeyD',
  space = 'Space',
  shiftL = 'ShiftLeft',
  shiftR = 'ShiftRight',
}

type MouseState = {
  leftButton: boolean
  rightButton: boolean
  mouseXDelta: number
  mouseYDelta: number
  mouseWheelDelta: number
}

// * Responsible for the inputs of the user
class InputManager {
  target: Document
  currentMouse: MouseState
  currentKeys: Map<string, boolean>
  pointerLocked: boolean

  constructor(target?: Document) {
    this.target = target || document
    this.currentMouse = {
      leftButton: false,
      rightButton: false,
      mouseXDelta: 0,
      mouseYDelta: 0,
      mouseWheelDelta: 0,
    }
    this.currentKeys = new Map<string, boolean>()
    this.pointerLocked = false

    this.init()
  }

  init() {
    // mouse event handlers
    this.target.addEventListener('mousedown', (e) => this.onMouseDown(e), false)
    this.target.addEventListener('mousemove', (e) => this.onMouseMove(e), false)
    this.target.addEventListener('mouseup', (e) => this.onMouseUp(e), false)
    // mouse wheel
    addEventListener('wheel', (e) => this.onMouseWheel(e), false)

    // keyboard event handlers
    this.target.addEventListener('keydown', (e) => this.onKeyDown(e), false)
    this.target.addEventListener('keyup', (e) => this.onKeyUp(e), false)

    const renderer = useRenderer()

    // handling pointer lock
    const addPointerLockEvent = async () => {
      await renderer.domElement.requestPointerLock()
    }
    renderer.domElement.addEventListener('click', addPointerLockEvent)
    renderer.domElement.addEventListener('dblclick', addPointerLockEvent)
    renderer.domElement.addEventListener('mousedown', addPointerLockEvent)

    const setPointerLocked = () => {
      this.pointerLocked = document.pointerLockElement === renderer.domElement
    }
    document.addEventListener('pointerlockchange', setPointerLocked, false)
  }

  onMouseWheel(e: WheelEvent) {
    const changeMouseWheelLevel = () => {
      if (this.pointerLocked) {
        if (e.deltaY < 0) {
          // * scrolling up, zooming in
          this.currentMouse.mouseWheelDelta = Math.max(
            this.currentMouse.mouseWheelDelta - SCROLL_LEVEL_STEP,
            MIN_ZOOM_LEVEL
          )
        } else if (e.deltaY > 0) {
          // * scrolling down, zooming out
          this.currentMouse.mouseWheelDelta = Math.min(
            this.currentMouse.mouseWheelDelta + SCROLL_LEVEL_STEP,
            MAX_ZOOM_LEVEL
          )
        }
      }
    }

    changeMouseWheelLevel()
  }

  onMouseMove(e: MouseEvent) {
    if (this.pointerLocked) {
      this.currentMouse.mouseXDelta = e.movementX
      this.currentMouse.mouseYDelta = e.movementY
    }
  }

  onMouseDown(e: MouseEvent) {
    if (this.pointerLocked) {
      this.onMouseMove(e)

      // * right click, left click
      switch (e.button) {
        case 0: {
          this.currentMouse.leftButton = true
          break
        }
        case 2: {
          this.currentMouse.rightButton = true
          break
        }
      }
    }
  }

  onMouseUp(e: MouseEvent) {
    if (this.pointerLocked) {
      this.onMouseMove(e)

      // * right click, left click
      switch (e.button) {
        case 0: {
          this.currentMouse.leftButton = false
          break
        }
        case 2: {
          this.currentMouse.rightButton = false
          break
        }
      }
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (this.pointerLocked) {
      this.currentKeys.set(e.code, true)
    }
  }

  onKeyUp(e: KeyboardEvent) {
    if (this.pointerLocked) {
      this.currentKeys.set(e.code, false)
    }
  }

  isKeyDown(keyCode: string | number) {
    if (this.pointerLocked) {
      const hasKeyCode = this.currentKeys.get(keyCode as string)
      if (hasKeyCode) {
        return hasKeyCode
      }
    }

    return false
  }

  update() {
    this.currentMouse.mouseXDelta = 0
    this.currentMouse.mouseYDelta = 0
  }

  runActionByKey(key: string, action: Function, inAction?: Function) {
    // * run function if the key is pressed
    if (this.isKeyDown(key)) {
      return action()
    } else {
      return inAction && inAction()
    }
  }

  runActionByOneKey(keys: Array<string>, action: Function, inAction?: Function) {
    // * run the function if one of the keys in the 'keys' array is pressed
    let check = false
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      check = this.isKeyDown(key)

      if (check) {
        break
      }
    }

    if (check) {
      return action()
    } else {
      return inAction && inAction()
    }
  }

  runActionByAllKeys(keys: Array<string>, action: Function, inAction?: Function) {
    // * if all of the keys in the 'keys' array are pressed at the same time, run the function
    let check = true
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      check = this.isKeyDown(key)

      if (!check) {
        break
      }
    }

    if (check) {
      return action()
    } else {
      return inAction && inAction()
    }
  }
}

// * Responsible for the camera zoom on the character (first-person-mode and third-person-mode)
class ZoomController {
  zoom: number
  lastZoomLevel: number
  startZoomAnimation: number
  isAnimating: boolean
  startingZoom: number

  constructor() {
    this.zoom = MIN_ZOOM_LEVEL
    this.startingZoom = 0
    this.lastZoomLevel = 0
    this.startZoomAnimation = 0
    this.isAnimating = false
  }

  update(zoomLevel: number, timestamp: number, timeDiff: number) {
    const time = timestamp * SCROLL_ANIMATION_SPEED
    const zlClamped = clamp(zoomLevel, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL)

    const zoomLevelHasChanged = this.lastZoomLevel !== zoomLevel
    if (zoomLevelHasChanged) {
      // restart the animation
      this.startingZoom = this.zoom
      this.startZoomAnimation = time
      this.isAnimating = true
    }

    // animating
    if (this.isAnimating) {
      const progress = time - this.startZoomAnimation
      this.zoom = lerp(this.startingZoom, zlClamped, easeOutExpo(progress))

      if (progress >= 1) {
        // end the animation
        this.isAnimating = false
      }
    }

    this.lastZoomLevel = zoomLevel
  }
}

// * Responsible for controlling the vertical movement of the character (gravity, jump, etc...)
class HeightController {
  movePerFrame: number
  grounded: boolean
  jumpFactor: number
  jumpBufferTime: number
  lastJumpTime: number
  jumpBufferDuration: number
  verticalVelocity: number

  constructor() {
    this.movePerFrame = 0
    this.jumpFactor = 0
    this.grounded = false
    this.jumpBufferTime = 0
    this.lastJumpTime = 0
    this.jumpBufferDuration = 0.2
    this.verticalVelocity = 0
  }

  update(timestamp: number, timeDiff: number) {
    // Apply gravity
    this.verticalVelocity += GRAVITY.y * timeDiff

    // Handle jump input
    if (this.jumpFactor > 0) {
      if (this.grounded) {
        // Apply initial jump force
        this.verticalVelocity = JUMP_FORCE
        this.grounded = false
        this.jumpBufferTime = 0
      } else {
        // Buffer the jump input
        this.jumpBufferTime = timestamp - this.lastJumpTime
      }
      this.lastJumpTime = timestamp
    }

    // Apply vertical movement
    this.movePerFrame = this.verticalVelocity * timeDiff

    // Reset vertical velocity when grounded
    if (this.grounded) {
      this.verticalVelocity = 0
      this.movePerFrame = 0

      // Check if we have a buffered jump
      if (this.jumpFactor > 0 && this.jumpBufferTime < this.jumpBufferDuration) {
        this.verticalVelocity = JUMP_FORCE
        this.grounded = false
      }
    }
  }

  setGrounded(grounded: boolean) {
    this.grounded = grounded
    if (grounded) {
      this.jumpBufferTime = 0
      this.verticalVelocity = 0
    }
  }

  setJumpFactor(jumpFactor: number) {
    this.jumpFactor = jumpFactor
  }
}

// * Responsible for controlling the character movement, rotation and physics
class CharacterController extends THREE.Mesh {
  camera: THREE.PerspectiveCamera
  inputManager: InputManager
  heightController: HeightController
  phi: number
  theta: number
  objects: any
  isMoving2D: boolean
  startZoomAnimation: number
  zoomController: ZoomController
  physicsObject: PhysicsObject
  avatar: AvatarController

  constructor(avatar: AvatarController, camera: THREE.PerspectiveCamera) {
    super()

    // init position
    this.position.copy(avatar.avatar.position)

    this.camera = camera
    this.avatar = avatar

    this.inputManager = new InputManager()
    this.zoomController = new ZoomController()
    this.heightController = new HeightController()

    // physics
    this.physicsObject = this.initPhysics(avatar)

    this.startZoomAnimation = 0

    this.phi = 0
    this.theta = 0

    this.isMoving2D = false
  }

  initPhysics(avatar: AvatarController) {
    // physics object
    const radius = avatar.width / 2
    const halfHeight = avatar.height / 2 - radius
    const physicsObject = addPhysics(this, 'kinematicPositionBased', false, undefined, 'capsule', {
      halfHeight,
      radius,
    })

    return physicsObject
  }

  detectGround() {
    const physics = usePhysics()
    const avatarHalfHeight = this.avatar.height / 2

    // set collider position
    const colliderPosition = new THREE.Vector3().copy(this.position)
    this.physicsObject.collider.setTranslation(colliderPosition)

    // Create ray origin at the foot of the avatar
    const rayOrigin = new THREE.Vector3().copy(this.position)
    rayOrigin.y -= avatarHalfHeight

    // Create ray pointing down
    const ray = new RAPIER.Ray(rayOrigin, new THREE.Vector3(0, -1, 0))

    // Cast ray downward to detect ground
    let hit = physics.castRay(
      ray,
      1000,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
      undefined,
      this.physicsObject.collider,
      this.physicsObject.rigidBody
    )

    // If no ground below, check above
    if (!hit) {
      ray.dir = new THREE.Vector3(0, 1, 0)
      hit = physics.castRay(
        ray,
        this.avatar.height / 2,
        true,
        RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
        undefined,
        this.physicsObject.collider,
        this.physicsObject.rigidBody
      )
    }

    // Handle the hit result
    if (hit) {
      const hitPoint = ray.pointAt(hit.toi)
      const distance = rayOrigin.y - hitPoint.y

      if (distance <= 0.1) {
        this.position.y = hitPoint.y + avatarHalfHeight
        this.heightController.setGrounded(true)
      } else {
        this.heightController.setGrounded(false)
      }
    } else {
      this.heightController.setGrounded(false)
    }
  }

  checkCollisionWithFixed(direction: THREE.Vector3): boolean {
    const physics = usePhysics()
    const avatarHalfHeight = this.avatar.height / 2

    // Create vectors for ground detection
    const groundRayOrigin = new THREE.Vector3().copy(this.position)
    groundRayOrigin.y -= avatarHalfHeight - 0.1 // Start slightly above ground level

    const groundRay = new RAPIER.Ray(groundRayOrigin, new THREE.Vector3(0, -1, 0))

    // Cast ray to detect ground
    const groundHit = physics.castRay(
      groundRay,
      0.2, // Only check a small distance since we're already close to ground
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
      undefined,
      this.physicsObject.collider,
      this.physicsObject.rigidBody
    )

    // Get the ground collider if we're standing on something
    let groundCollider: Rapier.Collider | undefined
    if (groundHit) {
      groundCollider = groundHit.collider
    }

    // Calculate proposed new position
    const proposedPosition = new THREE.Vector3().copy(this.position).add(direction)

    // Set collider to proposed position
    this.physicsObject.collider.setTranslation(proposedPosition)

    // Check for collisions with fixed objects, excluding the ground we're standing on
    const hit = physics.castShape(
      this.position,
      this.physicsObject.collider.rotation(),
      direction,
      this.physicsObject.collider.shape,
      0.1,
      true,
      RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
      undefined,
      this.physicsObject.collider,
      this.physicsObject.rigidBody,
      groundCollider ? (collider: Rapier.Collider) => collider !== groundCollider : undefined
    )

    // Reset collider position
    this.physicsObject.collider.setTranslation(this.position)

    if (hit) {
      const collider = hit.collider
      const rigidBody = collider.parent()
      return rigidBody ? rigidBody.bodyType() === RAPIER.RigidBodyType.Fixed : false
    }

    return false
  }

  update(timestamp: number, timeDiff: number) {
    this.updateRotation()
    this.updateTranslation(timeDiff)
    this.updateGravity(timestamp, timeDiff)
    this.detectGround()
    this.updateZoom(timestamp, timeDiff)
    this.updateCamera(timestamp, timeDiff)
    this.inputManager.update()
  }

  updateZoom(timestamp: number, timeDiff: number) {
    this.zoomController.update(
      this.inputManager.currentMouse.mouseWheelDelta,
      timestamp,
      timeDiff
    )
  }

  updateGravity(timestamp: number, timeDiff: number) {
    this.heightController.update(timestamp, timeDiff)
  }

  updateCamera(timestamp: number, timeDiff: number) {
    // Calculate the camera's target position (character's head)
    const targetPosition = new THREE.Vector3().copy(this.position)
    targetPosition.y += this.avatar.height / 2 * 0.9

    this.camera.position.copy(targetPosition)

    // moving by the camera angle
    const circleRadius = this.zoomController.zoom
    const cameraOffset = new THREE.Vector3(
      circleRadius * Math.cos(-this.phi) * Math.cos(this.theta),
      circleRadius * Math.sin(-this.theta),
      circleRadius * Math.sin(-this.phi) * Math.cos(this.theta)
    )
    this.camera.position.add(cameraOffset)

    // Prevent camera from going below ground plane
    this.camera.position.y = Math.max(this.camera.position.y, 0.1)

    // Look at the character's head position
    this.camera.lookAt(targetPosition)

    const isFirstPerson = this.zoomController.zoom <= this.avatar.width
    if (isFirstPerson) {
      const physics = usePhysics()

      const rayOrigin = new THREE.Vector3().copy(this.camera.position)
      const rayDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize()
      const ray = new RAPIER.Ray(rayOrigin, rayDirection)

      const hit = physics.castRay(ray, 1000, false)

      if (hit) {
        const point = ray.pointAt(hit.toi)
        const hitPoint = new THREE.Vector3(point.x, point.y, point.z)
        this.camera.lookAt(hitPoint)
      }
    }
  }

  updateTranslation(timeDiff: number) {
    const timeDiff_d10 = timeDiff * 10

    const shiftSpeedUpAction = () =>
      this.inputManager.runActionByOneKey([KEYS.shiftL, KEYS.shiftR], () => SPRINT_SPEED, () => WALK_SPEED)

    const forwardVelocity =
      this.inputManager.runActionByKey(KEYS.w, shiftSpeedUpAction, () => 0) -
      this.inputManager.runActionByKey(KEYS.s, shiftSpeedUpAction, () => 0)

    const sideVelocity =
      this.inputManager.runActionByKey(KEYS.a, shiftSpeedUpAction, () => 0) -
      this.inputManager.runActionByKey(KEYS.d, shiftSpeedUpAction, () => 0)

    const qx = new THREE.Quaternion()
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi + Math.PI / 2)

    const forwardVector = new THREE.Vector3().copy(new THREE.Vector3(0, 0, -1))
    forwardVector.applyQuaternion(qx)
    forwardVector.multiplyScalar(forwardVelocity * timeDiff_d10)

    const sideVector = new THREE.Vector3().copy(new THREE.Vector3(-1, 0, 0))
    sideVector.applyQuaternion(qx)
    sideVector.multiplyScalar(sideVelocity * timeDiff_d10)

    // Combine the vectors to get the actual movement direction
    const movementDirection = forwardVector.clone().add(sideVector).normalize()

    // Apply movement if no collision with fixed objects
    if (movementDirection.length() > 0 && !this.checkCollisionWithFixed(movementDirection)) {
      this.position.add(forwardVector)
      this.position.add(sideVector)
    }

    // Height
    const elevationFactor = this.inputManager.runActionByKey(KEYS.space, () => 1, () => 0)

    // Jump
    if (this.heightController.grounded) {
      this.heightController.setJumpFactor(elevationFactor)
    }

    this.position.y += this.heightController.movePerFrame

    this.isMoving2D = forwardVelocity != 0 || sideVelocity != 0
  }

  updateRotation() {
    const windowSize = useRenderSize()
    const xh = this.inputManager.currentMouse.mouseXDelta / windowSize.width
    const yh = this.inputManager.currentMouse.mouseYDelta / windowSize.height

    const PHI_SPEED = 4.0
    const THETA_SPEED = 4.0
    this.phi += -xh * PHI_SPEED
    this.theta = clamp(this.theta + -yh * THETA_SPEED, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1)

    const qx = new THREE.Quaternion()
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi)
    const qz = new THREE.Quaternion()
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta)

    const q = qx.multiply(qz)

    this.quaternion.copy(q)
  }
}

// * Responsible for controlling the avatar mesh and the character controller
class AvatarController {
  avatar: THREE.Mesh
  characterController: CharacterController
  height: number
  width: number

  constructor(avatar: THREE.Mesh, camera: THREE.PerspectiveCamera) {
    this.avatar = avatar

    const size = _calculateObjectSize(avatar)
    this.width = size.x
    this.height = size.y
    this.characterController = new CharacterController(this, camera)
  }

  update(timestamp: number, timeDiff: number) {
    this.characterController.update(timestamp, timeDiff)
    this.avatar.position.copy(this.characterController.position)
  }
}

export default AvatarController
