import { defaultOptions } from "../constants";
import { scheduleCallback } from "../scheduler";
import {
	AnimationState,
	CalculationState,
	DifferenceArray,
	ElementReadouts,
	State,
} from "../types";
import { calculateAdditionalKeyframeTables } from "./additional-tables";
import { calculateDimensionDifferences } from "./dimension-differences";
import { calculateEasingMap } from "./easings";

const initialCalculationState = (): CalculationState => ({
	calculations: [],
	easingTable: {},
	borderRadiusTable: {},
	opacityTable: {},
	filterTable: {},
	userTransformTable: {},
});

const isTextNode = (element: HTMLElement) => {
	const childNodes = Array.from(element.childNodes);

	if (childNodes.length === 0) {
		return false;
	}

	return childNodes.every((node) => Boolean(node.textContent?.trim()));
};

const getCalcualtionsFromReadouts = (
	element: HTMLElement,
	calculationState: CalculationState,
	readouts: ElementReadouts[],
	parentReadouts: ElementReadouts[] | undefined
) => {
	const { calculations } = calculationState;
	const textNode = isTextNode(element);
	//TODO: maybe here the filtering could take place and only locally and for the child so the entries are not affected but stuff will not get calculated multiple times

	readouts.forEach((readout, index, array) => {
		const child: DifferenceArray = [readout, array.at(-1)!];
		const parent: DifferenceArray | [undefined, undefined] = parentReadouts
			? [parentReadouts[index], parentReadouts.at(-1)!]
			: [undefined, undefined];

		calculations[index] = calculateDimensionDifferences(child, parent, textNode);
	});
};

const createAnimation = (
	element: HTMLElement,
	calculationState: CalculationState,
	totalRuntime: number
) => {
	const {
		calculations,
		easingTable,
		borderRadiusTable,
		opacityTable,
		filterTable,
		userTransformTable,
	} = calculationState;

	const keyframes = calculations.map(
		({ leftDifference, topDifference, widthDifference, heightDifference, offset }) =>
			({
				offset,
				composite: "auto",
				easing: easingTable[offset] ?? defaultOptions.easing,
				transform: `translate(${leftDifference}px, ${topDifference}px) scale(${widthDifference}, ${heightDifference}) ${
					userTransformTable[offset] ? userTransformTable[offset] : ""
				} `,
				...(borderRadiusTable[offset] && {
					clipPath: `inset(0px round ${borderRadiusTable[offset]})`,
				}),
				...(opacityTable[offset] && {
					opacity: `${opacityTable[offset]}`,
				}),
				...(filterTable[offset] && {
					filter: `${filterTable[offset]}`,
				}),
			} as Keyframe)
	);

	return new Animation(new KeyframeEffect(element, keyframes, totalRuntime));
};

export const setDefaultCalculations = (animationState: AnimationState, state: State) => {
	const { totalRuntime, options, animations } = state;
	const { readouts } = animationState;

	readouts.forEach((readout, element) => {
		const parentReadouts = readouts.get(element.parentElement ?? element);
		const calculationState = initialCalculationState();

		const tasks = [
			() => getCalcualtionsFromReadouts(element, calculationState, readout, parentReadouts),
			() => calculateAdditionalKeyframeTables(calculationState, readout),
			() => calculateEasingMap(calculationState, options.get(element)!, totalRuntime),
			() => animations.set(element, createAnimation(element, calculationState, totalRuntime)),
		];

		tasks.forEach(scheduleCallback);
	});
};
