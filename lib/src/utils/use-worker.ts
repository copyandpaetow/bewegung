type WorkerCallback<Current extends keyof Self, Self, Target> = (
	replyMethodArguments: Self[Current],
	context: WorkerContext<Current, Self, Target>
) => any;

type WorkerError = (event: ErrorEvent) => void;

type WorkerCallbackTypes<Current extends keyof Self, Self, Target> = {
	onMessage: WorkerCallback<Current, Self, Target>;
	onError: WorkerError;
};

type WorkerMessageEvent<Current extends keyof Self, Self> = {
	replyMethodArguments: Self[Current];
	replyMethod: Current;
};

export type WorkerContext<Current extends keyof Self, Self, Target> = {
	reply(
		replyMethod: keyof Target,
		replyMethodArguments?: Target[keyof Target]
	): WorkerContext<Current, Self, Target>;
	cleanup(): void;
	onMessage(callback: WorkerCallback<Current, Self, Target>): Promise<unknown>;
	onError(errorCallback: WorkerError): void;
};

const workerURL = new URL("../worker-thread/worker.ts", import.meta.url);

export class DelayedWorker {
	worker: Worker;
	constructor() {
		requestAnimationFrame(() => {
			this.worker = new Worker(workerURL, {
				type: "module",
			});
		});
	}
}

export const useWorker = <Self extends Record<string, any>, Target extends Record<string, any>>(
	worker: Worker
) => {
	const controller = new AbortController();
	const { signal } = controller;

	return <Current extends keyof Self>(eventName: Current) => {
		const callbacks: WorkerCallbackTypes<Current, Self, Target> = {
			onMessage: () => {},
			onError: () => {},
		};

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
};
