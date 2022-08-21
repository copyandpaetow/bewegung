import {
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
	StyleState,
} from "../read/read";
import { state_image } from "./calculate-image";
import { ElementState } from "../prepare/element-state";
import { ChunkState } from "../prepare/chunk-state";

let state_progress = { progress: 0, time: 0 };
let state_stylesApplied = false;

let state_afterAnimationCallback = new WeakMap<HTMLElement, VoidFunction>();

export const applyStyles = (
	elementState: ElementState,
	styleState: StyleState,
	chunkState: ChunkState,
	animations: Animation[]
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

	elementState.getAllElements().forEach((element) => {
		const callback = state_image.get(element);

		if (!callback) {
			return;
		}
		state_afterAnimationCallback.set(element, callback());
	});

	state_stylesApplied = true;
	getFinishPromise(animations).then(() => {
		state_stylesApplied = false;
		elementState.getAllElements().forEach((element) => {
			const overrides = styleState.getStyleOverrides(element);

			state_afterAnimationCallback.get(element)?.();

			if (!overrides) {
				return;
			}

			applyCSSStyles(element, {
				...overrides.existingStyle,
			});
		});
	});
};

export const getFinishPromise = (animations: Animation[]) =>
	Promise.all(animations.map((animation) => animation.finished));
