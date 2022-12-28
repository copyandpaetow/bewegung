import {
	EveryOptionSyntax,
	GeneralTransferObject,
	MainState,
	MainTransferObject,
	Result,
} from "../types";
import { BidirectionalMap } from "./element-translations";

export const getRootSelector = (options: EveryOptionSyntax) => {
	if (!options || typeof options === "number" || !options.rootSelector) {
		return "body";
	}
	return options.rootSelector;
};

export const generalTransferObject = (): GeneralTransferObject => ({
	_keys: [],
	root: [],
	parent: [],
	type: [],
	affectedBy: [],
	ratio: [],
});

export const mainTransferObject = (): MainTransferObject => ({
	_keys: [],
	keyframes: [],
	options: [],
	selectors: [],
});

export const initialMainState = (): MainState => {
	let finishCallback = (result: any) => {};
	const finishPromise = new Promise<Result>((resolve) => (finishCallback = resolve));

	return {
		cssResets: new Map<HTMLElement, Map<string, string>>(),
		rootSelector: new Map<HTMLElement, string[]>(),
		mainTransferObject: mainTransferObject(),
		generalTransferObject: generalTransferObject(),
		elementTranslation: new BidirectionalMap<string, HTMLElement>(),
		onStart: [],
		animations: [],
		result: finishPromise,
		finishCallback,
	};
};
