import { ElementReadouts, State, WorkerState } from "../types";

export const addStyleOverrides = (
	elementReadouts: ElementReadouts[],
	elementString: string,
	workerState: WorkerState
) => {
	const { appliableKeyframes } = workerState;
	const before = appliableKeyframes.at(-1)!.get(elementString) ?? {};

	// const tasks = [
	// 	() => setCombinedKeyframeStyles(state),
	// 	() => checkDefaultReadouts(overrides, animationState),
	// 	() => checkImageReadouts(overrides, state, animationState),
	// 	() => addOverridesToCallbacks(overrides, state),
	// ];

	// tasks.forEach(scheduleCallback);
};
