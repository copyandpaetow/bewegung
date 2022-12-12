import {
	AnimationInformation,
	CssRuleName,
	ElementReadouts,
	State,
	WorkerMethods,
	CustomKeyframe,
} from "../types";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./dom-properties";

export const getAnimationInformation = (state: State) =>
	new Promise<AnimationInformation>((resolve) => {
		state.worker.addListener(
			"sendKeyframeInformationToClient",
			([information]: [AnimationInformation]) => {
				resolve(information);
			}
		);
	});

const nextBrowserRender = () => new Promise((resolve) => requestAnimationFrame(resolve));

const readDom = async (
	elementChanges: Map<string, CustomKeyframe>,
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
				getCalculations(domElement, changeProperties, styleChange.offset!)
			);
		});
		cssResets.forEach((reset, domElement) => {
			restoreOriginalStyle(domElement, reset);
		});
	});
	return readouts;
};

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

export const readWriteDomChanges = async (
	state: State,
	animationInformation: AnimationInformation
) => {
	const { worker } = state;
	const previousDomReadouts = new Map<string, ElementReadouts>();
	let setIsFinished = (value: boolean | PromiseLike<boolean>) => {};
	const isFinished = new Promise((resolve) => {
		setIsFinished = resolve;
	});

	worker.addListener(
		"sendAppliableKeyframes",
		async ([{ keyframes, done }]: [{ keyframes: Map<string, CustomKeyframe>; done: boolean }]) => {
			const domReadouts = await readDom(keyframes, animationInformation.changeProperties, state);
			//TODO: check if this added calculation time is worth it in the long run
			const filterReadouts = filterSimilarDomReadouts(domReadouts, previousDomReadouts);
			worker.sendQuery("sendReadouts", filterReadouts);

			if (done) {
				setIsFinished(true);
				return;
			}
		}
	);

	worker.sendQuery("requestAppliableKeyframes");

	await isFinished;
	return;
};
