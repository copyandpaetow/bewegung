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
	ElementKey,
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
	key: ElementKey,
	element: HTMLElement,
	chunkState: ChunkState,
	totalRuntime: number
) =>
	(chunkState.getCallbacks(key) ?? []).map(({ offset, callback }) => {
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
	elementState: ElementState;
	chunkState: ChunkState;
	styleState: StyleState;
	calculateEasing: Record<number, string>;
	context: Context;
}

const calculateMainAnimation = (
	props: CalculateMainAnimationProps
): Animation => {
	const {
		key,
		elementState,
		chunkState,
		styleState,
		calculateEasing,
		context,
	} = props;
	const { changeProperties, changeTimings } = context;
	const domElement = elementState.getDomElement(key);

	const additionalTables = calculateAdditionalKeyframeTables(
		domElement,
		styleState.getElementProperties(key)!,
		context.changeTimings,
		chunkState.getKeyframes(key)
	);

	const styles = styleState.getElementProperties(key)!;
	const parentStyles = elementState.hasKey(domElement.parentElement!)
		? styleState.getElementProperties(
				elementState.getKey(domElement.parentElement!)
		  )!
		: emptyCalculatedProperties(changeProperties, changeTimings);

	return new Animation(
		new KeyframeEffect(
			domElement,
			constructKeyframes(
				getTransformValues(styles, parentStyles, checkForTextNode(domElement)),
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

	elementState.getAllKeys().forEach((key) => {
		const calculateEasing = calculateEasingMap(
			chunkState.getOptions(key) ??
				getDependecyOptions(key, elementState, chunkState),
			context.totalRuntime
		);
		const domElement = elementState.getDomElement(key);

		if (domElement.tagName === "IMG") {
			const { imageAnimation, beforeImageCallback, afterImageCallback } =
				calculateImageAnimation({
					key,
					element: domElement as HTMLImageElement,
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
					elementState,
					styleState,
					chunkState,
					context,
					calculateEasing,
				})
			);
		}

		animations.push(
			...getCallbackAnimations(
				key,
				domElement,
				chunkState,
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
