import {
	applyCSSStyles,
	applyStyleObject,
	filterMatchingStyleFromKeyframes,
} from "../set-animations/read-dom";
import { CallbackState, ElementState, StyleState } from "../types";

export const beforeAnimationCallback = (
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.forEach((element, key) => {
		const overrides = styleState.getStyleOverrides(key);
		const isMainElement = key.mainElement;

		if (!overrides && !isMainElement) {
			return;
		}

		applyCSSStyles(element, {
			...filterMatchingStyleFromKeyframes(elementState.getKeyframes(element)),
			...(overrides && overrides.override),
		});
	});
};

export const afterAnimationCallback = (
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.forEach((element, key) => {
		const overrides = styleState.getStyleOverrides(key);

		if (!overrides) {
			return;
		}

		applyStyleObject(element, {
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
