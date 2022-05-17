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
		: window.getComputedStyle(document.head); //an empty element that is mounted in the DOM

	const transformedProperties = changeProperties.reduce(
		(accumulator, current) => {
			if (!style[current as keyof CSSStyleDeclaration]) {
				return accumulator;
			}

			return {
				...accumulator,
				...{ [current]: style[current as keyof CSSStyleDeclaration] },
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

const isTextNode = (element: HTMLElement) => {
	const childNodes = Array.from(element.childNodes);

	if (
		childNodes.length === 0 ||
		childNodes.every((node) => node.nodeType !== 3)
	) {
		return false;
	}

	return childNodes.every((node) =>
		Boolean(
			((node as Text).wholeText || (node as HTMLElement).innerText)
				?.replaceAll("\t", "")
				.replaceAll("\n", "")
		)
	);
};

const measureText = (element: HTMLElement, font: string) => {
	const text = Array.from(
		element.childNodes,
		(node) => (node as Text).wholeText || (node as HTMLElement).innerText
	).join("");
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	context!.font = font;
	return context!.measureText(text).width;
};

export const readDimensions =
	(globalContext: Context) =>
	(
		animationMap: Map<HTMLElement, IncludeAffectedElements>
	): Map<HTMLElement, ReadDimensions> =>
		globalContext.changeTimings.reduce((accumulator, current, index, array) => {
			accumulator = iterateMap((value, key) => {
				let styleChange = {};

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

						styleChange = { ...styleChange, ...changedStyles };
					}
				}

				Object.keys(styleChange).length > 0 &&
					Object.assign(key.style, styleChange);
				return value;
			}, accumulator);

			accumulator = iterateMap((value, key) => {
				const textNode = isTextNode(key);
				const computedStyle = getComputedStylings(
					globalContext.changeProperties,
					key
				);
				const domRect = getDomRect(key);

				if (textNode) {
					const textWidth = measureText(key, computedStyle.font as string);

					const transformOrigin = (computedStyle.transformOrigin as string)
						.split(" ")
						.map((value, index) => {
							if (index > 0 || value.includes("%") || value.includes("0px")) {
								return value;
							}
							return `${(parseFloat(value) / domRect.width) * textWidth}px`;
						})
						.join(" ");

					// if (key.classList.contains("log")) {
					// 	console.log({
					// 		TO: computedStyle.transformOrigin,
					// 		transformOrigin,
					// 		key,
					// 		textWidth,
					// 		originalWidth: domRect.width,
					// 	});
					// }

					return {
						...value,
						calculatedProperties: [
							...value.calculatedProperties,
							{
								dimensions: {
									...domRect,
									width: textWidth,
									right: domRect.left + textWidth,
								},
								styles: {
									...computedStyle,
									transformOrigin,
								},
								offset: current,
							},
						],
					};
				}

				return {
					...value,
					calculatedProperties: [
						...value.calculatedProperties,
						{
							dimensions: domRect,
							styles: computedStyle,
							offset: current,
						},
					],
				};
			}, accumulator as Map<HTMLElement, ReadDimensions>);

			if (index === array.length - 1) {
				accumulator = iterateMap((value, key) => {
					key.style.cssText = value.originalStyle;
					return value;
				}, accumulator as Map<HTMLElement, ReadDimensions>);
			}

			return accumulator;
		}, animationMap) as Map<HTMLElement, ReadDimensions>;
