import { QueueApi } from "./types";

// export const deferred = <T>() => {
// 	let resolveFn: (value: T | PromiseLike<T>) => void = () => ({});
// 	let rejectFn: (reason?: any) => void = () => ({});
// 	const promise = new Promise<T>((resolve, reject) => {
// 		resolveFn = resolve;
// 		rejectFn = reject;
// 	});

// 	return {
// 		promise,
// 		resolveFn,
// 		rejectFn,
// 	};
// };

export class Queue implements QueueApi {
	#tasks: Function[] = [];
	#currentCallbackId = 0;

	constructor() {
		this.#tasks = [];
		this.#currentCallbackId = 0;
	}

	#work(deadline: IdleDeadline) {
		while (
			(deadline.timeRemaining() > 0 || deadline.didTimeout) &&
			this.#tasks.length > 0
		) {
			this.#tasks.shift()?.();
		}
		console.log(this);

		this.#currentCallbackId =
			this.#tasks.length > 0
				? requestIdleCallback((deadline) => this.#work(deadline))
				: 0;
	}

	enqueue(...fn) {
		this.#tasks.push(...fn);
		console.log(this.#tasks);
		return this;
	}
	async run() {
		return new Promise<void>((resolve) => {
			this.#tasks.push(resolve);
			if (!this.#currentCallbackId) {
				this.#currentCallbackId = requestIdleCallback((deadline) =>
					this.#work(deadline)
				);
			}
		});
	}
}
