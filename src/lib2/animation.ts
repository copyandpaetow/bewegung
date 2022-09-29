import { AnimationsAPI, CustomKeyframeEffect } from "./types";

export const getAnimations = (props: CustomKeyframeEffect[]): AnimationsAPI => {
	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
