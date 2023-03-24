import { animationFactory } from "./animation";
import { applyCSSStyles } from "./main-thread/apply-styles";
import { restoreOriginalStyle } from "./main-thread/css-resets";
import { unifyPropStructure, updateUserInput } from "./main-thread/normalize-props";
import { getSelectors } from "./main-thread/update-state";
import { reactivity } from "./main-thread/watch-changes";
import { getPlayState } from "./play-state";
import { stateDefinition } from "./shared/constants";
import { getWorker, useWorker } from "./shared/use-worker";
import {
	AllPlayStates,
	AnimationFactory,
	BewegungAPI,
	BewegungProps,
	CustomKeyframeEffect,
	MainMessages,
	PlayStateManager,
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
	#playStateManager: PlayStateManager;
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
		this.#playStateManager = getPlayState(this.#state);
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

	async precalc() {
		await this.#state.results();
		this.#addReactivity();
		return this;
	}

	async play() {
		await this.#playStateManager.next("running");

		console.log(`it took ${Date.now() - this.#now}ms`);
	}
	async pause() {
		await this.#playStateManager.next("paused");
		this.#addReactivity();
	}
	async scroll(progress: number, done: boolean = false) {
		await this.#playStateManager.next("paused", { progress, done });
	}
	async reverse() {
		await this.#playStateManager.next("reversing");
	}
	async cancel() {
		await this.#playStateManager.next("finished");
	}
	async finish() {
		await this.#playStateManager.next("finished");
	}
	async commitStyles() {
		await this.#playStateManager.next("finished");
	}
	async updatePlaybackRate(rate: number) {
		await this.#playStateManager.next("finished");
	}

	get playState() {
		if (["scrolling", "reversing"].includes(this.#playStateManager.current())) {
			return "running";
		}
		if (["running", "finished", "paused"].includes(this.#playStateManager.current())) {
			return this.#playStateManager.current() as AnimationPlayState;
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
