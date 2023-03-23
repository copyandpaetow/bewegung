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

	machine.transition("load");

	return {
		play() {
			machine.transition("load");
		},
		pause() {
			machine.transition("pause");
		},
		scroll(scrollAmount: number) {
			machine.transition("scroll", { scrollAmount });
		},
		cancel() {
			machine.transition("cancel");
		},
		finish() {
			machine.transition("finish");
		},
		get finished() {
			return Promise.resolve();
		},
	};
};
