import {
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
	applyStyleObject,
} from "../set-animations/read-dom";
import { ChunkState, ElementState, StyleState, CallbackState } from "../types";

export const beforeAnimationCallback = (
	chunkState: ChunkState,
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.getAllKeys().forEach((key) => {
		const overrides = styleState.getStyleOverrides(key);
		const isMainElement = key.mainElement;

		if (!overrides && !isMainElement) {
			return;
		}

		applyCSSStyles(elementState.getDomElement(key), {
			...filterMatchingStyleFromKeyframes(chunkState.getKeyframes(key)!),
			...(overrides && overrides.override),
		});
	});
};

export const afterAnimationCallback = (
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.getAllKeys().forEach((key) => {
		const overrides = styleState.getStyleOverrides(key);

		if (!overrides) {
			return;
		}

		applyStyleObject(elementState.getDomElement(key), {
			...overrides.existingStyle,
		});
	});
};

export const callbackState = (): CallbackState => {
	const queue = new Set<VoidFunction>();

	return {
		set(allCallbacks: VoidFunction[]) {
			allCallbacks.forEach((callback) => {
				queue.add(callback);
			});
		},
		execute() {
			queue.forEach((callback) => callback());
			queue.clear();
		},
	};
};
