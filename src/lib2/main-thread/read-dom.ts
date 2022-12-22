import {
	AnimationInformation,
	CssRuleName,
	CustomKeyframe,
	ElementReadouts,
	State,
} from "../types";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./read-dom-properties";

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
	});
	cssResets.forEach((reset, domElement) => {
		restoreOriginalStyle(domElement, reset);
	});

	return readouts;
};

export const readWriteDomChanges = async (state: State) => {
	const { worker } = state;
	let setIsFinished = (value?: unknown) => {};
	const isFinished = new Promise((resolve) => {
		setIsFinished = resolve;
	});

	worker.addListener("sendAppliableKeyframes", async ([{ keyframes, changeProperties, done }]) => {
		const domReadouts = await readDom(keyframes, changeProperties, state);
		worker.sendQuery("sendReadouts", domReadouts);

		if (done) {
			setIsFinished();
			return;
		}
	});

	await isFinished;
	return;
};
