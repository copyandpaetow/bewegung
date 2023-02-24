import { animationFactory } from "./animation";
import { unifyPropStructure, updateUserInput } from "./main-thread/normalize-props";
import { getSelectors } from "./main-thread/update-state";
import { reactivity } from "./main-thread/watch-changes";
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

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: AnimationFactory;
	#playState: {
		current(): AllPlayStates;
		nextState(nextState: AllPlayStates): void;
	};
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
		//this.#playState = createStateMachine(this.#state.getResults());
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

	get playState() {
		// if (["scrolling", "reversing"].includes(this.#playState.current())) {
		// 	return "running";
		// }
		// if (["running", "finished", "paused"].includes(this.#playState.current())) {
		// 	return this.#playState.current() as AnimationPlayState;
		// }

		return "idle" as AnimationPlayState;
	}

	get finished() {
		return Promise.resolve();
	}

	async precalc() {
		await this.#state.results();
		this.#addReactivity();
		return this;
	}

	async play() {
		const { animations, onStart } = await this.#state.results();

		onStart.forEach((cb) => cb());
		animations.forEach((animation) => {
			animation.play();
			//animation.pause();
			// setTimeout(() => {
			// 	animation.pause();
			// }, 1990);
		});
		console.log(`it took ${Date.now() - this.#now}ms`);
	}
	pause() {}
	scroll(progress: number, done?: boolean) {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate(rate: number) {}
}
