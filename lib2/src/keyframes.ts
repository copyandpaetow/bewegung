import type { Readout } from "./helper/element";

export const getAppearingKeyframes = (readout: Readout) => {
  const to = readout.transform.toString();
  const from = new DOMMatrix(to);
  from.scaleSelf(0.001, 0.001);

  return [{ transform: from.toString() }, { transform: to }];
};

export const getDisappearingKeyframes = (readout: Readout) => {
  const from = readout.transform.toString();
  const to = new DOMMatrix(from);
  to.scaleSelf(0.001, 0.001);

  return [{ transform: from }, { transform: to.toString() }];
};

export const getKeyframes = (
  toDimensions: { current: Readout | undefined; parent: Readout },
  fromDimensions: { current: Readout | undefined; parent: Readout }
) => {
  const { current: to, parent: toParent } = toDimensions;
  const { current: from, parent: fromParent } = fromDimensions;

  if (!to) {
    return getDisappearingKeyframes(from!);
  }

  if (!from) {
    return getAppearingKeyframes(to!);
  }

  const [toLeft, toTop, toWidth, toHeight] = to.dimensions;
  const [toParentLeft, toParentTop, toParentWidth, toParentHeight] =
    toParent.dimensions;
  const [originToLeft, originToTop] = to.transformOrigin;
  const [originToParentLeft, originToParentTop] = toParent.transformOrigin;

  const [fromLeft, fromTop, fromWidth, fromHeight] = from.dimensions;
  const [fromParentLeft, fromParentTop, fromParentWidth, fromParentHeight] =
    fromParent.dimensions;
  const [originFromLeft, originFromTop] = from.transformOrigin;
  const [originFromParentLeft, originFromParentTop] =
    fromParent.transformOrigin;

  const parentWidthDifference = fromParentWidth / toParentWidth;
  const parentHeightDifference = fromParentHeight / toParentHeight;
  const childWidthDifference = fromWidth / toWidth;
  const childHeightDifference = fromHeight / toHeight;

  const heightDifference = childHeightDifference / parentHeightDifference;
  const widthDifference = childWidthDifference / parentWidthDifference;

  const currentLeftDifference =
    fromLeft + originFromLeft - (fromParentLeft + originFromParentLeft);
  const referenceLeftDifference =
    toLeft + originToLeft - (toParentLeft + originToParentLeft);

  const currentTopDifference =
    fromTop + originFromTop - (fromParentTop + originFromParentTop);
  const referenceTopDifference =
    toTop + originToTop - (toParentTop + originToParentTop);

  const leftDifference =
    currentLeftDifference / parentWidthDifference - referenceLeftDifference;
  const topDifference =
    currentTopDifference / parentHeightDifference - referenceTopDifference;

  const flipMatrix = new DOMMatrix();
  flipMatrix.translateSelf(leftDifference, topDifference);
  flipMatrix.scaleSelf(widthDifference, heightDifference);

  const combinedMatrix = to.transform.multiply(flipMatrix);

  return [
    { transform: combinedMatrix.toString() },
    { transform: to.transform.toString() },
  ];
};
