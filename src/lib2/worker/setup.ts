import { WorkerMethods } from "../types";

export function QueryableWorker(url: string, onError?: VoidFunction): WorkerMethods {
	const worker = new Worker(new URL(url, import.meta.url), {
		type: "module",
	});
	const listeners = new Map();

	if (onError) {
		worker.onerror = onError;
	}

	const postMessage = (message) => {
		worker.postMessage(message);
	};

	const terminate = () => {
		worker.terminate();
	};

	const addListener = (name, listener) => {
		listeners.set(name, listener);
	};

	const removeListener = (name) => {
		listeners.delete(name);
	};

	// This functions takes at least one argument, the method name we want to query.
	// Then we can pass in the arguments that the method needs.
	const sendQuery = (queryMethod, ...queryMethodArguments) => {
		if (!queryMethod) {
			throw new TypeError("QueryableWorker.sendQuery takes at least one argument");
		}
		worker.postMessage({
			queryMethod,
			queryMethodArguments,
		});
	};

	worker.onmessage = (event) => {
		const { queryMethodListener, queryMethodArguments } = event.data;

		if (!queryMethodListener || !queryMethodArguments) {
			return;
		}
		listeners.get(queryMethodListener)?.(queryMethodArguments);
	};

	return {
		postMessage,
		terminate,
		addListener,
		removeListener,
		sendQuery,
	};
}
