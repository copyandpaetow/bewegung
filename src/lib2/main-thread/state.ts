import {
	EveryOptionSyntax,
	GeneralTransferObject,
	MainState,
	MainTransferObject,
	Result,
} from "../types";
import { BidirectionalMap } from "../shared/element-translations";

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
		rootElement: new Map<HTMLElement, HTMLElement>(),
		mainTransferObject: mainTransferObject(),
		generalTransferObject: generalTransferObject(),
		elementTranslation: new BidirectionalMap<string, HTMLElement>(),
		result: finishPromise,
		finishCallback,
	};
};
