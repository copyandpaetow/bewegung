import { Context } from "./types";

export const createStore = <Schema extends Record<"actions" | "methods" | "state", any>>(
	worker: Worker,
	schema: Schema
) => {
	worker.addEventListener("message", (event: MessageEvent<any>) => {
		const { workerAction, workerActionArguments } = event.data;
		schema.actions[workerAction]?.(context, workerActionArguments);
	});

	const context: Context<Schema> = {
		state: schema.state,
		commit(method, payload) {
			schema.methods[method]?.(context, payload);
		},
		dispatch(action, payload) {
			schema.actions[action]?.(context, payload);
		},
		reply(workerAction, workerActionArguments) {
			worker.postMessage({
				workerAction,
				workerActionArguments,
			});
		},
	};

	return context;
};
