import { getAnimationStateMachine } from "./animation";
import { calculateTotalRuntime, computeTimeline, normalizeProps } from "./normalize-props";
import { BewegungsBlock, BewegungsConfig } from "./types";

const isReduced = () => window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

export const bewegung2 = (props: BewegungsBlock[], globalConfig?: BewegungsConfig) => {
	//TODO: This could be part of the web worker but these function are so small, the transfer is like longer
	const normalizedProps = normalizeProps(props, globalConfig);
	const totalRuntime = calculateTotalRuntime(normalizedProps);
	const timeline = computeTimeline(normalizedProps, totalRuntime);
	const machine = getAnimationStateMachine(normalizedProps, totalRuntime, timeline);

	if (isReduced()) {
		machine.transition("finish");
		return;
	}

	machine.transition("play");

	return {
		play() {
			machine.transition("play");
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
