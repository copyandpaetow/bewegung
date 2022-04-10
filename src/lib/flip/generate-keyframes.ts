import { Context } from "../core/create-context";
import { Timeline } from "./calculate-timeline";
import { Flip } from "./create-flip-engine";

export const generateKeyframes =
	(key: HTMLElement, context: Context, timings: Timeline) =>
	(value: Flip): Flip => {
		const keyframes = value.dimensionDifferences.map((keyframe) => {
			const { offset, ...difference } = keyframe;
			const { heightDifference, widthDifference, xDifference, yDifference } =
				difference;
			const easing =
				timings.find((timelineEntry) => timelineEntry.start === offset)
					?.easing || "ease";

			const additionalAnimationEntries = value.keyframeInstance
				.getKeyframes()
				.find((entry) => entry.computedOffset === offset);

			const userTransforms = additionalAnimationEntries?.transform || "";
			const userOpacity = additionalAnimationEntries?.opacity;
			const userBlur = additionalAnimationEntries?.blur;

			return {
				offset,
				transform: `${userTransforms} translate(${xDifference}px, ${yDifference}px) scale(${widthDifference}, ${heightDifference})`,
				easing,
				...(userOpacity && { opacity: userOpacity }),
				...(userBlur && { blur: userBlur }),
			} as Keyframe;
		});

		const kfeOptions = value.keyframeInstance.getComputedTiming();
		const newKFE = new KeyframeEffect(key, keyframes, {
			...kfeOptions,
			duration: context.totalRunTime,
		});

		return { ...value, keyframeInstance: newKFE };
	};
