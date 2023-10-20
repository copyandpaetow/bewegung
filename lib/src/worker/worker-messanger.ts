import { Messenger, WorkerCallback, WorkerPayloadMap } from "../types";

export class WorkerMessanger implements Messenger {
	#listeners: Record<string, Set<any>>;
	#worker: Worker;

	constructor(worker: Worker) {
		this.#listeners = {};
		this.#worker = worker;
		this.#worker.addEventListener("message", this.handleMessage.bind(this));
	}

	handleMessage<Key extends keyof WorkerPayloadMap>(
		event: MessageEvent<{ key: Key; payload: WorkerPayloadMap[Key] }>
	) {
		this.#listeners[event.data.key]?.forEach((callback) => {
			try {
				callback({ data: event.data.payload, error: undefined });
			} catch (error) {
				callback({ data: undefined, error: `${error}` });
			}
		});
	}

	on<Key extends keyof WorkerPayloadMap>(
		key: Key,
		callback: WorkerCallback<WorkerPayloadMap[Key]>
	) {
		this.#listeners[key] ??= new Set<WorkerCallback<WorkerPayloadMap[Key]>>();
		this.#listeners[key].add(callback);
	}

	off<Key extends keyof WorkerPayloadMap>(
		key: Key,
		callback: WorkerCallback<WorkerPayloadMap[Key]>
	) {
		this.#listeners[key]?.delete(callback);
	}

	send<Key extends keyof WorkerPayloadMap>(key: Key, payload: WorkerPayloadMap[Key]) {
		this.#worker.postMessage({
			key,
			payload,
		});
	}
}
