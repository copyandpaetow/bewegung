const calculateDifferences = (
	previous: DOMRect,
	current: DOMRect
): PDOMRect => {
	return {
		left: current.left - previous.left,
		top: current.top - previous.top,
		height: current.height - previous.height,
		width: current.width - previous.width,
	};
};

type PDOMRect = Partial<DOMRect>;

export class Deferred<T> {
	readonly promise: Promise<T>;
	#resolveFn!: (value: T | PromiseLike<T>) => void;
	#rejectFn!: (reason?: any) => void;

	public constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.#resolveFn = resolve;
			this.#rejectFn = reject;
		});
	}

	public reject(reason?: any): void {
		this.#rejectFn(reason);
	}

	public resolve(param: T): void {
		this.#resolveFn(param);
	}
}

class DifferenceEntry {
	#entries: DOMRect[] = [];
	#differences: PDOMRect[] = [];
	#queue: (() => number)[] = [];
	#queueStarted: boolean = false;
	#promise: Deferred<PDOMRect[]>;
	#now = 0;
	constructor() {
		console.log("start");
		this.#promise = new Deferred<PDOMRect[]>();
	}

	addEntry(dimensons) {
		const lastEntry = this.#entries.at(-1);
		this.#entries.push(dimensons);
		if (lastEntry) {
			this.#queue.push(() =>
				this.#differences.push(calculateDifferences(lastEntry, dimensons))
			);
		}
		if (lastEntry && !this.#queueStarted) {
			requestIdleCallback((idleDeadline: IdleDeadline) =>
				this.#exec(idleDeadline)
			);
		}
	}
	#exec(idleDeadline: IdleDeadline) {
		this.#now = performance.now();
		this.#queueStarted = true;
		const haltTime = performance.now() + idleDeadline.timeRemaining();

		for (let i = 0; i < this.#queue.length; i++) {
			if (performance.now() > haltTime) {
				break;
			}

			this.#queue.shift()?.();
		}

		// if not complete, ask for another notification
		if (this.#queue.length) {
			requestIdleCallback((idleDeadline: IdleDeadline) =>
				this.#exec(idleDeadline)
			);
			console.log(`there are still ${this.#queue.length} calculations left`);
		} else {
			this.#promise.resolve(this.#differences);
			this.#queueStarted = false;
			console.log(`it took ${performance.now() - this.#now}ms`);
		}
	}

	async getDifferences() {
		return await this.#promise.promise;
	}
}

export const test = async () => {
	const Queue = new DifferenceEntry();
	const cards = document.querySelectorAll(".card");

	requestAnimationFrame(() => {
		cards.forEach((element) => {
			Queue.addEntry(element.getBoundingClientRect());
		});
	});

	const delta = await Queue.getDifferences();
	console.log(delta);
};
