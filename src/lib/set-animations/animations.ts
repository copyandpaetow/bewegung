import {
	afterAnimationCallback,
	beforeAnimationCallback,
} from "../prepare-input/callback-state";
import {
	calculatedElementProperties,
	Callbacks,
	Context,
	differenceArray,
	DimensionalDifferences,
	ElementKey,
	ElementState,
	StyleState,
} from "../types";
import {
	calculateDimensionDifferences,
	checkForTextNode,
	emptyCalculatedProperties,
} from "./calculate-dimension-differences";
import { calculateEasingMap } from "./calculate-easings";
import { calculateImageAnimation } from "./calculate-image-animations";
import {
	constructKeyframes,
	getBorderRadius,
	getFilter,
	getOpacity,
	getUserTransforms,
} from "./construct-keyframes";

const getTransformValues = (
	elementProperties: calculatedElementProperties[],
	parentProperties: calculatedElementProperties[],
	isTextNode: boolean
): DimensionalDifferences[] => {
	return elementProperties.map((calculatedProperty, index, array) => {
		const child: differenceArray = [calculatedProperty, array.at(-1)!];
		const parent: differenceArray = [
			parentProperties[index],
			parentProperties.at(-1)!,
		];
		return calculateDimensionDifferences(child, parent, isTextNode);
	});
};

export const getCallbackAnimations = (
	element: HTMLElement,
	callbacks: Callbacks[],
	totalRuntime: number
) =>
	callbacks.map(({ offset, callback }) => {
		const animation: Animation = new Animation(
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
	key: ElementKey;
	element: HTMLElement;
	elementState: ElementState;
	styleState: StyleState;
	calculateEasing: Record<number, string>;
	context: Context;
}

const calculateMainAnimation = (
	props: CalculateMainAnimationProps
): Animation => {
	const { key, element, elementState, styleState, calculateEasing, context } =
		props;
	const { changeProperties, changeTimings } = context;

	const additionalTables = calculateAdditionalKeyframeTables(
		element,
		styleState.getElementProperties(key)!,
		context.changeTimings,
		elementState.getKeyframes(element)
	);

	const styles = styleState.getElementProperties(key)!;
	const parentKeys = elementState.getKey(element.parentElement!);
	const parentStyles = parentKeys
		? styleState.getElementProperties(parentKeys[0])!
		: emptyCalculatedProperties(changeProperties, changeTimings);

	return new Animation(
		new KeyframeEffect(
			element,
			constructKeyframes(
				getTransformValues(styles, parentStyles, checkForTextNode(element)),
				{
					easingTable: calculateEasing,
					...additionalTables,
				}
			),
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
	styleState: StyleState;
	context: Context;
}

export const getAnimations = (props: GetAnimationsProps): GetAnimations => {
	const { elementState, styleState, context } = props;

	const animations: Animation[] = [];
	const runBeforeAnimation: VoidFunction[] = [
		() => beforeAnimationCallback(elementState, styleState),
	];
	const runAfterAnimation: VoidFunction[] = [];

	elementState.forEach((element, key) => {
		const calculateEasing = calculateEasingMap(
			key.mainElement
				? elementState.getOptions(element)
				: elementState.getDependecyOptions(element),
			context.totalRuntime
		);

		if (element.tagName === "IMG") {
			const { imageAnimation, beforeImageCallback, afterImageCallback } =
				calculateImageAnimation({
					key,
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
					key,
					element,
					elementState,
					styleState,
					context,
					calculateEasing,
				})
			);
		}

		animations.push(
			...getCallbackAnimations(
				element,
				elementState.getCallbacks(element),
				context.totalRuntime
			)
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
