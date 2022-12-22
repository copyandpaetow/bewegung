import { Queries, ReplyFunctions, ValueOf, WorkerMethods } from "../types";

export function QueryableWorker(url: string, onError?: VoidFunction): WorkerMethods {
	const worker = new Worker(new URL(url, import.meta.url), {
		type: "module",
	});

	const listeners = new Map<keyof ReplyFunctions, ValueOf<ReplyFunctions>>();

	if (onError) {
		worker.onerror = onError;
	}

	const terminate = () => {
		worker.terminate();
	};

	const addListener = (name: keyof ReplyFunctions, listener: ValueOf<ReplyFunctions>) => {
		listeners.set(name, listener);
	};

	const removeListener = (name: keyof ReplyFunctions) => {
		listeners.delete(name);
	};

	// This functions takes at least one argument, the method name we want to query.
	// Then we can pass in the arguments that the method needs.
	const sendQuery = (queryMethod: keyof Queries, ...queryMethodArguments: ValueOf<Queries>) => {
		worker.postMessage({
			queryMethod,
			queryMethodArguments,
		});
	};

	worker.onmessage = (event) => {
		const { queryMethodListener, queryMethodArguments } = event.data;

		listeners.get(queryMethodListener)?.(queryMethodArguments);
	};

	return {
		terminate,
		addListener,
		removeListener,
		sendQuery,
	};
}
