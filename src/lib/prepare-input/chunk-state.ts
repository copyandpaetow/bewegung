import {
	Callbacks,
	ChunkOption,
	Chunks,
	ChunkState,
	ElementKey,
	ElementState,
} from "../types";

/*
! this cant be a bimap, it stores the keys strongly, so they would need to be deleted here as well 
! from chunks to keys is not needed
*/

interface MapKeysToChunks {
	keyChunkMap: WeakMap<ElementKey, Chunks>;
	elementKeyMap: WeakMap<HTMLElement, ElementKey[]>;
}
export const mapKeysToChunks = (
	chunks: Chunks[],
	elementState: ElementState
): MapKeysToChunks => {
	const keyChunkMap = new WeakMap<ElementKey, Chunks>();
	const elementKeyMap = new WeakMap<HTMLElement, ElementKey[]>();

	chunks.forEach((chunk) => {
		chunk.target.forEach((element) => {
			elementState.getKeys(element).forEach((key) => {
				keyChunkMap.set(key, chunk);
			});
		});
	});

	return { keyChunkMap, elementKeyMap };
};

export const getChunkState = ({
	keyChunkMap,
	elementKeyMap,
}: MapKeysToChunks): ChunkState => {
	console.log({ keyChunkMap, elementKeyMap });

	const getChunks = (keys: ElementKey[]) => {
		const chunks = new Set<Chunks>();

		keys.forEach((key) => {
			if (!keyChunkMap.has(key)) {
				return;
			}
			chunks.add(keyChunkMap.get(key)!);
		});

		return Array.from(chunks);
	};

	return {
		getKeyframes(keys: ElementKey[]) {
			return getChunks(keys)
				.map((chunk) => chunk.keyframes)
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
