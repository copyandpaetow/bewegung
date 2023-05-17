import { getAnimationStateMachine } from "./main-thread/animation-state-machine";
import { normalizeProps } from "./main-thread/normalize-props";
import { AllPlayStates, BewegungsConfig, BewegungsEntry } from "./types";

export type Bewegung = {
	play(): void;
	pause(): void;
	scroll(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Animation>;
	playState: AllPlayStates;
};

/*
TODO:

- "at" needs to be more refined
=>  iterations need to be included in the calculations
- options need to be rechecked. Should more be included? 
- counter scaling with combining easings is still an issue

- how to handle the unanimatable properties?
- how to handle user properties for properties we use (transform & clipPath)

if there is an overlap within the sequence, it will create additional easings
? should these be used in the keyframes? Should there be another readout for that timing?

- reactivity
*/

export const bewegung2 = (props: BewegungsEntry[], config?: BewegungsConfig): Bewegung => {
	const { callbacks, totalRuntime } = normalizeProps(props, config);
	const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));
	const machine = getAnimationStateMachine(callbacks, totalRuntime, timekeeper);

	timekeeper.onfinish = () => machine.transition("finish");
	timekeeper.oncancel = () => machine.transition("cancel");

	return {
		play() {
			machine.transition("play");
		},
		pause() {
			machine.transition("pause");
		},
		scroll(scrollAmount: number, done = false) {
			machine.transition("scroll", { scrollAmount, done });
		},
		cancel() {
			machine.transition("cancel");
		},
		finish() {
			machine.transition("finish");
		},
		get finished() {
			return timekeeper.finished;
		},
		get playState() {
			return machine.state();
		},
	};
};
