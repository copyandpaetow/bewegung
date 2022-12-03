import { CustomKeyframe, StyleChangePossibilities } from "../types";

export const applyStyleObject = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	Object.assign(element.style, style);
};

const applyClasses = (element: HTMLElement, classes: string[]) =>
	classes.forEach((classEntry) => element.classList.toggle(classEntry));

const applyAttributes = (element: HTMLElement, attributes: string[]) => {
	attributes.forEach((attribute) => {
		const [key, value] = attribute.split("=");

		if (value) {
			element.setAttribute(key, value);
			return;
		}

		element.hasAttribute(key) ? element.removeAttribute(key) : element.setAttribute(key, "");
	});
};

export const applyCSSStyles = (
	element: HTMLElement,
	stylePossibilities: StyleChangePossibilities
) => {
	const { attributes, classes, style } = stylePossibilities;

	if (Object.values(style).length) {
		applyStyleObject(element, style);
	}

	if (classes.length) {
		applyClasses(element, classes);
	}

	if (attributes.length) {
		applyAttributes(element, attributes);
	}
};

const styleUpdates = (timing: number): StyleChangePossibilities => ({
	style: {},
	classes: [],
	attributes: [],
	offset: timing,
});

export const filterMatchingStyleFromKeyframes = (
	keyframes: CustomKeyframe[],
	timing: number
): StyleChangePossibilities => {
	const updates = styleUpdates(timing);

	keyframes?.forEach((keyframe) => {
		if (timing < keyframe.offset!) {
			return;
		}

		const { offset, class: cssClass, attribute, ...styles } = keyframe;

		Object.entries(styles).forEach(([key, value]) => {
			updates.style[key] = value;
		});

		if (Boolean(cssClass)) {
			updates.classes.push(...(cssClass as string).split(" "));
		}
		if (Boolean(attribute)) {
			updates.attributes.push(...(attribute as string).split(" "));
		}
	});

	return updates;
};
