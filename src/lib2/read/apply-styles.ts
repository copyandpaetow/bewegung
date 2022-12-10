import { CustomKeyframe, StyleChangePossibilities } from "../types";

export const applyStyleObject = (element: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
	Object.assign(element.style, style);
};

const applyClasses = (element: HTMLElement, classes: Set<string>) =>
	classes.forEach((classEntry) => element.classList.toggle(classEntry));

const applyAttributes = (element: HTMLElement, attributes: Set<string>) => {
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

	// console.log(element, stylePossibilities);

	style && applyStyleObject(element, style);
	classes && applyClasses(element, classes);
	attributes && applyAttributes(element, attributes);
};

export const filterMatchingStyleFromKeyframes = (
	keyframes: CustomKeyframe[],
	timing: number
): StyleChangePossibilities | undefined => {
	const updates: Partial<StyleChangePossibilities> = {};

	keyframes?.forEach((keyframe) => {
		if (timing < keyframe.offset!) {
			return;
		}

		const { offset, class: cssClass, attribute, ...styles } = keyframe;
		const hasStyles = Object.keys(styles).length > 0;

		if (hasStyles) {
			updates.style = { ...(updates.style ?? {}), ...(styles as Partial<CSSStyleDeclaration>) };
		}

		cssClass?.split(" ").forEach((classString) => {
			updates.classes ??= new Set<string>().add(classString);
		});

		attribute?.split(" ").forEach((attributeString) => {
			updates.attributes ??= new Set<string>().add(attributeString);
		});
	});

	if (Object.keys(updates).length === 0) {
		return;
	}
	updates.offset = timing;

	return updates as StyleChangePossibilities;
};
