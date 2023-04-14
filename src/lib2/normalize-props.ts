import { defaultOptions } from "./utils/constants";
import {
	BewegungsBlock,
	BewegungsConfig,
	InternalProps,
	NormalizedPropsWithCallbacks,
} from "./types";

export const resolveable = () => {
	const api = {
		resolve(value: any) {},
		reject(value: any) {},
	};
	const promise = new Promise<void>((res, rej) => {
		api.resolve = res;
		api.reject = rej;
	});

	return { ...api, promise };
};

export const normalizeProps = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): InternalProps => {
	let totalRuntime = 0;
	let currentTime = 0;

	const normalizedProps: NormalizedPropsWithCallbacks[] = props
		.map((entry) => {
			const callback = entry?.[0] ?? entry;
			const options = entry?.[1] ?? {};

			const combinedOptions = {
				...defaultOptions,
				...(globalConfig ?? {}),
				...(options ?? {}),
				callback,
			};

			totalRuntime = totalRuntime + combinedOptions.at + combinedOptions.duration;

			return combinedOptions;
		})
		.map((entry) => {
			const { duration, at, ...remainingOptions } = entry;

			const start = (currentTime = currentTime + at) / totalRuntime;
			const end = (currentTime = currentTime + duration) / totalRuntime;

			return {
				...remainingOptions,
				start,
				end,
			};
		});

	return {
		normalizedProps,
		totalRuntime,
	};
};

// const delayedWorkerTransferable = {
// 	parents: new Map<string, string>(),
// 	textElements: new Set<string>(),
// };

// const minimalWorkerTransferable = {
// 	parents: new Map<string, string>(),
// 	roots: new Map<string, NormalizedOptions>(),
// };

// const resultingAnimationState = {
// 	timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));
// 	animations: new Map([["timekeeper", timekeeper]]),
// 	onStart: [],
// }
