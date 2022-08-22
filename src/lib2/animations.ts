import {
	constructKeyframes,
	getBorderRadius,
	getFilter,
	getOpacity,
	getUserTransforms,
} from "./animate/keyframes";
import { ChunkState } from "./prepare/chunk-state";
import { ElementState } from "./prepare/element-state";
import { getTransformValues, StyleState } from "./read/read";
import { calculatedElementProperties, Context } from "./types";

export const getCallbackAnimations = (
	element: HTMLElement,
	chunkState: ChunkState,
	totalRuntime: number
) => {
	const callbackAnimations: Animation[] = [];

	chunkState.getAllCallbacks().forEach(({ offset, callback }) => {
		const animation = new Animation(
			new KeyframeEffect(element, null, offset * totalRuntime)
		);
		animation.onfinish = callback;
		callbackAnimations.push(animation);
	});

	return callbackAnimations;
};

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

export const getMainAnimation = (
	element: HTMLElement,
	chunkState: ChunkState,
	elementState: ElementState,
	styleState: StyleState,
	context: Context,
	easingTable: Record<number, string>
) => {
	const { totalRuntime, changeTimings } = context;

	const additionalTables = calculateAdditionalKeyframeTables(
		element,
		styleState.getElementProperties(element)!,
		changeTimings,
		elementState.isMainElement(element)
			? chunkState.getKeyframes(element)
			: undefined
	);

	return new Animation(
		new KeyframeEffect(
			element,
			constructKeyframes(getTransformValues(element, styleState, context), {
				easingTable,
				...additionalTables,
			}),
			totalRuntime
		)
	);
};
