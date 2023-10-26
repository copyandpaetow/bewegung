import { MessageResult, WorkerPayloadMap, WorkerMessenger } from "../types";

export const workerMessenger = (worker: Worker): WorkerMessenger => {
	const controller = new AbortController();

	return {
		addListener<Key extends keyof WorkerPayloadMap>(
			name: Key,
			callback: (result: MessageResult<Key>) => void,
			_options: AddEventListenerOptions = {}
		) {
			const options: AddEventListenerOptions = { ..._options, signal: controller.signal };
			const handleMessage = (message: MessageEvent<MessageResult<Key>>) => {
				if (message.data.key !== name) {
					return;
				}

				callback(message.data);
			};

			worker.addEventListener("message", handleMessage, options);
		},
		postMessage<Key extends keyof WorkerPayloadMap>(name: Key, data: WorkerPayloadMap[Key]) {
			worker.postMessage({ key: name, data, error: null } as MessageResult<Key>);
		},
		cleanup() {
			controller.abort();
		},
	};
};
