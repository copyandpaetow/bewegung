import { AnimationState, State } from "../types";
import { applyCSSStyles, applyStyleObject, filterMatchingStyleFromKeyframes } from "./apply-styles";

const checkForOverrideStyles = (
	computedStyle: Partial<CSSStyleDeclaration>[],
	element: HTMLElement
) => {
	const override: Partial<CSSStyleDeclaration> = {};

	computedStyle.some((entry) => {
		//TODO: this needs to be more advanced
		if (entry.display !== "inline" || element.tagName !== "SPAN") {
			return false;
		}

		override["display"] = "inline-block";

		return true;
	});

	computedStyle.some((entry) => {
		if (entry.borderRadius === "0px") {
			return false;
		}

		override["borderRadius"] = "0px";

		return true;
	});

	return override;
};

//TODO: this needs a revision
export const addStyleCallback = (animationState: AnimationState, state: State) => {
	const { keyframes } = state;
	const { readouts, beforeCallbacks, afterCallbacks } = animationState;

	readouts.forEach((readout, element) => {
		const keyframe = keyframes.get(element)?.flat();
		const beforeCallbackArray: VoidFunction[] = [];
		const afterCallbackArray: VoidFunction[] = [];

		if (keyframe) {
			const changes = filterMatchingStyleFromKeyframes(keyframe);
			const changeOverrides = checkForOverrideStyles([changes.style], element);

			beforeCallbackArray.push(() => applyCSSStyles(element, changes));

			if (Object.keys(changeOverrides).length) {
				afterCallbackArray.push(() => applyStyleObject(element, changeOverrides));
			}
		}

		const computedStyleOverrides = checkForOverrideStyles(
			readout.map((entry) => entry.computedStyle),
			element
		);
		if (Object.keys(computedStyleOverrides).length) {
			const cssText = element.style.cssText;
			beforeCallbackArray.push(() => applyStyleObject(element, computedStyleOverrides));
			afterCallbackArray.push(() => (element.style.cssText = cssText));
		}

		if (beforeCallbackArray.length) {
			beforeCallbacks.set(
				element,
				(beforeCallbacks.get(element) ?? []).concat(beforeCallbackArray)
			);
		}

		if (afterCallbackArray.length) {
			afterCallbacks.set(element, (afterCallbacks.get(element) ?? []).concat(afterCallbackArray));
		}
	});
};
