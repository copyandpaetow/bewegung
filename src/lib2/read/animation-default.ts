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
import { calculateDimensionDifferences } from "./calculate-dimension-differences";
import { calculateEasingMap } from "./calculate-easings";

const initialCalculationState = (): CalculationState => ({
	calculations: [],
	easingTable: {},
	borderRadiusTable: {},
	opacityTable: {},
	filterTable: {},
	userTransformTable: {},
});

const checkForTextNode = (element: HTMLElement) => {
	const childNodes = Array.from(element.childNodes);

	if (childNodes.length === 0) {
		return false;
	}

	return childNodes.every((node) => Boolean(node.textContent?.trim()));
};

const calcualtionsFromReadouts = (
	calculationState: CalculationState,
	readouts: ElementReadouts[],
	parentReadouts: ElementReadouts[],
	isTextNode: boolean
) => {
	const { calculations } = calculationState;
	//TODO: maybe here the filtering could take place and only locally and for the child so the entries are not affected but stuff will not get calculated multiple times

	readouts.forEach((readout, index, array) => {
		const child: DifferenceArray = [readout, array.at(-1)!];
		const parent: DifferenceArray = [parentReadouts[index], parentReadouts.at(-1)!];

		calculations.push(calculateDimensionDifferences(child, parent, isTextNode));
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
		({ xDifference, yDifference, widthDifference, heightDifference, offset }) =>
			({
				offset,
				composite: "auto",
				easing: easingTable[offset] ?? defaultOptions.easing,
				transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference}) ${
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
		const parentReadouts = readouts.get(element.parentElement!) ?? readout;
		const calculationState = initialCalculationState();

		const tasks = [
			() =>
				calcualtionsFromReadouts(
					calculationState,
					readout,
					parentReadouts,
					checkForTextNode(element)
				),
			() => calculateAdditionalKeyframeTables(calculationState, readout),
			() => calculateEasingMap(calculationState, options.get(element)!, totalRuntime),
			() => animations.set(element, createAnimation(element, calculationState, totalRuntime)),
		];

		tasks.forEach(scheduleCallback);
	});
};
