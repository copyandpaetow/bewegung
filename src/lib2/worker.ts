import {
	calculatedElementProperties,
	Chunks,
	Context,
	ElementKey,
	FormatChunks,
	KeyedCFE,
	MinimalChunks,
	PreChunk,
} from "./types";
import { getElementAnimations } from "./worker-thread/animate-elements";
import { getImageAnimations } from "./worker-thread/animate-images";
import { calculateContext } from "./worker-thread/context";
import {
	normalizeKeyframes,
	normalizeOptions,
} from "./worker-thread/normalize";
import { calculateOverwriteStyles } from "./worker-thread/overwrites";
import { postprocessProperties } from "./worker-thread/post-process";

let chunkState = new Map<string, Chunks>();
let elementState = new Map<string, ElementKey>();
let context: Context;
let elementProperties: Map<string, calculatedElementProperties[]>;
let styleOverwrites: Map<string, Partial<CSSStyleDeclaration>>;

const queryableFunctions = {
	init() {
		console.log("started");
	},
	formatChunks({ keyedChunkMap, keyedElementMap }: FormatChunks) {
		keyedChunkMap.forEach((preChunk, key) => {
			const { keyframes, options } = preChunk;
			const updatedOptions = normalizeOptions(options);

			chunkState.set(key, {
				options: updatedOptions,
				...normalizeKeyframes(keyframes, updatedOptions),
			});
		});
		elementState = keyedElementMap;
		context = calculateContext(chunkState);

		reply("readDom", chunkState, context);
	},

	calculateKeyframes(
		calculatedProperties: Map<string, calculatedElementProperties[]>
	) {
		elementProperties = postprocessProperties(calculatedProperties);

		reply(
			"imageAnimations",
			getImageAnimations(elementProperties, elementState, chunkState, context)
		);
		reply(
			"elementAnimations",
			getElementAnimations(elementProperties, elementState, chunkState, context)
		);
		reply("time");
	},
};

const queryFunctions = new Map(Object.entries(queryableFunctions));

function reply(queryMethodListener: string, ...queryMethodArguments: any[]) {
	if (!queryMethodListener) {
		throw new TypeError("reply - takes at least one argument");
	}
	postMessage({
		queryMethodListener,
		queryMethodArguments,
	});
}

onmessage = (event) => {
	const { queryMethod, queryMethodArguments } = event.data;

	if (!queryMethod || !queryMethodArguments) {
		return;
	}

	const fn = queryFunctions.get(queryMethod);

	//@ts-expect-error
	fn?.(...queryMethodArguments);
};

interface calculatedKeyframe {
	target: string;
	keyframes: ComputedKeyframe[];
	options: ComputedEffectTiming;
	styleOverwrites?: Partial<CSSStyleDeclaration>;
}
