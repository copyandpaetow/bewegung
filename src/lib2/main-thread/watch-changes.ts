import { Context, MainMessages, MainSchema, MessageContext, WorkerMessages } from "../types";
import { getGeneralTransferObject } from "./find-affected-elements";
import { observerDimensions } from "./watch-dimensions";
import { observeMutations } from "./watch-mutations";
import { observeResizes } from "./watch-resizes";

export const watchForChanges = (
	store: Context<MainSchema>,
	messageStore: MessageContext<MainMessages, WorkerMessages>,
	callbacks: [VoidFunction, VoidFunction]
) => {
	let delayedCallback: NodeJS.Timeout | undefined;
	const [before, after] = callbacks;

	const throttledCallback = (callback: VoidFunction) => {
		delayedCallback && clearTimeout(delayedCallback);
		delayedCallback = setTimeout(() => {
			unobserve();
			before();
			callback();
			after();
		}, 100);
	};

	const dimensionChange = () => messageStore.send("sendRequestKeyframes", undefined);

	const unobserveRO = observeResizes(store.state, () => throttledCallback(dimensionChange));
	const unobserveIO = observerDimensions(store.state, () => throttledCallback(dimensionChange));
	const unobserveMO = observeMutations(
		store.state,
		(changedElements) =>
			//TODO: this would not work twice, since the other patch was not coming through.
			//calculateMainStatePatches can be delayed though
			throttledCallback(() => store.dispatch("patchMainState", changedElements)),
		() =>
			throttledCallback(() => {
				dimensionChange();
				messageStore.send("sendGeneralTransferObject", getGeneralTransferObject(store.state));
			})
	);

	const unobserve = () => {
		unobserveRO();
		unobserveIO();
		unobserveMO();
	};

	return unobserve;
};
