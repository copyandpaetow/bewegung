import {
	EveryOptionSyntax,
	GeneralTransferObject,
	MainState,
	MainTransferObject,
	Result,
} from "../types";
import { BidirectionalMap } from "../shared/element-translations";

export const getRootSelector = (options: EveryOptionSyntax): HTMLElement => {
	if (!options || typeof options === "number" || !options.rootSelector) {
		return document.body;
	}
	const root = document.querySelector(options.rootSelector) as HTMLElement | null;

	if (!root) {
		throw new Error("no element with that selector");
	}

	return root;
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
});

export const initialMainState = (): MainState => {
	let finishCallback = (result: any) => {};
	const finishPromise = new Promise<Result>((resolve) => (finishCallback = resolve));

	return {
		mainTransferObject: mainTransferObject(),
		elementRoots: new Map<HTMLElement, HTMLElement>(),
		elementResets: new Map<HTMLElement, Map<string, string>>(),
		elementSelectors: [],
		elementTranslation: new BidirectionalMap<string, HTMLElement>(),
		result: finishPromise,
		finishCallback,
	};
};
