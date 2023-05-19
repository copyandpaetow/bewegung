import { getAnimationStateMachine } from "./main-thread/animation-state-machine";
import { normalizeProps } from "./main-thread/normalize-props";
import { AllPlayStates, BewegungsConfig, BewegungsInputs } from "./types";

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

? What should the reactivity include?
- easiest would be to check (while on pause) if elements changed and if so, to cancel all animations, delete the existing animationState, and recalc everything
- should there also be a preload method?
=> we could split the loading into 1) observing the dom and 2) creating the animations
=> that would add some complexity to the state machine

Improvements
- "at" needs to be more refined
=>  iterations need to be included in the calculations
- options need to be rechecked. Should more be included? 
- counter scaling with combining easings is still an issue

- how to handle the unanimatable properties?
- how to handle user properties for properties we use (transform & clipPath)

if there is an overlap within the sequence, it will create additional easings

*/

export const bewegung2 = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {
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
