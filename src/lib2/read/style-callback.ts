import { scheduleCallback } from "../scheduler";
import { AnimationState, ElementReadouts, State } from "../types";
import { applyCSSStyles, applyStyleObject, filterMatchingStyleFromKeyframes } from "./apply-styles";

const checkForBorderRadius = (entry: ElementReadouts) => entry.computedStyle.borderRadius !== "0px";

const checkForDisplayInline = (entry: ElementReadouts) => entry.computedStyle.display === "inline";

const checkForDisplayNone = (entry: ElementReadouts) => entry.computedStyle.display === "inline";

const checkForPositionStatic = (entry: ElementReadouts) =>
	entry.computedStyle.position === "static";

const addKeyframeCallback = (state: State) => {
	const { keyframes, onStart, mainElements } = state;
	mainElements.forEach((element) => {
		const keyframe = keyframes.get(element)!.flat();
		const changes = filterMatchingStyleFromKeyframes(keyframe, 1);
		onStart.set(
			element,
			(onStart.get(element) ?? []).concat(() => applyCSSStyles(element, changes))
		);
	});
};

const checkDefaultReadouts = (
	styleMap: Map<
		HTMLElement,
		{ before: Partial<CSSStyleDeclaration>; after: Partial<CSSStyleDeclaration> }
	>,
	animationState: AnimationState
) => {
	const { readouts } = animationState;

	readouts.forEach((readout, element) => {
		const styles = styleMap.get(element) ?? { before: {}, after: {} };

		if (readout.some(checkForBorderRadius)) {
			styles.before.borderRadius = "0px";
			styles.after.borderRadius = element.style.borderRadius;
		}

		if (element.tagName === "SPAN" && readout.some(checkForDisplayInline)) {
			styles.before.display = "inline";
			styles.after.display = element.style.display;
		}

		if (readout.some(checkForDisplayNone)) {
			styles.before.display = "absolute";
			styles.after.display = element.style.display;
		}

		styleMap.set(element, styles);
	});
};

const checkImageReadouts = (
	styleMap: Map<
		HTMLElement,
		{ before: Partial<CSSStyleDeclaration>; after: Partial<CSSStyleDeclaration> }
	>,
	state: State,
	animationState: AnimationState
) => {
	const rootSet = new Set<HTMLElement>();
	const { imageReadouts, readouts } = animationState;
	const { rootElement } = state;

	imageReadouts.forEach((readout, element) => {
		const styles = styleMap.get(element) ?? { before: {}, after: {} };
		rootSet.add(rootElement.get(element)!);

		if (readout.some(checkForBorderRadius)) {
			styles.before.borderRadius = "0px";
			styles.after.borderRadius = element.style.borderRadius;
		}

		if (readout.some(checkForDisplayNone)) {
			styles.before.display = "absolute";
			styles.after.display = element.style.display;
		}
	});

	rootSet.forEach((element) => {
		const styles = styleMap.get(element) ?? { before: {}, after: {} };
		const rootReadout = readouts.get(element) ?? imageReadouts.get(element as HTMLImageElement)!;
		if (rootReadout.every(checkForPositionStatic)) {
			styles.before.position = "relative";
			styles.before.position = element.style.position;
		}
	});
};

const setCallbacks = (
	styleMap: Map<
		HTMLElement,
		{ before: Partial<CSSStyleDeclaration>; after: Partial<CSSStyleDeclaration> }
	>,
	state: State
) => {
	const { onEnd, onStart } = state;

	styleMap.forEach((styles, element) => {
		if (Object.keys(styles.before).length) {
			onStart.set(
				element,
				(onStart.get(element) ?? []).concat(() => applyStyleObject(element, styles.before))
			);
			onEnd.set(
				element,
				(onEnd.get(element) ?? []).concat(() => applyStyleObject(element, styles.after))
			);
		}
	});
};

export const addStyleCallback = (animationState: AnimationState, state: State) => {
	const styleMap = new Map<
		HTMLElement,
		{ before: Partial<CSSStyleDeclaration>; after: Partial<CSSStyleDeclaration> }
	>();

	const tasks = [
		() => addKeyframeCallback(state),
		() => checkDefaultReadouts(styleMap, animationState),
		() => checkImageReadouts(styleMap, state, animationState),
		() => setCallbacks(styleMap, state),
	];

	tasks.forEach(scheduleCallback);
};
