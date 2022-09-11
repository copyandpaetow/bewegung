import { CustomKeyframeEffect, KeyedCFE } from "../types";
import { BidirectionalMap } from "./bidirectional-map";
import { toArray } from "./serialize-html-elements";

export const keyifyInputs = (
	props: CustomKeyframeEffect[],
	elementKeyMap: BidirectionalMap<HTMLElement, string>
): KeyedCFE[] =>
	props.map((chunk) => {
		const [target, ...rest] = chunk;

		const newKeys = toArray(target).map(
			(element) => elementKeyMap.get(element as HTMLElement)!
		);
		return [newKeys, ...rest];
	});
