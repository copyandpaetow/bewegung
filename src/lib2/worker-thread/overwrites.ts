import { calculatedElementProperties, ElementKey } from "../types";

export const calculateOverwriteStyles = (
	calculatedProperties: calculatedElementProperties[],
	element: ElementKey
) => {
	const overwrite: Partial<CSSStyleDeclaration> = {};

	calculatedProperties.some((entry) => {
		//TODO: this needs to be more advanced
		if (
			entry.computedStyle.display !== "inline" ||
			element.tagName !== "SPAN"
		) {
			return false;
		}

		overwrite["display"] = "inline-block";

		return true;
	});

	calculatedProperties.some((entry) => {
		if (entry.computedStyle.borderRadius === "0px") {
			return false;
		}

		overwrite["borderRadius"] = "0px";

		return true;
	});

	return overwrite;
};
