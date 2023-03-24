import { getAnimationStateMachine } from "./animation";
import { createContext } from "./normalize-props";
import { BewegungsBlock, BewegungsConfig } from "./types";

const isReduced = () => window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

export const bewegung2 = (props: BewegungsBlock[], globalConfig?: BewegungsConfig) => {
	const machine = getAnimationStateMachine(createContext(props, globalConfig));

	if (isReduced()) {
		machine.transition("finish");
		return;
	}

	return {
		play() {
			machine.transition("play");
		},
		pause() {
			machine.transition("pause");
		},
		scroll(scrollAmount: number, done = false) {
			machine.transition("load", { scrollAmount, done, nextPlayState: "scroll" });
		},
		cancel() {
			machine.transition("cancel");
		},
		finish() {
			machine.transition("finish");
		},
		get finished() {
			//TODO: THis needs to be better
			return Promise.resolve();
		},
	};
};
