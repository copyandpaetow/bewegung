import { assembleElementAnimations } from "./animations/assemble-element-animations";
import { assembleImageAnimations } from "./animations/assemble-image-animations";
import { arrayifyInputs } from "./inputs/arrayify-inputs";
import { createStructures } from "./inputs/serialize-html-elements";
import { QueryableWorker } from "./queryable-worker";
import {
	applyAllStyles,
	readDomChanges,
	restoreOriginalStyle,
} from "./read-dom/read-dom";
import {
	BewegungProps,
	Chunks,
	Context,
	MinimalChunks,
	PreAnimation,
} from "./types";

export const deferred = <T>() => {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return {
		resolve,
		reject,
		promise,
	};
};

export class Bewegung2 {
	#now = 0;
	#worker = QueryableWorker("worker.ts");
	#ready: Promise<boolean>;

	#animations: Animation[] = [];
	#originalStyleMap = new WeakMap<HTMLElement, Map<string, string>>();

	#callbacks: {
		before: VoidFunction[];
		after: VoidFunction[];
	} = {
		before: [],
		after: [],
	};

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		const { promise, resolve } = deferred<boolean>();
		//this.#prepareInput(normalizeProps(...bewegungProps));
		this.#ready = promise;
		this.#worker.sendQuery("init");

		let chunks: Map<string, Chunks>;

		const { elementKeyMap, keyedChunkMap, keyedElementMap } = createStructures(
			arrayifyInputs(bewegungProps)
		);

		this.#worker.sendQuery("formatChunks", { keyedChunkMap, keyedElementMap });

		this.#worker.addListener(
			"readDom",
			(result: [Map<string, Chunks>, Context]) => {
				const { elementProperties, originalStyle } = readDomChanges(
					elementKeyMap,
					keyedElementMap,
					...result
				);
				chunks = result[0];
				this.#worker.sendQuery("calculateKeyframes", elementProperties);
				this.#originalStyleMap = originalStyle;
			}
		);

		this.#worker.addListener(
			"imageAnimations",
			([imageAnimationMap]: [
				Map<
					string,
					{
						wrapper: PreAnimation;
						image: PreAnimation;
					}
				>
			]) => {
				const { animations, callbacks } = assembleImageAnimations(
					elementKeyMap,
					keyedElementMap,
					imageAnimationMap,
					this.#originalStyleMap
				);
				this.#animations.push(...animations);
				this.#callbacks.before.push(...callbacks.before);
				this.#callbacks.after.push(...callbacks.after);
			}
		);
		this.#worker.addListener(
			"elementAnimations",
			([elementAnimationMap]: [Map<string, PreAnimation>]) => {
				const { animations, beforeCallbacks } = assembleElementAnimations(
					elementKeyMap,
					elementAnimationMap
				);
				this.#animations.push(...animations);
				this.#callbacks.before.push(...beforeCallbacks); // overwrites
				this.#callbacks.before.push(() => {
					applyAllStyles(elementKeyMap, keyedElementMap, chunks);
				});

				this.#callbacks.after.push(() => {
					keyedElementMap.forEach((elementKey, stringId) => {
						const element = elementKeyMap.get(stringId)!;
						restoreOriginalStyle(element, this.#originalStyleMap.get(element)!);
					});

					applyAllStyles(elementKeyMap, keyedElementMap, chunks);
				});
				resolve(true);
			}
		);
		this.#worker.addListener("time", () => {
			console.log(`it took ${performance.now() - this.#now}ms to get here`);
		});
	}

	play() {
		console.log(`it took ${performance.now() - this.#now}ms to get to play`);
		console.log(this.#ready);
		const asyncPlay = async () => {
			await this.#ready;

			[...this.#callbacks.before].reverse().forEach((cb) => cb());
			this.#animations.forEach((waapi) => waapi.play());

			Promise.all(this.#animations.map((animation) => animation.finished)).then(
				() => {
					[...this.#callbacks.after].forEach((cb) => cb());
				}
			);
		};
		asyncPlay();
	}

	pause() {
		const asyncPause = async () => {
			await this.#ready;

			this.#animations.forEach((waapi) => waapi.pause());
		};
		asyncPause();
	}
}
