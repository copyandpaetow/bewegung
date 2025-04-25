import { getDifferences } from "../keyframes";

export type ValueOf<T> = T[keyof T];

export type Readout = {
  borderWidth: [number, number];
  borderRadius: [number, number, number, number];
  dimensions: [number, number, number, number];
  display: CSSStyleDeclaration["display"];
  visibility: ValueOf<typeof VISIBILITY>;
  position: CSSStyleDeclaration["position"];
  transform: DOMMatrixReadOnly;
  transformOrigin: [number, number];
};

export const getBorderRadius = (
  style: CSSStyleDeclaration
): Readout["borderRadius"] => {
  return [
    parseFloat(style.borderTopLeftRadius || "0"),
    parseFloat(style.borderTopRightRadius || "0"),
    parseFloat(style.borderBottomRightRadius || "0"),
    parseFloat(style.borderBottomLeftRadius || "0"),
  ];
};

export const VISIBILITY_OPTIONS = {
  opacityProperty: true,
  visibilityProperty: true,
};

export const VISIBILITY = {
  TRANSPARENT: -1,
  HIDDEN: 0,
  VISIBLE: 1,
} as const;

export const onlyElements = (
  node: Node | Element | HTMLElement | null
): node is HTMLElement => node?.nodeType === Node.ELEMENT_NODE;

//TODO: we likely need a more dedicated isVisible approach
export const getElementReadouts = (element: HTMLElement): Readout => {
  const { left, top, width, height } = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  const readout: Readout = {
    borderWidth: [
      parseFloat(style.borderLeftWidth || "0"),
      parseFloat(style.borderTopWidth || "0"),
    ],
    borderRadius: getBorderRadius(style),
    dimensions: [left, top, width, height],
    display: style.display || "block",
    visibility: VISIBILITY.VISIBLE,
    position: style.position || "static",
    transform: new DOMMatrixReadOnly(style.transform),
    transformOrigin: (style.transformOrigin || "0 0")
      .split(" ")
      .map(parseFloat) as [number, number],
  };

  return readout;
};

export const resetHiddenElement = (
  readout: Readout,
  parentReadout: Readout,
  previousParentReadout: Readout
) => {
  const [left, top, width, height] = readout.dimensions;
  const [parentLeft, parentTop] = parentReadout.dimensions;
  const [borderLeftWidth, borderTopWidth] = parentReadout.borderWidth;

  const delta = getDifferences(
    readout,
    readout,
    parentReadout,
    previousParentReadout
  );

  return {
    position: "fixed",
    zIndex: 0,
    display: readout.display,
    left:
      left -
      (parentLeft ?? 0) -
      (borderLeftWidth ?? 0) +
      delta.leftDifference +
      "px",
    top:
      top -
      (parentTop ?? 0) -
      (borderTopWidth ?? 0) +
      delta.topDifference +
      "px",
    width: width + "px",
    height: height + "px",
  };
};
