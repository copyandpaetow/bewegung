import {
	StyleState,
	getStyleState,
	postprocessProperties,
	readDomChanges,
} from "./calculate-dom-changes";
import { calculateEasingMap } from "./calculate-easings";
import { calculateImageAnimation } from "./calculate-image-animations";
import { getDependecyOptions } from "./construct-keyframes";
import { formatInputs } from "./convert-input-to-chunks";
import { calculateContext } from "./get-context";
import { ChunkState, getChunkState, mapKeysToChunks } from "./get-chunk-state";
import {
	ElementState,
	getElementState,
	findAffectedAndDependencyElements,
} from "./get-element-state";
import { logCalculationTime } from "./logger";
import { normalizeChunks } from "./normalize-chunks";
import {
	callbackState,
	runBeforeAnimation,
	runAfterAnimation,
} from "./get-callback-state";
import { BewegungTypes, BewegungProps, Chunks, Context } from "./types";
import { getMainAnimation, getCallbackAnimations } from "./get-animations";
import { ObserveBrowserResize } from "./watch-resize";
import { ObserveDimensionChange } from "./watch-dimension-changes";
import { ObserveDomMutations } from "./watch-dom-mutations";

const clamp = (number: number, min = 0, max = 1) =>
	Math.min(Math.max(number, min), max);
