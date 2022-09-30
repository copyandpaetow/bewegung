import { getAnimations } from "./animation";
import { normalizeProps } from "./normalize/structure";
import { AnimationsAPI, BewegungAPI, BewegungProps } from "./types";

export class bewegung implements BewegungAPI {
	#animation: AnimationsAPI;
	#now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		this.#animation = getAnimations(normalizeProps(...bewegungProps));
		console.log(`calculation took ${performance.now() - this.#now}ms`);
	}

	get playState() {
		return this.#animation.playState;
	}

	get finished() {
		return this.#animation.finished;
	}

	play() {
		this.#animation.play();
	}
	pause() {}
	scroll() {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate() {}
}
