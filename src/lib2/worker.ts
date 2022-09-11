import {
	calculatedElementProperties,
	Chunks,
	Context,
	KeyedCFE,
	MinimalChunks,
} from "./types";
import { calculateContext } from "./worker-thread/context";
import {
	normalizeKeyframes,
	normalizeOptions,
} from "./worker-thread/normalize";
import { postprocessProperties } from "./worker-thread/post-process";

let chunkState: Chunks[] = [];
let context: Context;
let elementProperties: Map<string, calculatedElementProperties[]>;

const queryableFunctions = {
	init() {
		console.log("started");
	},
	formatChunks(chunks: KeyedCFE[]) {
		const minimalChunks: MinimalChunks[] = [];

		chunkState = chunks.map((chunk) => {
			const [target, oldKeyframes, oldOptions] = chunk;
			const options = normalizeOptions(oldOptions);
			const { keyframes, callbacks } = normalizeKeyframes(
				oldKeyframes,
				options
			);

			minimalChunks.push({ target, keyframes });
			return { target, keyframes, callbacks, options };
		});

		context = calculateContext(chunkState);

		reply("readDom", minimalChunks, context);
	},

	calculateKeyframes(
		calculatedProperties: Map<string, calculatedElementProperties[]>
	) {
		elementProperties = postprocessProperties(calculatedProperties);
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
