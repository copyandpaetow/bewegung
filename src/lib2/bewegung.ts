import {
	getStyleState,
	postprocessProperties,
	readDomChanges,
	StyleState,
} from "./calculate-dom-changes";
import { formatInputs } from "./convert-input-to-chunks";
import { getAnimations } from "./get-animations";
import { callbackState } from "./get-callback-state";
import { ChunkState, getChunkState, mapKeysToChunks } from "./get-chunk-state";
import { calculateContext } from "./get-context";
import {
	ElementState,
	findAffectedAndDependencyElements,
	getElementState,
} from "./get-element-state";
import { logCalculationTime } from "./logger";
import { normalizeChunks } from "./normalize-chunks";
import { BewegungProps, BewegungTypes, Chunks, Context } from "./types";
import { ObserveBrowserResize } from "./watch-resize";
import { ObserveDimensionChange } from "./watch-dimension-changes";
import { ObserveDomMutations } from "./watch-dom-mutations";

export class Bewegung implements BewegungTypes {
	#now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		this.#prepareInput(formatInputs(...bewegungProps));
	}

	//required
	#input: Chunks[] = [];
	#animations: Animation[] = [];
	#disconnectReactivity: VoidFunction = () => {};
	#beforeAnimationCallbacks = callbackState();
	#afterAnimationCallbacks = callbackState();

	//recalc friendly
	#context: Context;
	#elementState: ElementState;
	#chunkState: ChunkState;
	#styleState: StyleState;

	#currentTime = 0;
	#progressTime = 0;

	playState: AnimationPlayState = "idle";
	finished: Promise<Animation[]>;

	#prepareInput(chunks: Chunks[]) {
		this.#context = calculateContext(chunks);
		this.#input = normalizeChunks(chunks, this.#context.totalRuntime);
		this.#chunkState = getChunkState(mapKeysToChunks(this.#input));
		this.#elementState = getElementState(
			findAffectedAndDependencyElements(this.#input)
		);
		this.#setAnimations();
	}

	#setAnimations() {
		this.#styleState = getStyleState(
			postprocessProperties(
				readDomChanges(this.#chunkState, this.#elementState, this.#context)
			)
		);

		const { animations, runAfterAnimation, runBeforeAnimation } = getAnimations(
			{
				context: this.#context,
				elementState: this.#elementState,
				chunkState: this.#chunkState,
				styleState: this.#styleState,
			}
		);

		this.#animations = animations;
		this.#beforeAnimationCallbacks.set(runBeforeAnimation);
		this.#afterAnimationCallbacks.set(runAfterAnimation);

		logCalculationTime(this.#now);
		this.#setCallbacks();

		queueMicrotask(() => {
			this.#makeReactive();
		});
	}

	#setCallbacks() {
		this.finished = Promise.all(
			this.#animations.map((animation) => animation.finished)
		);

		this.finished.then(() => {
			this.#afterAnimationCallbacks.execute();
		});
	}

	#cancelExistingAnimations() {
		this.#animations.forEach((waapi) => {
			waapi.cancel();
		});
	}

	#makeReactive() {
		if (this.playState === "running") {
			return;
		}

		this.#disconnectReactivity?.();

		let resizeIdleCallback: NodeJS.Timeout | undefined;
		const priorityMap = new Map<
			"recalcInput" | "recalcAnimation",
			VoidFunction
		>();

		const throttledCallback = () => {
			const callback =
				priorityMap.get("recalcInput") ??
				priorityMap.get("recalcAnimation") ??
				(() => undefined);

			resizeIdleCallback && clearTimeout(resizeIdleCallback);
			resizeIdleCallback = setTimeout(() => {
				callback();
				priorityMap.clear();
			}, 100);
		};

		const resumeAfterRecalc = (recalculation: VoidFunction) => {
			this.#now = performance.now();
			this.#disconnectReactivity?.();
			if (this.playState !== "idle") {
				this.#keepProgress();
				this.#afterAnimationCallbacks.execute();
				this.#cancelExistingAnimations();
			}

			recalculation();

			if (this.playState !== "idle") {
				this.#beforeAnimationCallbacks.execute();
			}
			this.#setAnimationProgress();
		};

		const observeDOM = ObserveDomMutations(this.#input, (changes: Chunks[]) => {
			priorityMap.set("recalcInput", () =>
				resumeAfterRecalc(() => {
					this.#prepareInput(changes);
				})
			);

			throttledCallback();
		});

		const observeResize = ObserveBrowserResize(
			this.#elementState.getAllElements(),
			() => {
				priorityMap.set("recalcAnimation", () =>
					resumeAfterRecalc(() => {
						this.#setAnimations();
					})
				);

				throttledCallback();
			}
		);

		const observeDimensions = ObserveDimensionChange(
			this.#chunkState,
			this.#elementState,
			this.#styleState,
			() => {
				priorityMap.set("recalcAnimation", () =>
					resumeAfterRecalc(() => {
						this.#setAnimations();
					})
				);

				throttledCallback();
			}
		);

		this.#disconnectReactivity = () => {
			observeDOM?.disconnect();
			observeResize?.disconnect();
			observeDimensions?.disconnect();
		};
	}

	#keepProgress() {
		const currentTime = this.#animations[0].currentTime ?? 0;
		if (this.playState === "running") {
			this.#currentTime = performance.now();
			this.#progressTime = currentTime;
		}

		if (this.playState === "paused") {
			this.#currentTime = 0;
			this.#progressTime = currentTime;
		}
	}

	#setAnimationProgress() {
		let progress = this.#progressTime;
		if (this.#currentTime !== 0) {
			progress += performance.now() - this.#currentTime;
		}
		this.#animations.forEach((waapi) => {
			waapi.currentTime = progress;
		});
	}

	play() {
		this.playState = "running";
		this.#disconnectReactivity?.();
		this.#beforeAnimationCallbacks.execute();

		this.#animations.forEach((waapi) => {
			waapi.play();
		});
	}

	scroll() {
		this.playState = "running";
		this.#disconnectReactivity?.();
		this.#beforeAnimationCallbacks.execute();

		return (progress: number, done?: boolean) => {
			if (done) {
				return;
			}

			const currentFrame =
				-1 *
				Math.min(Math.max(progress, 0.001), done === undefined ? 1 : 0.999) *
				this.#context.totalRuntime;

			this.#animations.forEach((waapi) => {
				waapi.currentTime = currentFrame;
			});
			this.#progressTime = currentFrame;
		};
	}

	pause() {
		this.playState = "paused";
		this.#keepProgress();
		this.#animations.forEach((waapi) => {
			waapi.pause();
		});
		this.#makeReactive();
	}

	reverse() {
		this.playState = "running";
		this.#disconnectReactivity?.();
		this.#beforeAnimationCallbacks.execute();
		this.#animations.forEach((waapi) => {
			waapi.reverse();
		});
	}
	cancel() {
		this.playState = "finished";
		this.#elementState
			.getAllElements()
			.forEach(
				(element) =>
					(element.style.cssText = this.#styleState.getOriginalStyle(element)!)
			);

		this.#animations.forEach((waapi) => {
			waapi.cancel();
		});
	}
	commitStyles() {
		this.playState = "finished";
		this.#animations.forEach((waapi) => {
			waapi.commitStyles();
		});
	}
	finish() {
		this.playState = "finished";
		this.#animations.forEach((waapi) => {
			waapi.finish();
		});
	}

	updatePlaybackRate(newPlaybackRate: number) {
		this.#animations.forEach((waapi) => {
			waapi.updatePlaybackRate(newPlaybackRate);
		});
	}
}
