import { getAnimationStateMachine } from "./animation";
import { normalizeProps } from "./normalize-props";
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

- iterations need to be included in the calculations
- "at" needs to be more refined
- options need to be rechecked. Should more be included? 

if there is an overlap within the sequence, it will create additional easings
? should these be used in the keyframes? Should there be another readout for that timing?

? if a root element is removed, should it be removed from the props as well? => it could get readded

? for all animated properties like clipPath or transform: what happens if the element already has some?

*/

export const bewegung2 = (props: BewegungsEntry[], config?: BewegungsConfig): Bewegung => {
	const { callbacks, totalRuntime } = normalizeProps(props, config);
	const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));
	const machine = getAnimationStateMachine(callbacks, totalRuntime, timekeeper);

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
