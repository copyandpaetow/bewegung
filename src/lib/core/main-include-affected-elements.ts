import { NormalizedInput } from "../bewegung";
import { CustomKeyframe } from "../types";
import { Context } from "./create-context";
import { findAffectedDOMElements } from "./dom-find-affected-elements";

const getStylesWithAbsoluteOffsets = (
	keyframeEffect: KeyframeEffect,
	extraStyles: CustomKeyframe[] | null,
	totalRunTime: number
) => {
	const { delay: start, duration: end } = keyframeEffect.getComputedTiming();
	return keyframeEffect.getKeyframes().map((currentFrame: ComputedKeyframe) => {
		const { offset, computedOffset, composite, easing, ...cssStyles } =
			currentFrame;
		const absoluteTiming =
			((end as number) * computedOffset + (start as number)) / totalRunTime;

		const extraCssStyles =
			extraStyles?.find((style) => style.offset === computedOffset) || {};

		return { ...cssStyles, ...extraCssStyles, offset: absoluteTiming };
	});
};

export interface IncludeAffectedElements extends NormalizedInput {
	originalStyle: string;
	newStyle: ComputedKeyframe[] | null;
	affectedByElements: HTMLElement[];
}

export const includeAffectedElements =
	(globalContext: Context) =>
	(
		normalizedArguments: NormalizedInput[]
	): Map<HTMLElement, IncludeAffectedElements> =>
		normalizedArguments.reduce((accumulator, current) => {
			const target = current.keyframeInstance.target as HTMLElement;
			const affectedElements = findAffectedDOMElements(target);

			accumulator.set(target, {
				...current,
				calculatedProperties: [],
				originalStyle: target.style.cssText,
				newStyle: getStylesWithAbsoluteOffsets(
					current.keyframeInstance,
					current.unAnimatableStyles,
					globalContext.totalRunTime
				),
				affectedByElements: [target],
			});

			affectedElements.forEach((element) => {
				if (accumulator.has(element)) {
					const previous = accumulator.get(element);
					if (previous?.newStyle) {
						return;
					}
					accumulator.set(element, {
						...previous,
						affectedByElements: [...previous.affectedByElements, target],
					});
				} else {
					accumulator.set(element, {
						keyframeInstance: new KeyframeEffect(element, null),
						calculatedProperties: [],
						affectedByElements: [target],
						originalStyle: element.style.cssText,
						newStyle: null,
					});
				}
			});

			return accumulator;
		}, new Map());
