// import { GeneralTransferObject } from "../types";

// export const calculateStatePatches = (
// 	current: GeneralTransferObject,
// 	previous: GeneralTransferObject
// ): GeneralTransferObject => {
// 	const patchObject = {
// 		op: [],
// 		_keys: [],
// 		root: [],
// 		parent: [],
// 		type: [],
// 		affectedBy: [],
// 		ratio: [],
// 	};

// 	const previousKeys = new Set(previous._keys);

// 	current._keys.forEach((key) => {
// 		if (previousKeys.has(key)) {
// 			previousKeys.delete(key);
// 			return;
// 		}
// 		const keyIndex = current._keys.findIndex((elementKey) => elementKey === key);
// 		patchObject.op.push("+");
// 		patchObject._keys.push(key);
// 		patchObject.root.push(current.root[keyIndex]);
// 		patchObject.parent.push(current.parent[keyIndex]);
// 		patchObject.type.push(current.type[keyIndex]);
// 		patchObject.affectedBy.push(current.affectedBy[keyIndex]);
// 		patchObject.ratio.push(current.ratio[keyIndex]);
// 	});

// 	previousKeys.forEach((key) => {
// 		patchObject.op.push("-");
// 		patchObject._keys.push(key);
// 	});

// 	return patchObject;
// };
