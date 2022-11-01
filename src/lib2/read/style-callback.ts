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
//? since it is element based, we could create 2 style objects to apply to it before and after the animation
export const addStyleCallback = (animationState: AnimationState, state: State) => {
	const { keyframes, onEnd, onStart } = state;
	const { readouts } = animationState;

	readouts.forEach((readout, element) => {
		const keyframe = keyframes.get(element)?.flat();
		const beforeCallbackArray: VoidFunction[] = [];
		const afterCallbackArray: VoidFunction[] = [];

		if (keyframe) {
			const changes = filterMatchingStyleFromKeyframes(keyframe, 1);
			console.log({ element, keyframe, changes });

			const changeOverrides = checkForOverrideStyles([changes.style], element);

			beforeCallbackArray.push(() => applyCSSStyles(element, changes));

			if (Object.keys(changeOverrides).length) {
				//TODO: this is not right, the overwrite styles should be applied before the animations
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
			onStart.set(element, (onStart.get(element) ?? []).concat(beforeCallbackArray));
		}

		if (afterCallbackArray.length) {
			onEnd.set(element, (onEnd.get(element) ?? []).concat(afterCallbackArray));
		}
	});
};
