import * as THREE from 'three';

const _calculateObjectSize = (object: THREE.Object3D) => {
  const bbox = new THREE.Box3()
  bbox.expandByObject(object)
  const size = new THREE.Vector3()
  bbox.getSize(size)

  return size
}

export { _calculateObjectSize }
