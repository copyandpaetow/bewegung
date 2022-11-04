import { AnimationState, ElementReadouts, State } from "../types";
import { applyCSSStyles, applyStyleObject, filterMatchingStyleFromKeyframes } from "./apply-styles";

const checkForBorderRadius = (entry: ElementReadouts) => entry.computedStyle.borderRadius !== "0px";

const checkForDisplayInline = (entry: ElementReadouts) => entry.computedStyle.display === "inline";

export const addStyleCallback = (animationState: AnimationState, state: State) => {
	const { keyframes, onEnd, onStart, mainElements } = state;
	const { readouts } = animationState;

	mainElements.forEach((element) => {
		const keyframe = keyframes.get(element)!.flat();
		const changes = filterMatchingStyleFromKeyframes(keyframe, 1);
		onStart.set(
			element,
			(onStart.get(element) ?? []).concat(() => applyCSSStyles(element, changes))
		);
	});

	readouts.forEach((readout, element) => {
		const beforeStyle: Partial<CSSStyleDeclaration> = {};
		const afterStyle: Partial<CSSStyleDeclaration> = {};

		if (element.tagName === "IMG" && readout.some(checkForBorderRadius)) {
			beforeStyle.borderRadius = "0px";
			afterStyle.borderRadius = element.style.borderRadius;
		}

		if (element.tagName === "SPAN" && readout.some(checkForDisplayInline)) {
			beforeStyle.display = "inline";
			afterStyle.display = element.style.display;
		}

		if (Object.keys(beforeStyle).length) {
			onStart.set(
				element,
				(onStart.get(element) ?? []).concat(() => applyStyleObject(element, beforeStyle))
			);
			onEnd.set(
				element,
				(onEnd.get(element) ?? []).concat(() => applyStyleObject(element, afterStyle))
			);
		}
	});
};
