import {
	DomChangeTransferable,
	AtomicWorker,
	ElementReadouts,
	MainState,
	CustomKeyframe,
	CssRuleName,
} from "../types";
import { applyCSSStyles } from "./apply-styles";
import { restoreOriginalStyle } from "./css-resets";
import { getCalculations } from "./read-dom-properties";

const nextBrowserRender = () => new Promise((resolve) => requestAnimationFrame(resolve));

export const readDom = async (
	keyframes: Map<string, CustomKeyframe>,
	state: MainState,
	context: { offset: number; changeProperties: Set<CssRuleName> }
) => {
	const { resets, translation } = state;
	const { offset, changeProperties } = context;
	const readouts = new Map<string, ElementReadouts>();

	await nextBrowserRender();
	keyframes.forEach((styleChange, elementID) => {
		const domElement = translation.get(elementID)!;
		applyCSSStyles(domElement, styleChange);
	});
	translation.forEach((domElement, elementID) => {
		readouts.set(elementID, getCalculations(domElement, changeProperties, offset));
	});
	resets.forEach((reset, domElement) => {
		restoreOriginalStyle(domElement, reset);
	});

	return readouts;
};

export const calculateDomChanges = async (useWorker: AtomicWorker, state: MainState) => {
	const { reply, onMessage, cleanup } = useWorker("domChanges"); //maybe the worker and a schema could be added beforehand

	reply("receiveKeyframeRequest", undefined);

	await onMessage(async (domChangeTransferable) => {
		const { appliableKeyframes, changeProperties } = domChangeTransferable;
		cleanup();

		for await (const [offset, keyframes] of appliableKeyframes) {
			reply("receiveReadouts", {
				value: await readDom(keyframes, state, { offset, changeProperties }),
				done: offset === 1,
			});
		}
	});

	return Date.now();
};
