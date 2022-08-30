import {
	beforeAnimationCallback,
	afterAnimationCallback,
} from "../prepare-input/callback-state";
import {
	ChunkState,
	calculatedElementProperties,
	StyleState,
	Context,
	ElementState,
	differenceArray,
	DimensionalDifferences,
} from "../types";
import {
	emptyCalculatedProperties,
	checkForTextNode,
	calculateDimensionDifferences,
} from "./calculate-dimension-differences";
import { calculateEasingMap } from "./calculate-easings";
import { calculateImageAnimation } from "./calculate-image-animations";
import {
	getBorderRadius,
	getOpacity,
	getFilter,
	getUserTransforms,
	constructKeyframes,
	getDependecyOptions,
} from "./construct-keyframes";

const getTransformValues = (
	element: HTMLElement,
	styleState: StyleState,
	context: Context
): DimensionalDifferences[] => {
	const { changeProperties, changeTimings } = context;
	const parentEntries =
		styleState.getElementProperties(element.parentElement!) ??
		emptyCalculatedProperties(changeProperties, changeTimings);
	const elementProperties = styleState.getElementProperties(element)!;
	const isTextNode = checkForTextNode(element);

	return elementProperties.map((calculatedProperty, index, array) => {
		const child: differenceArray = [calculatedProperty, array.at(-1)!];
		const parent: differenceArray = [
			parentEntries[index],
			parentEntries.at(-1)!,
		];
		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};

export const getCallbackAnimations = (
	element: HTMLElement,
	chunkState: ChunkState,
	totalRuntime: number
) =>
	(chunkState.getCallbacks(element) ?? []).map(({ offset, callback }) => {
		const animation = new Animation(
			new KeyframeEffect(element, [], offset * totalRuntime)
		);
		animation.onfinish = callback;
		return animation;
	});

const calculateAdditionalKeyframeTables = (
	element: HTMLElement,
	elementProperties: calculatedElementProperties[],
	changeTimings: number[],
	keyframes?: ComputedKeyframe[]
) => {
	return {
		borderRadiusTable: getBorderRadius(elementProperties),
		opacityTable: getOpacity(elementProperties),
		filterTable: getFilter(elementProperties),
		userTransformTable: getUserTransforms(element, changeTimings, keyframes),
	};
};

interface CalculateMainAnimationProps {
	element: HTMLElement;
	chunkState: ChunkState;
	styleState: StyleState;
	calculateEasing: Record<number, string>;
	context: Context;
}

const calculateMainAnimation = (
	props: CalculateMainAnimationProps
): Animation => {
	const { element, chunkState, styleState, calculateEasing, context } = props;

	const additionalTables = calculateAdditionalKeyframeTables(
		element,
		styleState.getElementProperties(element)!,
		context.changeTimings,
		chunkState.getKeyframes(element)
	);

	return new Animation(
		new KeyframeEffect(
			element,
			constructKeyframes(getTransformValues(element, styleState, context), {
				easingTable: calculateEasing,
				...additionalTables,
			}),
			context.totalRuntime
		)
	);
};

interface GetAnimations {
	animations: Animation[];
	runBeforeAnimation: VoidFunction[];
	runAfterAnimation: VoidFunction[];
}

interface GetAnimationsProps {
	elementState: ElementState;
	chunkState: ChunkState;
	styleState: StyleState;
	context: Context;
}

export const getAnimations = (props: GetAnimationsProps): GetAnimations => {
	const { elementState, chunkState, styleState, context } = props;

	const animations: Animation[] = [];
	const runBeforeAnimation: VoidFunction[] = [
		() => beforeAnimationCallback(chunkState, elementState, styleState),
	];
	const runAfterAnimation: VoidFunction[] = [];

	elementState.getAllElements().forEach((element) => {
		const calculateEasing = calculateEasingMap(
			chunkState.getOptions(element) ??
				getDependecyOptions(element, elementState, chunkState),
			context.totalRuntime
		);

		if (element.tagName === "IMG") {
			const { imageAnimation, beforeImageCallback, afterImageCallback } =
				calculateImageAnimation({
					element: element as HTMLImageElement,
					styleState,
					context,
					calculateEasing,
				});
			animations.push(...imageAnimation);
			runBeforeAnimation.push(beforeImageCallback);
			runAfterAnimation.push(afterImageCallback);
		} else {
			animations.push(
				calculateMainAnimation({
					element,
					styleState,
					chunkState,
					context,
					calculateEasing,
				})
			);
		}

		animations.push(
			...getCallbackAnimations(element, chunkState, context.totalRuntime)
		);
	});

	runAfterAnimation.push(() =>
		afterAnimationCallback(elementState, styleState)
	);

	return {
		animations,
		runBeforeAnimation,
		runAfterAnimation,
	};
};