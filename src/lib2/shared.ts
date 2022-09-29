export interface Queue {
	enqueue: (fn: Function) => void;
	run: VoidFunction;
}

export const queue = (): Queue => {
	const tasks: Function[] = [];
	let currentCallbackId = 0;

	const work = (deadline: IdleDeadline) => {
		while (
			(deadline.timeRemaining() > 0 || deadline.didTimeout) &&
			tasks.length > 0
		) {
			tasks.shift()?.();
		}

		currentCallbackId = tasks.length > 0 ? requestIdleCallback(work) : 0;
	};

	return {
		enqueue(...fn) {
			tasks.push(...fn);
		},
		run() {
			if (!tasks.length || !currentCallbackId) {
				return;
			}
			currentCallbackId = requestIdleCallback(work);
		},
	};
};
