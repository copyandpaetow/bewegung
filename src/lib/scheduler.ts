import { schedulerEntry } from "./types";

const queue: schedulerEntry[] = [];
const { port1, port2 } = new MessageChannel();

let refreshIntervall = 16;
let isMessageLoopRunning = false;
let nesting = 0;

const getRefreshIntervall = () => refreshIntervall;

const getRepaintInterval = () => {
	return new Promise<number>((resolve) => {
		requestAnimationFrame((t1) => {
			requestAnimationFrame((t2) => {
				resolve(t2 - t1);
			});
		});
	});
};

getRepaintInterval().then((intervall) => (refreshIntervall = Math.floor(intervall)));

const isThereStilltimeToWork = (deadline: number) => {
	//@ts-expect-error only for chrome / opera
	if (navigator?.scheduling?.isInputPending?.()) {
		return false;
	}
	if (Date.now() >= deadline) {
		return false;
	}
	return true;
};

const workUntilDeadline = () => {
	if (queue.length === 0) {
		isMessageLoopRunning = false;
		nesting = 0;
		return;
	}

	const deadline = Date.now() + getRefreshIntervall() / 2;

	while (queue.length && isThereStilltimeToWork(deadline)) {
		const { callback, level } = queue.shift()!;
		const previousLevel = nesting;
		nesting = level + 1;
		callback();
		nesting = previousLevel;
	}

	if (queue.length) {
		scheduleNextWork();
		return;
	}

	isMessageLoopRunning = false;
	nesting = 0;
};

port1.onmessage = workUntilDeadline;
const scheduleNextWork = () => {
	port2.postMessage(null);
};

export const scheduleCallback = (callback: VoidFunction) => {
	// if there is no nesting, just add it to the queue
	if (nesting === 0) {
		queue.push({ callback, level: nesting });
	} else {
		//@ts-expect-error ts doesnt know
		let lastIndex = queue.findLastIndex((entry) => entry.level === nesting);

		if (lastIndex === -1) {
			//if there is nesting but not an entry present then this is the first nested call, so we add it as first entry of the list
			queue.unshift({ callback, level: nesting });
		} else {
			//if there are already nested callbacks, we want to add to the end of it
			queue.splice(lastIndex + 1, 0, { callback, level: nesting });
		}
	}

	if (!isMessageLoopRunning) {
		nesting = 0;
		isMessageLoopRunning = true;
		scheduleNextWork();
	}
};
