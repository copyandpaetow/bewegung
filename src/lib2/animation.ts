import { makeMainState, toSoA } from "./normalize/state";
import { AnimationsAPI, CustomKeyframeEffect } from "./types";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	const state = makeMainState(toSoA(props));

	console.log({ props, state });

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
