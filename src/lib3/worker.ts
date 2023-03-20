import { useWorker } from "./use-worker";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker(worker);

workerAtom("sendDOMRects").onMessage((domChanges) => {
	console.log({ domChanges });
});
