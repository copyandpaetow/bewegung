import { WorkerMethods, BewegungProps, State, CssRuleName } from "../types";
import { uuid } from "../utils";
import { saveMainElementStyles } from "./css-resets";
import { getElements } from "./elements";
import { separateKeyframesAndCallbacks } from "./keyframes";
import { getOptions } from "./options";
import { unifyPropStructure } from "./props";

export const initState = (worker: WorkerMethods, ...props: BewegungProps): State => {
	const chunkIDs = Array.from({ length: props.length }, () => uuid("chunk"));
	const normalizedProps = unifyPropStructure(...props);
	const changeProperties: CssRuleName[] = [];

	const { keyframes, callbacks } = separateKeyframesAndCallbacks(normalizedProps, chunkIDs);
	worker.sendQuery("sendKeyframes", keyframes);
	worker.addListener("sendChangeProperties", (changePropertiesFromWorker: [CssRuleName[]]) => {
		changeProperties.push(...changePropertiesFromWorker[0]);
		worker.removeListener("sendChangeProperties");
	});

	const options = getOptions(normalizedProps, chunkIDs);
	worker.sendQuery("sendOptions", options);

	const { elements, elementLookup, selectors } = getElements(normalizedProps, chunkIDs);
	worker.sendQuery("sendElements", elements);

	const cssResets = saveMainElementStyles(elements, elementLookup);

	return {
		callbacks,
		selectors,
		elementLookup,
		mainElements: elements,
		options,
		cssResets,
		changeProperties,
	};
};
