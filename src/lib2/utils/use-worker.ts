import {
	WorkerCallback,
	WorkerCallbackTypes,
	WorkerContext,
	WorkerError,
	WorkerMessageEvent,
} from "../types";

const spawnWorker = () =>
	new Worker(new URL("../worker.ts", import.meta.url), {
		type: "module",
	});

export const getWorker = () => {
	const allWorker: Worker[] = [];

	requestAnimationFrame(() => {
		allWorker.push(spawnWorker());
	});

	/*
		todo:
		- this could need some more work
		- we should add another function to add the next worker (if the current is done)
	*/
	return {
		current() {
			const current = allWorker.pop()!;
			setTimeout(() => {
				allWorker.push(spawnWorker());
			}, 500);
			return current;
		},
	};
};

export const useWorker =
	<Self extends Record<string, any>, Target extends Record<string, any>>(worker: Worker) =>
	<Current extends keyof Self>(eventName: Current) => {
		const callbacks: WorkerCallbackTypes<Current, Self, Target> = {
			onMessage: () => {},
			onError: () => {},
		};

		const controller = new AbortController();
		const { signal } = controller;

		const handleMessage = (event: MessageEvent<WorkerMessageEvent<Current, Self>>) => {
			const { replyMethod, replyMethodArguments } = event.data;
			if (replyMethod !== eventName) {
				return;
			}
			callbacks.onMessage(replyMethodArguments, context);
		};

		const handleError = (event: ErrorEvent) => {
			callbacks.onError(event);
		};

		worker.addEventListener("message", handleMessage, { signal });
		worker.addEventListener("error", handleError, { signal });

		const context: WorkerContext<Current, Self, Target> = {
			reply(replyMethod, replyMethodArguments) {
				worker.postMessage({
					replyMethod,
					replyMethodArguments,
				});
				return context;
			},
			cleanup() {
				controller.abort();
			},
			onMessage(callback: WorkerCallback<Current, Self, Target>) {
				return new Promise((resolve) => {
					callbacks.onMessage = (replyMethodArguments: Self[Current]) => {
						const result = callback(replyMethodArguments, context);
						resolve(result);
					};
				});
			},
			onError(errorCallback: WorkerError) {
				callbacks.onError = errorCallback;
			},
		};

		return context;
	};
