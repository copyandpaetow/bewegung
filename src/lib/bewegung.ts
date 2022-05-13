import { Context, createContext } from "./core/create-context";
import { filterHiddenElements } from "./core/main-filter-hidden-elements";
import { includeAffectedElements } from "./core/main-include-affected-elements";
import { readDimensions } from "./core/main-read-dimensions";
import { updateMissingDimensions } from "./core/main-update-missing-dimensions";
import { addAnimationEngine } from "./core/main-add-animation-engine";
import {
	addMissingDefaults,
	arrayifyInputs,
	createInternalStructure,
	expandTargetsIntoEntries,
} from "./core/normalize-inputs";
import {
	CustomKeyframe,
	CustomKeyframeArrayValueSyntax,
	ElementOrSelector,
	Options,
	VoidCallback,
} from "./types";
import { pipe } from "./utils/pipe";

const createAnimations = (
	context: Context,
	animationInputs: NormalizedInput[]
) =>
	pipe(
		includeAffectedElements(context),
		readDimensions(context),
		filterHiddenElements,
		updateMissingDimensions,
		addAnimationEngine(context)
	)(animationInputs);

const logCalculationTime = (startingTime: number) => {
	const end = performance.now() - startingTime;
	if (end < 50) {
		console.log(`animation calculation was fast with ${end}ms`);
	}
	if (end > 50) {
		console.warn(`animation calculation was slow with ${end}ms`);
	}
	if (end > 100) {
		console.error(
			`animation calculation was so slow that the user might notice with ${end}ms`
		);
	}
};

export interface NormalizedInput {
	keyframeInstance: KeyframeEffect;
	unAnimatableStyles: Omit<CustomKeyframe, "callback">[] | null;
	extraOptions: Partial<
		Pick<
			Options,
			| "onAnimationStart"
			| "onAnimationEnd"
			| "onAnimationPause"
			| "onAnimationCancel"
		>
	> | null;
	callbacks: { offset: number; callback: VoidCallback }[] | null;
}

export type CustomKeyframeEffect = [
	target: ElementOrSelector,
	keyframes: CustomKeyframe | CustomKeyframe[] | CustomKeyframeArrayValueSyntax,
	options?: number | Options
];

export const bewegung = (
	...animationInput:
		| CustomKeyframeEffect
		| (CustomKeyframeEffect | KeyframeEffect)[]
) => {
	const start = performance.now();

	const normalizedInputs: NormalizedInput[] = pipe(
		arrayifyInputs,
		expandTargetsIntoEntries,
		createInternalStructure,
		addMissingDefaults
	)(animationInput);

	const context = createContext(normalizedInputs);

	let animations = createAnimations(context, normalizedInputs);

	console.log({ animations });
	const readyPromise = Promise.all(
		Array.from(animations.values()).map((anim) => anim._animationInstance.ready)
	);
	const finishPromise = Promise.all(
		Array.from(animations.values()).map(
			(anim) => anim._animationInstance.finished
		)
	);

	const isPending = Array.from(animations.values()).some(
		(anim) => anim._animationInstance.pending
	);

	logCalculationTime(start);
	return Object.freeze({
		ready: readyPromise,
		finished: finishPromise,
		pending: isPending,
		play: () => {
			animations.forEach((value) => {
				value.play();
			});
		},
		reverse: () => {
			animations.forEach((value) => {
				value.play("reverse");
			});
		},
		pause: () => {
			animations.forEach((value) => {
				value.pause();
			});
		},
		scroll: (progress: number, done?: boolean) => {
			animations.forEach((value) => {
				value.scroll(progress, done);
			});
		},
		refresh: () => {
			animations = createAnimations(context, normalizedInputs);
		},

		finish: () => {
			animations.forEach((value) => {
				value.finish();
			});
		},
		cancel: () => {
			animations.forEach((value) => {
				value.cancel();
			});
		},
		commitStyles: () => {
			animations.forEach((value) => {
				value.commitStyles();
			});
		},
		updatePlaybackRate: (playbackRate: number) => {
			animations.forEach((value) => {
				value.updatePlaybackRate(playbackRate);
			});
		},
	});
};
