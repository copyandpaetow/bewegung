import {
	createFlipEngine,
	FlipReturnMethods,
} from "../flip/create-flip-engine";
import { iterateMap } from "../utils/iterate-map";
import { Context } from "./create-context";
import { ReadDimensions } from "./main-read-dimensions";

export const addAnimationEngine =
	(globalContext: Context) =>
	(
		animationMap: Map<HTMLElement, ReadDimensions>
	): Map<HTMLElement, ReadDimensions & FlipReturnMethods> =>
		iterateMap((value, key, currentMap) => {
			const engine = createFlipEngine(key, value, currentMap, globalContext);

			return {
				...value,
				...engine,
			};
		}, animationMap);
