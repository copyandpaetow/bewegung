import { Context, DefaultMessage, DefaultSchema, MessageContext } from "../types";

const spawnWorker = () =>
	new Worker(new URL("../worker-thread/worker.ts", import.meta.url), {
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

export const createStore = <Schema extends DefaultSchema>(schema: Schema) => {
	const context: Context<Schema> = {
		state: schema.state,
		commit(method, payload) {
			schema.methods[method]?.(context, payload);
		},
		dispatch(action, payload) {
			schema.actions[action]?.(context, payload);
		},
	};

	return context;
};

export const createMessageStore = <Sender extends DefaultMessage, Receiver extends DefaultMessage>(
	worker: Worker,
	schema: Sender
) => {
	const onMessage = (
		event: MessageEvent<{
			replyMethod: keyof Sender;
			replyMethodArguments?: any;
		}>
	) => {
		const { replyMethod, replyMethodArguments } = event.data;
		schema[replyMethod]?.(context, replyMethodArguments);
	};

	const onError = (event: ErrorEvent) => {
		console.log(event);
	};

	worker.addEventListener("message", onMessage);
	worker.addEventListener("error", onError);

	const context: MessageContext<Sender, Receiver> = {
		terminate() {
			worker.terminate();
			worker.removeEventListener("message", onMessage);
			worker.removeEventListener("error", onError);
		},
		reply(replyMethod, replyMethodArguments) {
			worker.postMessage({
				replyMethod,
				replyMethodArguments,
			});
		},
		send(replyMethod, replyMethodArguments) {
			schema[replyMethod]?.(context, replyMethodArguments);
		},
		cache: schema.cache,
	};

	return context;
};
