import { Context } from "../core/create-context";
import { generateDifferences } from "./generate-difference-map";
import { getEdgeCaseStylings } from "./generate-edgecase-styling";
import { applyStyles, extractStylesRules } from "./apply-element-styles";
import { generateKeyframes } from "./generate-keyframes";
import { getTimingsFromElements, Timeline } from "./calculate-timeline";
import { findReferenceIndex } from "./find-reference-index";
import { FlipMode, getFlipModes } from "./calculate-flipmode";
import { toArray } from "../utils/array-helpers";
import { pipe } from "../utils/pipe";
import { clamp } from "../utils/number-helpers";
import { registerMidAnimationCallbacks } from "./register-callback";
import { ReadDimensions } from "../core/main-read-dimensions";

export interface FlipReturnMethods {
	play: (direction?: "play" | "reverse") => void;
	pause: () => void;
	scroll: (progress: number, done?: boolean) => void;
	finish: () => void;
	cancel: () => void;
	commitStyles: () => void;
	updatePlaybackRate: (playbackRate: number) => void;
	_animationInstance: Animation;
}

export type DimensionDifferences = {
	heightDifference: number;
	widthDifference: number;
	xDifference: number;
	yDifference: number;
	offset: number;
	easing?: string;
};

export interface Flip extends ReadDimensions {
	dimensionDifferences: DimensionDifferences[];
}

const applyImageStyles = (key: HTMLElement) => {
	if (Array.from(key.children).some((child) => child.tagName === "IMG")) {
		return { overflow: "hidden" };
	}
	return {};
};

export const createFlipEngine = (
	key: HTMLElement,
	value: ReadDimensions,
	animationMap: Map<HTMLElement, ReadDimensions>,
	context: Context
) => {
	const flipMode = getFlipModes(animationMap);
	const referenceIndex = findReferenceIndex(
		flipMode,
		value.calculatedProperties
	);
	const localTimeline = getTimingsFromElements(
		toArray(value.affectedByElements),
		animationMap,
		context.totalRunTime
	);
	const timelineWithCorrectEasing = localTimeline.reduce(
		(accumulator, current, index, array) => {
			const { start, end } = current;
			const nextIndex = array[index + 1] ? index + 1 : index;
			const nextEasing = array[nextIndex].easing;

			return [...accumulator, { start, end, easing: nextEasing }];
		},
		[] as Timeline
	);

	const updateKeyframes = pipe(
		generateDifferences(key, animationMap, context, referenceIndex),
		generateKeyframes(key, context, timelineWithCorrectEasing)
	)(value);

	const mainAnimation = new Animation(updateKeyframes.keyframeInstance);
	const animations = [
		...registerMidAnimationCallbacks(key, updateKeyframes),
		mainAnimation,
	];

	mainAnimation.onfinish = () => {
		key.style.cssText = value.originalStyle;
		applyStyles(key, {
			...extractStylesRules(value.newStyle),
		});

		value.extraOptions?.onAnimationEnd?.();
	};

	mainAnimation.oncancel = value.extraOptions?.onAnimationCancel?.() ?? null;

	return Object.freeze({
		_animationInstance: mainAnimation,
		play: (direction: "play" | "reverse" = "play") => {
			if (mainAnimation.playState === "idle") {
				applyStyles(key, {
					...(flipMode === FlipMode.applyStyleBeforeAnimation &&
						extractStylesRules(value.newStyle)),
					...(flipMode === FlipMode.combined &&
						getEdgeCaseStylings(key, animationMap)),
					...applyImageStyles(key),
				});
				value.extraOptions?.onAnimationStart?.();
			}
			animations.forEach((anim) => anim[direction]());
		},
		pause: () => {
			animations.forEach((anim) => anim.pause());
			value.extraOptions?.onAnimationPause?.();
		},
		scroll: (progress: number, done?: boolean) => {
			if (mainAnimation.playState === "idle") {
				applyStyles(key, {
					...(flipMode === FlipMode.applyStyleBeforeAnimation &&
						extractStylesRules(value.newStyle)),
					...(flipMode === FlipMode.combined &&
						getEdgeCaseStylings(key, animationMap)),
					...applyImageStyles(key),
				});
				value.extraOptions?.onAnimationStart?.();
			}

			if (done) {
				return;
			}

			const currentFrame =
				-1 *
				clamp(progress, 0.001, done === undefined ? 1 : 0.999) *
				context.totalRunTime;

			animations.forEach((anim) => (anim.currentTime = currentFrame));
		},

		finish: () => animations.forEach((anim) => anim.finish()),

		commitStyles: () => animations.forEach((anim) => anim.commitStyles()),

		cancel: () => animations.forEach((anim) => anim.cancel()),

		updatePlaybackRate: (playbackRate: number) =>
			animations.forEach((anim) => anim.updatePlaybackRate(playbackRate)),
	});
};
