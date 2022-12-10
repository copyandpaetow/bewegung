import {
	AnimationInformation,
	CssRuleName,
	ElementReadouts,
	State,
	StyleChangePossibilities,
	WorkerMethods,
} from "../types";
import { Queue } from "../utils";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./dom-properties";

const getAnimationInformation = (worker: WorkerMethods) =>
	new Promise<AnimationInformation>((resolve) => {
		worker.addListener("sendKeyframeInformationToClient", ([information]: [AnimationInformation]) =>
			resolve(information)
		);
	});

const nextBrowserRender = () => new Promise((resolve) => requestAnimationFrame(resolve));

const readDom = async (
	elementChanges: Map<string, StyleChangePossibilities>,
	changeProperties: CssRuleName[],
	state: State
) => {
	const { cssResets, elementLookup } = state;
	const readouts = new Map<string, ElementReadouts>();

	await nextBrowserRender();
	elementChanges.forEach((styleChange, elementString) => {
		const domElement = state.elementLookup.get(elementString)!;
		applyCSSStyles(domElement, styleChange);
		elementLookup.forEach((domElement, elementString) => {
			readouts.set(
				elementString,
				getCalculations(domElement, changeProperties, styleChange.offset)
			);
		});
		cssResets.forEach((reset, domElement) => {
			restoreOriginalStyle(domElement, reset);
		});
	});
	return readouts;
};
let once = false;
const areObjectsIdentical = <Value>(
	current: Record<string, Value>,
	previous: Record<string, Value>
) => Object.entries(current).every(([key, value]) => previous[key] === value);

const filterSimilarDomReadouts = (
	current: Map<string, ElementReadouts>,
	previous: Map<string, ElementReadouts>
) => {
	const newReadouts = new Map<string, ElementReadouts>();

	current.forEach((readout, string) => {
		if (!previous.has(string)) {
			newReadouts.set(string, readout);
			previous.set(string, readout);
			return;
		}
		const previousReadout = previous.get(string)!;

		if (
			areObjectsIdentical(readout.dimensions, previousReadout.dimensions) &&
			areObjectsIdentical(readout.computedStyle, previousReadout.computedStyle)
		) {
			//equal

			return;
		}
		newReadouts.set(string, readout);
		previous.set(string, readout);
	});

	return newReadouts;
};

export const readWriteDomChanges = async (state: State) => {
	const { worker } = state;
	const previousDomReadouts = new Map<string, ElementReadouts>();

	worker.addListener(
		"sendAppliableKeyframes",
		([elementChanges]: [Map<string, StyleChangePossibilities>]) => enqueue(elementChanges)
	);
	const { totalRuntime, changeProperties } = await getAnimationInformation(worker);
	const enqueue = Queue(async (current: Map<string, StyleChangePossibilities>) => {
		const domReadouts = await readDom(current, changeProperties, state);

		//TODO: check if this added calculation time is worth it in the long run
		const filterReadouts = filterSimilarDomReadouts(domReadouts, previousDomReadouts);

		worker.sendQuery("sendReadouts", filterReadouts);
	});

	return totalRuntime;
};
