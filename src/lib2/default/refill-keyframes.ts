import { AllReadoutTypes } from "../types";
import { isEntryVisible } from "../utils/predicates";

export const refillPartialKeyframes = <Value extends AllReadoutTypes>(
	allReadouts: Map<string, Value[]>,
	timings: number[]
) => {
	const partialElements = new Map<string, Keyframe[]>();

	allReadouts.forEach((readouts, key) => {
		const updatedReadouts: Value[] = [];
		timings.forEach((offset) => {
			const nextIndex = readouts.findIndex((entry) => entry.offset === offset);
			const correspondingReadout = readouts[nextIndex];

			if (correspondingReadout && isEntryVisible(correspondingReadout)) {
				updatedReadouts.push(correspondingReadout);
				return;
			}

			const nextVisibleReadout =
				readouts.slice(nextIndex).find(isEntryVisible) || updatedReadouts.at(-1);

			if (!nextVisibleReadout) {
				//If there is no visible next element and not a previous one, the element is always hidden and can be deleted
				allReadouts.delete(key);
				return;
			}

			if (correspondingReadout) {
				updatedReadouts.push({
					...nextVisibleReadout,
					display: correspondingReadout.display,
					unsaveHeight: 0,
					unsaveWidth: 0,
					offset,
				});
				return;
			}

			updatedReadouts.push({
				...nextVisibleReadout,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset,
			});

			partialElements.set(key, []);

			return;
		});
		allReadouts.set(key, updatedReadouts);
	});

	return partialElements;
};
