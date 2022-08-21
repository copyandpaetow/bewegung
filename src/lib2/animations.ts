import { calculateNewImage } from "./animate/calculate-image";
import { calculateEasingMap } from "./animate/calculate-timeline";
import {
	getDependecyOptions,
	constructKeyframes,
	getBorderRadius,
	getOpacity,
	getFilter,
	getUserTransforms,
} from "./animate/keyframes";
import { ChunkState } from "./prepare/chunk-state";
import { ElementState } from "./prepare/element-state";
import {
	updateChangeTimings,
	updateChangeProperties,
} from "./read/properties-and-timings";
import {
	getStyleState,
	postprocessProperties,
	readDomChanges,
	getTransformValues,
} from "./read/read";

export const getAnimations = (
	chunkState: ChunkState,
	elementState: ElementState,
	totalRuntime: number
) => {
	const changeTimings = updateChangeTimings(
		chunkState.getAllKeyframes(),
		chunkState.getAllOptions(),
		totalRuntime
	);
	const changeProperties = updateChangeProperties(chunkState.getAllKeyframes());

	const styleState = getStyleState(
		postprocessProperties(
			readDomChanges({
				elementState: elementState,
				getKeyframes: (element: HTMLElement) =>
					chunkState.getKeyframes(element),
				changeTimings,
				changeProperties,
			})
		)
	);

	const elementAnimations: Animation[] = [];
	const callbackAnimations: Animation[] = [];

	elementState.getAllElements().forEach((element) => {
		const easingTable = calculateEasingMap(
			elementState.isMainElement(element)
				? chunkState.getOptions(element)
				: getDependecyOptions(element, elementState, chunkState),
			totalRuntime
		);
		const elementProperties = styleState.getElementProperties(element)!;

		if (element.tagName === "IMG") {
			elementAnimations.push(
				...calculateNewImage(
					element as HTMLImageElement,
					styleState,
					easingTable,
					totalRuntime
				)
			);
		} else {
			elementAnimations.push(
				new Animation(
					new KeyframeEffect(
						element,
						constructKeyframes(
							getTransformValues(
								element,
								styleState,
								changeTimings,
								changeProperties
							),
							{
								easingTable,
								borderRadiusTable: getBorderRadius(elementProperties),
								opacityTable: getOpacity(elementProperties),
								filterTable: getFilter(elementProperties),
								userTransformTable: getUserTransforms(
									element,
									changeTimings,
									elementState.isMainElement(element)
										? chunkState.getKeyframes(element)
										: undefined
								),
							}
						),
						totalRuntime
					)
				)
			);
		}
	});

	elementState.getMainElements().forEach((element) => {
		chunkState.getAllCallbacks().forEach(({ offset, callback }) => {
			const animation = new Animation(
				new KeyframeEffect(element, null, offset * totalRuntime)
			);
			animation.onfinish = callback;
			callbackAnimations.push(animation);
		});
	});

	return elementAnimations.concat(callbackAnimations);
};
