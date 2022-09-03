import {
	Chunks,
	ChunkOption,
	Callbacks,
	ChunkState,
	ElementState,
	ElementKey,
} from "../types";

interface ChunkKeyValues {
	chunkKeys: WeakMap<ElementKey, symbol[]>;
	chunkValues: Map<symbol, Chunks>;
}

export const mapKeysToChunks = (
	chunks: Chunks[],
	elementState: ElementState
): ChunkKeyValues => {
	const chunkKeys = new WeakMap<ElementKey, symbol[]>();
	const chunkValues = new Map<symbol, Chunks>();

	chunks.forEach((chunk) => {
		const key = Symbol("chunkKey");
		chunkValues.set(key, chunk);
		chunk.target.forEach((element) => {
			const elementKey = elementState.getKey(element);
			chunkKeys.set(elementKey, (chunkKeys.get(elementKey) || []).concat(key));
		});
	});

	return { chunkKeys, chunkValues };
};

export const getChunkState = ({
	chunkKeys,
	chunkValues,
}: ChunkKeyValues): ChunkState => {
	return {
		getKeyframes(key: ElementKey) {
			return chunkKeys
				.get(key)
				?.map((chunkKey) => chunkValues.get(chunkKey)!.keyframes)
				.flat();
		},
		getCallbacks(key: ElementKey) {
			return chunkKeys
				.get(key)
				?.map((chunkKey) => chunkValues.get(chunkKey)!.callbacks)
				.flat()
				.filter(Boolean) as Callbacks[] | undefined;
		},
		getOptions(key: ElementKey) {
			return chunkKeys
				.get(key)
				?.map((chunkKey) => chunkValues.get(chunkKey)!.options)
				.flat();
		},
		getSelector(key: ElementKey) {
			return chunkKeys
				.get(key)
				?.flatMap((chunkKey) => chunkValues.get(chunkKey)!.selector)
				.filter(Boolean) as string[] | undefined;
		},
		getAllKeyframes() {
			const allKeyframes: ComputedKeyframe[][] = [];
			chunkValues.forEach(({ keyframes }) => {
				allKeyframes.push(keyframes);
			});
			return allKeyframes;
		},
		getAllOptions() {
			const allOptions: ChunkOption[] = [];
			chunkValues.forEach(({ options }) => {
				allOptions.push(options);
			});
			return allOptions;
		},
	};
};
