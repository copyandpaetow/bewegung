import { Chunks, ChunkOption, Callbacks } from "./types";

interface ChunkKeyValues {
	chunkKeys: WeakMap<HTMLElement, symbol[]>;
	chunkValues: Map<symbol, Chunks>;
}

export const mapKeysToChunks = (chunks: Chunks[]): ChunkKeyValues => {
	const chunkKeys = new WeakMap<HTMLElement, symbol[]>();
	const chunkValues = new Map<symbol, Chunks>();

	chunks.forEach((chunk) => {
		const key = Symbol("chunkKey");
		chunkValues.set(key, chunk);
		chunk.target.forEach((element) => {
			chunkKeys.set(element, (chunkKeys.get(element) || []).concat(key));
		});
	});

	return { chunkKeys, chunkValues };
};

export interface ChunkState {
	getCallbacks(element: HTMLElement): Callbacks[] | undefined;
	getKeyframes(element: HTMLElement): ComputedKeyframe[] | undefined;
	getOptions(element: HTMLElement): ChunkOption[] | undefined;
	getSelector(element: HTMLElement): string[] | undefined;
	getAllKeyframes(): ComputedKeyframe[][];
	getAllOptions(): ChunkOption[];
	getAllTargetElements(): Set<HTMLElement>;
}

export const getChunkState = ({
	chunkKeys,
	chunkValues,
}: ChunkKeyValues): ChunkState => {
	return {
		getKeyframes(element: HTMLElement) {
			return chunkKeys
				.get(element)
				?.map((chunkKey) => chunkValues.get(chunkKey)!.keyframes)
				.flat();
		},
		getCallbacks(element: HTMLElement) {
			return chunkKeys
				.get(element)
				?.map((chunkKey) => chunkValues.get(chunkKey)!.callbacks)
				.flat()
				.filter(Boolean) as Callbacks[] | undefined;
		},
		getOptions(element: HTMLElement) {
			return chunkKeys
				.get(element)
				?.map((chunkKey) => chunkValues.get(chunkKey)!.options)
				.flat();
		},
		getSelector(element: HTMLElement) {
			return chunkKeys
				.get(element)
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
		getAllTargetElements() {
			const elements = new Set<HTMLElement>();

			chunkValues.forEach(({ target }) => {
				target.forEach((targetElement) => {
					elements.add(targetElement);
				});
			});
			return elements;
		},
	};
};