export class Bewegung implements BewegungTypes {
	private now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.now = performance.now();
		this.prepareInput(formatInputs(...bewegungProps));
	}

	//required
	private input: Chunks[] = [];
	private animations: Animation[] = [];
	private disconnectReactivity: VoidFunction = () => {};
	private beforeAnimationCallbacks = callbackState();
	private afterAnimationCallbacks = callbackState();

	//recalc friendly
	private context: Context;
	private elementState: ElementState;
	private chunkState: ChunkState;
	private styleState: StyleState;

	private currentTime = 0;
	private progressTime = 0;

	public playState: AnimationPlayState = "idle";
	public finished: Promise<Animation[]>;

	private prepareInput(chunks: Chunks[]) {
		this.context = calculateContext(chunks);
		this.input = normalizeChunks(chunks, this.context.totalRuntime);
		this.chunkState = getChunkState(mapKeysToChunks(this.input));
		this.elementState = getElementState(
			findAffectedAndDependencyElements(this.input)
		);
		this.setAnimations();
	}

	private setAnimations() {
		this.styleState = getStyleState(
			postprocessProperties(
				readDomChanges(this.chunkState, this.elementState, this.context)
			)
		);

		this.elementState.getAllElements().forEach((element) => {
			const calculateEasing = calculateEasingMap(
				this.elementState.isMainElement(element)
					? this.chunkState.getOptions(element)
					: getDependecyOptions(element, this.elementState, this.chunkState),
				this.context.totalRuntime
			);

			if (element.tagName === "IMG") {
				this.animations.push(
					...calculateImageAnimation(
						element as HTMLImageElement,
						this.styleState,
						calculateEasing,
						this.context.totalRuntime,
						this.beforeAnimationCallbacks,
						this.afterAnimationCallbacks
					)
				);
			} else {
				this.animations.push(
					getMainAnimation(
						element,
						this.chunkState,
						this.elementState,
						this.styleState,
						this.context,
						calculateEasing
					)
				);
			}

			this.animations.push(
				...getCallbackAnimations(
					element,
					this.chunkState,
					this.context.totalRuntime
				)
			);
		});

		logCalculationTime(this.now);
		this.setCallbacks();

		queueMicrotask(() => {
			this.makeReactive();
		});
	}

	private setCallbacks() {
		this.beforeAnimationCallbacks.setWithPriority(() =>
			runBeforeAnimation(this.chunkState, this.elementState, this.styleState)
		),
			this.afterAnimationCallbacks.set(() =>
				runAfterAnimation(this.elementState, this.styleState)
			);

		this.finished = Promise.all(
			this.animations.map((animation) => animation.finished)
		);

		this.finished.then(() => {
			this.afterAnimationCallbacks.execute();
		});
	}

	private makeReactive() {
		this.disconnectReactivity?.();
		if (this.playState === "running") {
			return;
		}

		let resizeIdleCallback: NodeJS.Timeout | undefined;

		const throttledCallback = (callback: () => void) => {
			resizeIdleCallback && clearTimeout(resizeIdleCallback);
			resizeIdleCallback = setTimeout(() => {
				callback();
			}, 100);
		};

		// const observeDOM = ObserveDomMutations(this.input, (changes: Chunks[]) => {
		// 	this.prepareInput(changes);
		// });

		// const observeResize = ObserveBrowserResize(
		// 	this.elementState.getAllElements(),
		// 	() => {
		// 		throttledCallback(() => this.setAnimations());
		// 	}
		// );

		// const observeDimensions = ObserveDimensionChange(
		// 	this.chunkState,
		// 	this.elementState,
		// 	this.styleState,
		// 	() => {
		// 		throttledCallback(() => this.setAnimations());
		// 	}
		// );

		this.disconnectReactivity = () => {
			// observeDOM?.disconnect();
			// observeResize?.disconnect();
			// observeDimensions?.disconnect();
		};
	}

	//TODO: this needs some rechecking
	private getProgress() {
		let progress = this.progressTime;
		if (this.currentTime !== 0) {
			progress += performance.now() - this.currentTime;
		}
		return progress;
	}
	//TODO: this needs some rechecking
	private keepProgress() {
		const currentTime = this.animations[0].currentTime ?? 0;
		const playState = this.animations[0].playState;
		if (playState === "running") {
			this.currentTime = performance.now();
			this.progressTime = currentTime;
		}

		if (playState === "paused") {
			this.progressTime = currentTime;
		}
	}

	public play() {
		this.playState = "running";
		this.disconnectReactivity?.();
		this.beforeAnimationCallbacks.execute();

		this.animations.forEach((waapi) => {
			waapi.currentTime = this.getProgress();
			waapi.play();
		});
		this.currentTime = 0;
		this.progressTime = 0;
	}

	public scroll() {
		this.playState = "running";
		this.disconnectReactivity?.();
		this.beforeAnimationCallbacks.execute();

		return (progress: number, done?: boolean) => {
			if (done) {
				return;
			}

			const currentFrame =
				-1 *
				clamp(progress, 0.001, done === undefined ? 1 : 0.999) *
				this.context.totalRuntime;

			this.animations.forEach((waapi) => {
				waapi.currentTime = currentFrame;
			});
			this.progressTime = currentFrame;
		};
	}

	public pause() {
		this.playState = "paused";
		this.progressTime = this.animations[0].currentTime ?? 0;
		this.animations.forEach((waapi) => {
			waapi.pause();
		});
		return;
	}

	public reverse() {
		this.playState = "running";
		this.disconnectReactivity?.();
		this.beforeAnimationCallbacks.execute();
		this.animations.forEach((waapi) => {
			waapi.reverse();
		});
	}
	public cancel() {
		this.playState = "finished";
		this.elementState
			.getAllElements()
			.forEach(
				(element) =>
					(element.style.cssText = this.styleState.getOriginalStyle(element)!)
			);

		this.animations.forEach((waapi) => {
			waapi.cancel();
		});
	}
	public commitStyles() {
		this.playState = "finished";
		this.animations.forEach((waapi) => {
			waapi.commitStyles();
		});
	}
	public finish() {
		this.playState = "finished";
		this.animations.forEach((waapi) => {
			waapi.finish();
		});
	}

	public updatePlaybackRate(newPlaybackRate: number) {
		this.animations.forEach((waapi) => {
			waapi.updatePlaybackRate(newPlaybackRate);
		});
	}
}
