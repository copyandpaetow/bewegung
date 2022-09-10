import { logCalculationTime } from "./logger";
import { normalizeProps } from "./normalize-props/props";
import { callbackState } from "./prepare-input/callback-state";
import { calculateContext } from "./prepare-input/context";
import {
	findAffectedAndDependencyElements,
	getElementState,
} from "./prepare-input/element-state";
import { normalizeChunks } from "./prepare-input/normalize-chunks";
import { getAnimations } from "./set-animations/animations";
import { postprocessProperties } from "./set-animations/postprocess-element-properties";
import {
	readDomChanges,
	restoreOriginalStyle,
} from "./set-animations/read-dom";
import { getStyleState } from "./set-animations/style-state";
import {
	BewegungAPI,
	BewegungProps,
	Chunks,
	Context,
	ElementState,
	StyleState,
} from "./types";
import { watchChanges } from "./watch/all-changes";

export class Bewegung implements BewegungAPI {
	#now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		this.#prepareInput(normalizeProps(...bewegungProps));
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
	// #chunkState: ChunkState;
	#styleState: StyleState;

	#currentTime = 0;
	#progressTime = 0;

	playState: AnimationPlayState = "idle";
	finished: Promise<Animation[]>;

	#prepareInput(chunks: Chunks[]) {
		this.#context = calculateContext(chunks);
		this.#input = normalizeChunks(chunks, this.#context.totalRuntime);

		this.#elementState = getElementState(
			findAffectedAndDependencyElements(this.#input)
		);

		this.#setAnimations();
	}

	#setAnimations() {
		this.#styleState = getStyleState(
			postprocessProperties(readDomChanges(this.#elementState, this.#context))
		);

		const { animations, runAfterAnimation, runBeforeAnimation } = getAnimations(
			{
				context: this.#context,
				elementState: this.#elementState,
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
			this.playState = "finished";
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

		this.#disconnectReactivity = watchChanges(
			{
				input: this.#input,
				elementState: this.#elementState,
				styleState: this.#styleState,
			},
			{
				recalcInput: (changes) => {
					resumeAfterRecalc(() => {
						this.#prepareInput(changes);
					});
				},
				recalcAnimations: () => {
					resumeAfterRecalc(() => {
						this.#setAnimations();
					});
				},
			}
		);
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
		this.#elementState.forEach((element, key) =>
			restoreOriginalStyle(element, this.#styleState.getOriginalStyle(key)!)
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
