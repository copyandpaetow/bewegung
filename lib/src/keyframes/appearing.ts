import { Readout } from "../element/readout";

export const getAppearingKeyframes = (readout: Readout) => {
	const to = readout.transform.toString();
	const from = new DOMMatrix(to);
	from.scaleSelf(0.001, 0.001);

	return [{ transform: from.toString() }, { transform: to }];
};
