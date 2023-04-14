import { AllReadouts, DefaultReadouts, WorkerState } from "../types";
import { checkForDisplayNone, checkForBorderRadius } from "../utils/predicates";
import { getNextParent } from "./keyframes";

export const getAbsoluteStyle = (
	readouts: DefaultReadouts[],
	parentReadouts: DefaultReadouts[],
	optionalStyles: Partial<CSSStyleDeclaration> = {}
): Partial<CSSStyleDeclaration> => ({
	position: "absolute",
	left: readouts.at(-1)!.currentLeft - parentReadouts.at(-1)!.currentLeft + "px",
	top: readouts.at(-1)!.currentTop - parentReadouts.at(-1)!.currentTop + "px",
	width: readouts.at(-1)!.currentWidth + "px",
	height: readouts.at(-1)!.currentHeight + "px",
	...optionalStyles,
});

const isParentStatic = (
	parentOverride: Partial<CSSStyleDeclaration> | undefined,
	parentReadouts: DefaultReadouts[]
) => parentReadouts!.at(-1)!.position === "static" && parentOverride?.position === undefined;

export const setOverrides = <Value extends AllReadouts>(
	currentReadouts: Value,
	partialElements: Map<string, Keyframe[]>,
	state: WorkerState
) => {
	const { parents, defaultReadouts } = state;
	const overrides = new Map<string, Partial<CSSStyleDeclaration>>();

	currentReadouts.forEach((readouts, elementID) => {
		const parentKey = getNextParent(elementID, parents, currentReadouts, defaultReadouts);
		const parentReadouts = defaultReadouts.get(parentKey)!;

		const isPartialElement = partialElements.has(elementID);
		const isHiddenInTheEnd = checkForDisplayNone(readouts.at(-1)!);

		if (isHiddenInTheEnd) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				...getAbsoluteStyle(readouts, parentReadouts, { display: "" }),
			});
		}
		if (isPartialElement) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				...getAbsoluteStyle(readouts, parentReadouts),
			});
		}

		if (
			(isPartialElement || isHiddenInTheEnd) &&
			isParentStatic(overrides.get(parentKey), parentReadouts)
		) {
			overrides.set(parentKey, {
				...(overrides.get(parentKey) ?? {}),
				position: "relative",
			});
		}

		if (readouts.some(checkForBorderRadius)) {
			overrides.set(elementID, {
				...(overrides.get(elementID) ?? {}),
				borderRadius: "0px",
			});
		}
	});
	return overrides;
};
