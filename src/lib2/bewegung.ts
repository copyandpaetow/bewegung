import { animationFactory } from "./animation";
import { applyCSSStyles } from "./main-thread/apply-styles";
import { restoreOriginalStyle } from "./main-thread/css-resets";
import { unifyPropStructure, updateUserInput } from "./main-thread/normalize-props";
import { getSelectors } from "./main-thread/update-state";
import { reactivity } from "./main-thread/watch-changes";
import { stateDefinition } from "./shared/constants";
import { getWorker, useWorker } from "./shared/use-worker";
import {
	AllPlayStates,
	AnimationFactory,
	BewegungAPI,
	BewegungProps,
	CustomKeyframeEffect,
	MainMessages,
	WorkerMessages,
} from "./types";

const allWorker = getWorker();

/*
# timekeeper
- callbacks
- keep and restore progress

maybe it would be nicer to move the complexity somehwere else, currently its really crowded and repetitive


*/

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: AnimationFactory;
	#playState: AllPlayStates = "idle";
	#worker: Worker;
	#userInput: CustomKeyframeEffect[];
	#unobserveReactivity = () => {};

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#worker = allWorker.current();
		this.#userInput = unifyPropStructure(bewegungProps);
		this.#state = animationFactory(
			this.#userInput,
			useWorker<MainMessages, WorkerMessages>(this.#worker)
		);
	}

	async #addReactivity() {
		const result = await this.#state.results();
		this.#unobserveReactivity = reactivity(result, getSelectors(this.#userInput), {
			onDimensionOrPositionChange: () => {
				this.#unobserveReactivity();
				this.#state.invalidateDomChanges();
			},
			onSecondaryElementChange: (elements) => {
				this.#unobserveReactivity();
				elements.forEach((element) => result.translation.delete(element));
				this.#state.invalidateGeneralState();
			},
			onMainElementChange: (removedElements, addedElements) => {
				this.#unobserveReactivity();
				this.#userInput = updateUserInput(this.#userInput, removedElements, addedElements);
				this.#state = animationFactory(
					this.#userInput,
					useWorker<MainMessages, WorkerMessages>(this.#worker)
				);
			},
		});
	}

	#updatePlayState(
		newState: AllPlayStates,
		onStateChange?: (oldState: AllPlayStates, newState: AllPlayStates) => void
	) {
		const oldState = this.#playState;
		this.#playState = stateDefinition[oldState][newState] ?? oldState;

		if (this.#playState === oldState) {
			return;
		}
		onStateChange?.(oldState, this.#playState);
	}

	#onStart() {}

	async precalc() {
		await this.#state.results();
		this.#addReactivity();
		return this;
	}

	async play() {
		const { animations, onStart } = await this.#state.results();

		this.#updatePlayState("running", (oldState) => {
			if (oldState === "idle") {
				onStart.forEach((cb) => cb());
			}
		});

		animations.forEach((animation) => {
			animation.play();
		});

		console.log(`it took ${Date.now() - this.#now}ms`);
	}
	async pause() {
		const { animations } = await this.#state.results();
		this.#updatePlayState("paused");

		animations.forEach((animation) => {
			animation.pause();
		});
		this.#addReactivity();
	}
	async scroll(progress: number, done?: boolean) {
		const { animations, onStart, totalRuntime } = await this.#state.results();

		this.#updatePlayState("scrolling", (oldState) => {
			if (oldState === "idle") {
				onStart.forEach((cb) => cb());
			}
		});

		if (done) {
			this.finish();
			return;
		}
		const currentFrame =
			-1 * Math.min(Math.max(progress, 0.001), done === undefined ? 1 : 0.999) * totalRuntime;

		animations.forEach((animation) => {
			animation.currentTime = currentFrame;
		});
	}
	async reverse() {
		const { animations, onStart } = await this.#state.results();

		this.#updatePlayState("running", (oldState) => {
			if (oldState === "idle") {
				onStart.forEach((cb) => cb());
			}
		});

		animations.forEach((animation) => {
			animation.reverse();
		});
	}
	async cancel() {
		const { animations, resets } = await this.#state.results();
		this.#updatePlayState("finished");

		animations.forEach((animation) => {
			animation.cancel();
		});
		resets.forEach(restoreOriginalStyle);
	}
	async finish() {
		const { animations } = await this.#state.results();
		this.#updatePlayState("finished");

		animations.forEach((animation) => {
			animation.finish();
		});
	}
	async commitStyles() {
		if (this.#playState === "idle") {
			const styles = await this.#state.styleResultsOnly();
			styles.forEach(applyCSSStyles);
			this.#updatePlayState("finished");
			return;
		}
		await this.finish();
	}
	async updatePlaybackRate(rate: number) {
		const { animations } = await this.#state.results();
		animations.forEach((animation) => {
			animation.updatePlaybackRate(rate);
		});
	}

	get playState() {
		if (["scrolling", "reversing"].includes(this.#playState)) {
			return "running";
		}
		if (["running", "finished", "paused"].includes(this.#playState)) {
			return this.#playState as AnimationPlayState;
		}

		return "idle" as AnimationPlayState;
	}

	get finished() {
		return this.#state
			.results()
			.then(({ animations }) => {
				return Array.from(animations.values(), (animation) => animation.finished);
			})
			.then((animationPromises) => {
				return Promise.all(animationPromises);
			});
	}
}
