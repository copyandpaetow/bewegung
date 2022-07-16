import {
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
	CustomKeyframeEffect,
	ValueOf,
} from "../types";

export const arrayifyInputs = (
	animationInput:
		| CustomKeyframeEffect
		| KeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
): (CustomKeyframeEffect | KeyframeEffect)[] => {
	if (
		animationInput instanceof KeyframeEffect ||
		animationInput.some(
			(prop) => !Array.isArray(prop) && !(prop instanceof KeyframeEffect)
		)
	) {
		return [animationInput] as (CustomKeyframeEffect | KeyframeEffect)[];
	}
	return animationInput as (CustomKeyframeEffect | KeyframeEffect)[];
};

const formatArraySyntax = (
	keyframeWithArraySyntax: CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
	const amountOfObjects = Object.values(keyframeWithArraySyntax).reduce(
		(highestValue, newValue) => Math.max(highestValue, newValue?.length || 0),
		0
	);

	const { offset: keyframeOffset, ...keyframeWithoutOffset } =
		keyframeWithArraySyntax;

	const objectArray: CustomKeyframe[] = Array.from(
		{ length: amountOfObjects },
		(_, index) => {
			if (!keyframeOffset?.length) {
				return {
					offset: index / (amountOfObjects - 1),
				};
			}

			if (keyframeOffset[index]) {
				return {
					offset: keyframeOffset[index] as number,
				};
			}

			if ((keyframeOffset as number[]).at(-1) !== 1) {
				const step =
					(1 - parseFloat(`${(keyframeOffset as number[]).at(-1)}`)) /
					(amountOfObjects - keyframeOffset.length);
				return {
					offset: step * index + 1,
				};
			}

			return {
				offset: 1,
			};
		}
	);

	Object.entries(keyframeWithoutOffset).forEach(
		([key, value]: [string, ValueOf<CustomKeyframeArrayValueSyntax>]) => {
			value?.forEach((entry: ValueOf<CustomKeyframe>, index: number) => {
				objectArray[index] = { ...objectArray[index], ...{ [key]: entry } };
			});
		}
	);

	return objectArray;
};

export const formatKeyFrames = (
	keyframe: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax
): CustomKeyframe[] => {
	if (Array.isArray(keyframe)) {
		return keyframe;
	}
	if (Object.values(keyframe).every((value) => !Array.isArray(value))) {
		return [keyframe] as CustomKeyframe[];
	}
	if (Object.values(keyframe).every((value) => Array.isArray(value))) {
		return formatArraySyntax(keyframe as CustomKeyframeArrayValueSyntax);
	}
	throw new Error("No mixing between array and object syntax");
};

import { ElementOrSelector } from "../types";

const findElementsByString = (elementString: string) => {
	const getFromSelector = document.querySelectorAll(elementString);
	if (getFromSelector.length === 0) {
		throw new Error("There is no selector with that name");
	}

	return new Set([...getFromSelector] as HTMLElement[]);
};

const QUERYSTRING = "bewegung-getelement";

const convertToElementArray = (element: HTMLElement): HTMLElement[] => {
	element.setAttribute(QUERYSTRING, "");

	const newNodeList = document.querySelectorAll(`[${QUERYSTRING}]`);
	element.removeAttribute(QUERYSTRING);

	return Array.from(newNodeList) as HTMLElement[];
};

export const normalizeElement = (
	elementOrElements: ElementOrSelector
): Set<HTMLElement> => {
	if (typeof elementOrElements === "string") {
		return findElementsByString(elementOrElements);
	}

	if (elementOrElements instanceof NodeList) {
		return new Set([...elementOrElements] as HTMLElement[]);
	}

	if (Array.isArray(elementOrElements)) {
		const elementArray = elementOrElements.flatMap((element) => {
			return element instanceof HTMLElement
				? element
				: convertToElementArray(element as HTMLElement);
		});
		return new Set(elementArray);
	}

	return new Set(convertToElementArray(elementOrElements as HTMLElement));
};
