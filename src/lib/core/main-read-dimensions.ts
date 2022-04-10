import { cssRuleName, CustomKeyframe } from "../types";
import { iterateMap } from "../utils/iterate-map";
import { Context } from "./create-context";
import { IncludeAffectedElements } from "./main-include-affected-elements";

export const getComputedStylings = (
	changeProperties: cssRuleName[],
	element?: HTMLElement
): CustomKeyframe => {
	const style = element
		? window.getComputedStyle(element)
		: window.getComputedStyle(document.head);

	const transformedProperties = changeProperties.reduce(
		(accumulator, current) => {
			if (typeof style[current as keyof CSSStyleDeclaration] !== "string") {
				return {
					...accumulator,
					...{ [current]: style[current as keyof CSSStyleDeclaration] },
				};
			}

			if (current === "transformOrigin") {
				return {
					...accumulator,
					...{
						[current]: style[current]
							.split(" ")
							.map((value) =>
								value.includes("px")
									? parseFloat(value)
									: parseFloat(value) / 100
							),
					},
				};
			}

			const parsed = parseFloat(
				style[current as keyof CSSStyleDeclaration] as string
			);
			return {
				...accumulator,
				...{
					[current]: isNaN(parsed)
						? style[current as keyof CSSStyleDeclaration]
						: parsed,
				},
			};
		},
		{}
	);

	return transformedProperties;
};

export const getDomRect = (domElement: HTMLElement): DOMRect => {
	const { top, right, bottom, left, width, height, x, y, toJSON } =
		domElement.getBoundingClientRect();
	return { top, right, bottom, left, width, height, x, y, toJSON };
};

export type CalculatedProperties = {
	dimensions: DOMRect;
	styles: Record<string, any>;
	offset: number;
};

export interface ReadDimensions extends IncludeAffectedElements {
	calculatedProperties: CalculatedProperties[];
}

export const readDimensions =
	(globalContext: Context) =>
	(
		animationMap: Map<HTMLElement, IncludeAffectedElements>
	): Map<HTMLElement, ReadDimensions> =>
		globalContext.changeTimings.reduce((accumulator, current, index, array) => {
			accumulator = iterateMap((value, key) => {
				if (value.newStyle && value.newStyle.length > 0) {
					const currentStyleChange = value.newStyle?.find(
						(timing) => timing.offset === current
					);
					if (currentStyleChange) {
						const {
							offset,
							composite,
							computedOffset,
							easing,
							transform,
							...changedStyles
						} = currentStyleChange;
						Object.assign(key.style, changedStyles);
					}
				}
				return value;
			}, accumulator);

			accumulator = iterateMap((value, key) => {
				return {
					...value,
					calculatedProperties: [
						...value.calculatedProperties,
						{
							dimensions: getDomRect(key),
							styles: getComputedStylings(globalContext.changeProperties, key),
							offset: current,
						},
					],
				};
			}, accumulator as Map<HTMLElement, ReadDimensions>);

			if (index === array.length - 1) {
				accumulator = iterateMap((value, key) => {
					key.style.cssText = value.originalStyle;
					return value;
				}, accumulator);
			}

			return accumulator;
		}, animationMap) as Map<HTMLElement, ReadDimensions>;
