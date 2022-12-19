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

export const applyCSSStyles = (element: HTMLElement, resultingStyle: CustomKeyframe) => {
	const { offset, attribute, class: cssClass, easing, composite, ...style } = resultingStyle;

	style && applyStyleObject(element, style as Partial<CSSStyleDeclaration>);
	cssClass && applyClasses(element, cssClass.split(" "));
	attribute && applyAttributes(element, attribute.split(" "));
};

export const filterMatchingStyleFromKeyframes = (
	keyframes: CustomKeyframe[],
	timing: number
): CustomKeyframe | undefined => {
	const resultingStyle: CustomKeyframe = {};

	keyframes?.forEach((keyframe) => {
		if (timing < keyframe.offset!) {
			return;
		}

		const { offset, class: cssClass, attribute, easing, composite, ...styles } = keyframe;

		Object.entries(styles).forEach(([key, value]) => {
			resultingStyle[key] = value;
		});

		cssClass && (resultingStyle.class = `${resultingStyle.class} ${cssClass}`);
		attribute && (resultingStyle.attribute = `${resultingStyle.attribute} ${attribute}`);
	});

	if (timing !== 0 && Object.keys(resultingStyle).length === 0) {
		return;
	}

	resultingStyle.offset = timing;

	return resultingStyle as StyleChangePossibilities;
};
