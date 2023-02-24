import { initGeneralState, initMainElementState } from "../shared/object-creators";
import { useWorker } from "../shared/use-worker";
import { MainMessages, WorkerMessages } from "../types";
import { constructKeyframes, deriveResultState } from "./sort-keyframes";
import { setMainState } from "./update-state";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

let mainElementState = initMainElementState();
let generalState = initGeneralState();

workerAtom("receiveMainState").onMessage((mainTransferables) => {
	mainElementState = setMainState(mainTransferables);
});

workerAtom("receiveGeneralState").onMessage((generalTransferable, { reply }) => {
	const { changeProperties, appliableKeyframes } = mainElementState;
	generalState = generalTransferable;
	reply("domChanges", {
		appliableKeyframes,
		changeProperties,
	});
});

workerAtom("receiveKeyframeRequest").onMessage((_, { reply }) => {
	const { changeProperties, appliableKeyframes } = mainElementState;
	reply("domChanges", {
		appliableKeyframes,
		changeProperties,
	});
});

workerAtom("receiveReadouts").onMessage((newReadouts, { reply }) => {
	const { done, value: readouts } = newReadouts;
	readouts.forEach((readout, elementID) => {
		mainElementState.readouts.set(
			elementID,
			(mainElementState.readouts.get(elementID) ?? []).concat(readout)
		);
	});
	if (!done) {
		return;
	}
	const resultState = deriveResultState(mainElementState, generalState);
	reply("receiveConstructedKeyframes", constructKeyframes(resultState));
});

workerAtom("receiveTask").onMessage((_, { reply }) => {
	console.log("here on worker");
	reply("task");
});
