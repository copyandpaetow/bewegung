import { logCalculationTime } from "./logger";
import { normalizeProps } from "./normalize-props/props";
import { BidirectionalMap } from "./prepare-input/bidirectional-map";
import { callbackState } from "./prepare-input/callback-state";
import { calculateContext } from "./prepare-input/context";
import { createStates } from "./prepare-input/create-states";
import { normalizeChunks } from "./prepare-input/normalize-chunks";
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
	BewegungProps,
	BewegungAPI,
	Chunks,
	ChunkState,
	Context,
	ElementState,
	StyleState,
	Chunk,
	ElementKey,
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
	#elementKeyMap: BidirectionalMap<HTMLElement, string>;
	#elementState: Map<string, ElementKey>;
	#chunkState: Map<string, Chunk>;
	#styleState: StyleState;

	#currentTime = 0;
	#progressTime = 0;

	playState: AnimationPlayState = "idle";
	finished: Promise<Animation[]>;

	#prepareInput(chunks: Chunks[]) {
		this.#context = calculateContext(chunks);
		this.#input = normalizeChunks(chunks, this.#context.totalRuntime);

		const { elementKeyMap, elementState, chunkState } = createStates(
			this.#input
		);

		this.#chunkState = chunkState;
		this.#elementState = elementState;
		this.#elementKeyMap = elementKeyMap;
		this.#setAnimations();
	}

	#setAnimations() {
		this.#styleState = getStyleState(
			postprocessProperties(
				readDomChanges(
					this.#elementKeyMap,
					this.#elementState,
					this.#chunkState,
					this.#context
				)
			)
		);

		const { animations, runAfterAnimation, runBeforeAnimation } = getAnimations(
			{
				elementKeyMap: this.#elementKeyMap,
				elementState: this.#elementState,
				chunkState: this.#chunkState,
				styleState: this.#styleState,
				context: this.#context,
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
