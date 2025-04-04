import { type Readout } from "./helper/element";
import { TreeNode } from "./helper/tree-node";
import { Bewegung } from "./web-component";

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

const DEFAULT_DIMENSIONS = [0, 0, 1, 1];
const DEFAULT_ORIGINS = [0, 0];

export const calculateKeyframes = (
  readout: Readout,
  previousReadout: Readout,
  parentReadout: Readout,
  previousParentReadout: Readout
): Keyframe[] => {
  const [toLeft, toTop, toWidth, toHeight] = readout.dimensions;
  const [toParentLeft, toParentTop, toParentWidth, toParentHeight] =
    parentReadout?.dimensions ?? DEFAULT_DIMENSIONS;
  const [originToLeft, originToTop] = readout.transformOrigin;
  const [originToParentLeft, originToParentTop] =
    parentReadout?.transformOrigin ?? DEFAULT_ORIGINS;

  const [fromLeft, fromTop, fromWidth, fromHeight] = previousReadout.dimensions;
  const [fromParentLeft, fromParentTop, fromParentWidth, fromParentHeight] =
    previousParentReadout?.dimensions ?? DEFAULT_DIMENSIONS;
  const [originFromLeft, originFromTop] = previousReadout.transformOrigin;
  const [originFromParentLeft, originFromParentTop] =
    previousParentReadout?.transformOrigin ?? DEFAULT_ORIGINS;

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

  const combinedMatrix = readout.transform.multiply(flipMatrix);
  return [
    { transform: combinedMatrix.toString() },
    { transform: readout.transform.toString() },
  ];
};

export const isUnanimatable = (node: TreeNode) => {
  return (
    node.currentReadout?.display === "contents" ||
    node.newReadout?.display === "contents"
  );
};

export const isInvisible = (node: TreeNode) => {
  return !node.currentReadout?.isVisible && !node.newReadout?.isVisible;
};

export const EMPTY_KEYFRAMES = [];

export const getKeyframes = (
  currentNode: TreeNode,
  parentNode: TreeNode,
  context: Bewegung
): Keyframe[] => {
  if (isInvisible(currentNode) || isUnanimatable(currentNode)) {
    return EMPTY_KEYFRAMES;
  }

  if (isUnanimatable(parentNode)) {
    context.updateNode(parentNode.parent!);
    return getKeyframes(
      currentNode,
      context.updateReadouts(parentNode.parent!),
      context
    );
  }

  if (currentNode.currentReadout?.display === "none") {
    for (let child = currentNode.firstChild; child; child = child.nextSibling) {
      child.updateVersion = currentNode.updateVersion;
    }

    return getAppearingKeyframes(currentNode.newReadout!);
  }

  if (currentNode.newReadout?.display === "none") {
    context.hideNode(currentNode);
    return EMPTY_KEYFRAMES;
  }

  const keyframes = calculateKeyframes(
    currentNode.newReadout!,
    currentNode.currentReadout!,
    parentNode.newReadout!,
    parentNode.currentReadout!
  );

  if (keyframes.at(0)?.transform !== keyframes.at(-1)?.transform) {
    return keyframes;
  }

  if (
    parentNode.currentReadout?.dimensions[2] !==
      parentNode.newReadout?.dimensions[2] ||
    parentNode.currentReadout?.dimensions[3] !==
      parentNode.newReadout?.dimensions[3]
  ) {
    context.updateNode(parentNode);
  }
  return EMPTY_KEYFRAMES;
};
