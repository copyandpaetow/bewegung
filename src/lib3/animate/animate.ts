import {
	state_calculatedDifferences,
	state_elementProperties,
} from "../calculate/calculate";
import {
	getCallbacks,
	getOptions,
	state_dependencyElements,
	state_affectedElements,
	state_mainElements,
	state_context,
} from "../prepare/prepare";
import { Animate } from "../types";
import { calculateEasingMap } from "./calculate-timeline";
import {
	cancelAnimation,
	commitAnimationStyles,
	finishAnimation,
	getFinishPromise,
	keepProgress,
	pauseAnimation,
	playAnimation,
	reverseAnimation,
	scrollAnimation,
} from "./methods";

//TODO: this could be combined
const getBorderRadius = (
	element: HTMLElement
): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;
	if (styleMap.every((style) => style.computedStyle.borderRadius === "0px")) {
		return false;
	}

	const borderRadiusTable = {};

	styleMap.forEach(
		(style) =>
			(borderRadiusTable[style.offset] = style.computedStyle.borderRadius)
	);

	return borderRadiusTable;
};
//TODO: this could be combined
//TODO: this is impacting performance
const getOpacity = (element: HTMLElement): Record<number, string> | false => {
	const styleMap = state_elementProperties.get(element)!;
	if (styleMap.every((style) => style.computedStyle.opacity === "1")) {
		return false;
	}

	const opacityTable = {};

	styleMap.forEach(
		(style) => (opacityTable[style.offset] = style.computedStyle.opacity)
	);

	return opacityTable;
};

export const animate = (): Animate => {
	const { totalRuntime } = state_context;
	const elementAnimations: Animation[] = [];
	const callbackAnimations: Animation[] = [];

	state_affectedElements.forEach((element) => {
		const options: ComputedEffectTiming[] = [];

		state_dependencyElements
			.get(element)!
			.forEach((element) =>
				getOptions(element).forEach((option) => options.push(option))
			);

		const easingTable = calculateEasingMap(options, totalRuntime);
		const borderRadiusTable = getBorderRadius(element);

		//TODO: if the user supplied non-layout styles like color or opacity, or rotate they need to be added here as well
		const keyframes = state_calculatedDifferences.get(element)!.map(
			({
				xDifference,
				yDifference,
				widthDifference,
				heightDifference,
				offset,
			}) =>
				({
					offset,
					composite: "auto",
					easing: easingTable[offset],
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
					...(borderRadiusTable && {
						clipPath: `inset(0px round ${borderRadiusTable[offset]})`,
					}),
				} as Keyframe)
		);

		elementAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	state_mainElements.forEach((element) => {
		const easingTable = calculateEasingMap(getOptions(element), totalRuntime);
		const borderRadiusTable = getBorderRadius(element);
		const opacityTable = getOpacity(element);

		const keyframes = state_calculatedDifferences.get(element)!.map(
			({
				xDifference,
				yDifference,
				widthDifference,
				heightDifference,
				offset,
			}) =>
				({
					offset,
					composite: "auto",
					easing: easingTable[offset],
					transform: `translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
					...(borderRadiusTable && {
						clipPath: `inset(0px round ${borderRadiusTable[offset]})`,
					}),
					...(opacityTable && {
						opacity: `${opacityTable[offset]}`,
					}),
				} as Keyframe)
		);

		getCallbacks(element)?.forEach(({ offset, callback }) => {
			const animation = new Animation(
				new KeyframeEffect(element, null, offset * totalRuntime)
			);
			animation.onfinish = callback;
			callbackAnimations.push(animation);
		});

		elementAnimations.push(
			new Animation(new KeyframeEffect(element, keyframes, totalRuntime))
		);
	});

	const allAnimations = [...elementAnimations, ...callbackAnimations];
	const prefixedScrollAnimation = scrollAnimation(allAnimations);

	return {
		playAnimation: () => playAnimation(allAnimations),
		pauseAnimation: () => pauseAnimation(allAnimations),
		keepProgress: () => keepProgress(elementAnimations[0]),
		scrollAnimation: (progress: number, done?: boolean) =>
			prefixedScrollAnimation(progress, done),
		reverseAnimation: () => reverseAnimation(allAnimations),
		cancelAnimation: () => cancelAnimation(allAnimations),
		commitAnimationStyles: () => commitAnimationStyles(allAnimations),
		updatePlaybackRate: (newPlaybackRate: number) =>
			allAnimations.forEach((animation) =>
				animation.updatePlaybackRate(newPlaybackRate)
			),
		finishAnimation: () => finishAnimation(allAnimations),
		finishPromise: getFinishPromise(allAnimations),
	};
};
