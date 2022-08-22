import {
	StyleState,
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
} from "./calculate-dom-changes";
import { ChunkState } from "./get-chunk-state";
import { ElementState } from "./get-element-state";

export const runBeforeAnimation = (
	chunkState: ChunkState,
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.getAllElements().forEach((element) => {
		const overrides = styleState.getStyleOverrides(element);
		const isMainElement = elementState.isMainElement(element);

		if (!overrides && !isMainElement) {
			return;
		}

		applyCSSStyles(element, {
			...(isMainElement &&
				filterMatchingStyleFromKeyframes(chunkState.getKeyframes(element))),
			...(overrides && overrides.override),
		});
	});
};

type RequiredCallbacks = "requiredBeforeAnimation" | "requiredAfterAnimation";

export const runAfterAnimation = (
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.getAllElements().forEach((element) => {
		const overrides = styleState.getStyleOverrides(element);

		if (!overrides) {
			return;
		}

		applyCSSStyles(element, {
			...overrides.existingStyle,
		});
	});
};

export interface CallbackState {
	set(callback: VoidFunction): void;
	execute(): void;
}

export const callbackState = (): CallbackState => {
	const callbacks = new Set<VoidFunction>();

	return {
		set(callback: VoidFunction) {
			callbacks.add(callback);
		},
		execute() {
			callbacks.forEach((callback) => callback());
			callbacks.clear;
		},
	};
};
