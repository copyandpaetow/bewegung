import { getAnimationStateMachine } from "./animation";
import { normalizeProps } from "./normalize-props";
import { AllPlayStates, BewegungsBlock, BewegungsConfig } from "./types";

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

- added and removed elements need to get special treatment
=> we might need to readd the height and unsaveHeight
=> these two should get their own readout state as well as images
=> currently they are treated as default if they dont change in scale, in that case we could delete the readout

? if we send the parentsMap and the options (with callback turned into an id or completely without them) we could recursively check
? if an element is part of a given root and take the easing, maybe it would help to have this ready as Map<root, Options>
=> even if this would take longer we have time in the worker

- the worker might also need a state machine

- try to avoid if statements in loops, better filter before
- there are a lot of similarities between the MOs, that could be unified

*/

export const bewegung2 = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): Bewegung => {
	const normalizedProps = normalizeProps(props, globalConfig);
	const timekeeper = new Animation(new KeyframeEffect(null, null, normalizedProps.totalRuntime));
	const machine = getAnimationStateMachine(normalizedProps, timekeeper);

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
