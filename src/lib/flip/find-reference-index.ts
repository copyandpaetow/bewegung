import { CalculatedProperties } from "../core/main-read-dimensions";
import { firstIn } from "../utils/array-helpers";
import { save } from "../utils/number-helpers";
import { FlipMode } from "./calculate-flipmode";

export const findReferenceIndex = (
	flipMode: FlipMode,
	calculatedProperties: CalculatedProperties[]
): number => {
	if (flipMode === FlipMode.applyStyleAfterAnimation) {
		return 0;
	}
	if (flipMode === FlipMode.combined) {
		const isFirstIndexDisplayNone =
			firstIn(calculatedProperties).styles.display === "none";
		const nextIndex = [...calculatedProperties]
			.map((property) => property.styles.display !== "none")
			.lastIndexOf(true);

		return !isFirstIndexDisplayNone || nextIndex === -1 ? 0 : nextIndex;
	}

	return save(calculatedProperties.length - 1, 0);
};
