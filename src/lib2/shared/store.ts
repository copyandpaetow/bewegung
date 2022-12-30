import { Context, DefaultSchema } from "../types";

const spawnWorker = () =>
	new Worker(new URL("worker-thread/worker.ts", import.meta.url), {
		type: "module",
	});

export const getWorker = () => {
	const allWorker = [spawnWorker()];

	return {
		current() {
			const current = allWorker.pop()!;
			allWorker.push(spawnWorker());
			return current;
		},
	};
};

export const createStore = <Schema extends DefaultSchema, ReplySchema extends DefaultSchema>(
	worker: Worker,
	schema: Schema
) => {
	worker.addEventListener(
		"message",
		(event: MessageEvent<{ storeAction: ReplySchema["actions"]; storeActionArguments?: any }>) => {
			const { storeAction, storeActionArguments } = event.data;
			schema.actions[storeAction]?.(context, storeActionArguments);
		}
	);

	const context: Context<Schema, ReplySchema> = {
		state: schema.state,
		commit(method, payload) {
			schema.methods[method]?.(context, payload);
		},
		dispatch(action, payload) {
			schema.actions[action]?.(context, payload);
		},
		reply(storeAction, storeActionArguments) {
			worker.postMessage({
				storeAction,
				storeActionArguments,
			});
		},
	};

	return context;
};
