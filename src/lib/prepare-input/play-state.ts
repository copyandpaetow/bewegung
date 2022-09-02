import { CallbackState } from "../types";

const reducer = (
	currentState: AnimationPlayState,
	newState: AnimationPlayState
): AnimationPlayState => {
	return "finished";
};

export interface GetPlayStateProps {
	callbackState: CallbackState;
	animations: Animation[];
	updatePlayState: (state: AnimationPlayState) => void;
	updateFinishPromise: (promise: Promise<Animation[]>) => void;
}

type States = "init";

export interface PlayState {
	dispatch(newState: States): void;
}

/*
jobs:
- save and keep track of progress and currentTime
- set progress/duration on reclac
- call callbacks
- update playstate
- setup on finished callbacks

*/

export const getPlayState = (props: GetPlayStateProps): PlayState => {
	let state: States = "init";

	return {
		dispatch(newState: States) {},
	};
};
