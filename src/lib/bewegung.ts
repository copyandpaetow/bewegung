import { logCalculationTime } from "./logger";
import { normalizeProps } from "./normalize-props/props";
import { getCallbackState } from "./prepare-input/callback-state";
import { getChunkState, mapKeysToChunks } from "./prepare-input/chunk-state";
import { calculateContext } from "./prepare-input/context";
import {
	findAffectedAndDependencyElements,
	getElementState,
} from "./prepare-input/element-state";
import { normalizeChunks } from "./prepare-input/normalize-chunks";
import { getPlayState, PlayState } from "./prepare-input/play-state";
import { getAnimations } from "./set-animations/animations";
import {
	readDomChanges,
	restoreOriginalStyle,
} from "./set-animations/read-dom";
import {
	getStyleState,
	postprocessProperties,
} from "./set-animations/style-state";
import {
	BewegungAPI,
	BewegungProps,
	CallbackState,
	Chunks,
	ChunkState,
	Context,
	ElementState,
	StyleState,
	ValueOf,
} from "./types";
import { watchChanges } from "./watch/all-changes";

export class Bewegung implements BewegungAPI {
	#now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		this.#prepareInput(normalizeProps(...bewegungProps));
	}

	//required
	#input: Chunks[];
	#animations: Animation[];
	#disconnectReactivity: VoidFunction;

	//recalc friendly
	#context: Context;
	#elementState: ElementState;
	#chunkState: ChunkState;
	#styleState: StyleState;
	#callbackState: CallbackState;
	#playState: PlayState;

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
		this.#callbackState = getCallbackState(
			runBeforeAnimation,
			runAfterAnimation
		);

		this.#setCallbacks();
	}

	#setCallbacks() {
		this.#playState = getPlayState({
			animations: this.#animations,
			callbackState: this.#callbackState,
			updateFinishPromise: (promise: Promise<Animation[]>) =>
				(this.finished = promise),
			updatePlayState: (state: AnimationPlayState) => (this.playState = state),
		});
		this.finished = Promise.all(
			this.#animations.map((animation) => animation.finished)
		);

		logCalculationTime(this.#now);

		queueMicrotask(() => {
			this.#makeReactive();
		});

		this.finished.then(() => {
			this.#callbackState.executeAfterAnimationEnds();
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
				this.#callbackState.executeAfterAnimationEnds();
				this.#cancelExistingAnimations();
			}

			recalculation();

			if (this.playState !== "idle") {
				this.#callbackState.executeBeforeAnimationStart();
			}
			this.#setAnimationProgress();
		};

		this.#disconnectReactivity = watchChanges(
			{
				input: this.#input,
				elementState: this.#elementState,
				chunkState: this.#chunkState,
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
		this.#callbackState.executeBeforeAnimationStart();

		this.#animations.forEach((waapi) => {
			waapi.play();
		});
	}

	scroll() {
		this.playState = "running";
		this.#disconnectReactivity?.();
		this.#callbackState.executeBeforeAnimationStart();

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
		this.#callbackState.executeBeforeAnimationStart();

		this.#animations.forEach((waapi) => {
			waapi.reverse();
		});
	}
	cancel() {
		this.playState = "finished";
		this.#elementState
			.getMainElements()
			.forEach((element) =>
				restoreOriginalStyle(
					element,
					this.#styleState.getOriginalStyle(element)!
				)
			);

		this.#animations.forEach((waapi) => {
			waapi.cancel();
		});
	}
	commitStyles() {
		this.playState = "finished";
		this.#callbackState.executeBeforeAnimationStart();
		this.#callbackState.executeAfterAnimationEnds();
		this.finished = Promise.resolve([]);
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
