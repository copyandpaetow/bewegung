import { arrayifyInputs } from "./inputs/arrayify-inputs";
import { QueryableWorker } from "./queryable-worker";
import { serializeHtmlElements } from "./inputs/serialize-html-elements";
import { BewegungProps, Context, MinimalChunks } from "./types";
import { keyifyInputs } from "./inputs/keyify-inputs";
import { readDomChanges } from "./read-dom/read-dom";

export class Bewegung2 {
	#now: number;
	#worker = QueryableWorker("worker.ts");

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		//this.#prepareInput(normalizeProps(...bewegungProps));

		this.#worker.sendQuery("init");

		const inputs = arrayifyInputs(bewegungProps);
		const elementKeyMap = serializeHtmlElements(inputs);

		this.#worker.sendQuery("formatChunks", keyifyInputs(inputs, elementKeyMap));

		this.#worker.addListener(
			"readDom",
			(result: [MinimalChunks[], Context]) => {
				this.#worker.sendQuery(
					"calculateKeyframes",
					readDomChanges(elementKeyMap, ...result)
				);
			}
		);
	}
}
