export type ValueOf<T> = T[keyof T];

export type Readout = {
  borderWidth: [number, number];
  borderRadius: [number, number, number, number];
  dimensions: [number, number, number, number];
  display: CSSStyleDeclaration["display"];
  position: CSSStyleDeclaration["position"];
  transform: DOMMatrixReadOnly;
  transformOrigin: [number, number];
};

export const getBorderRadius = (
  style: CSSStyleDeclaration
): Readout["borderRadius"] => {
  return [
    parseFloat(style.borderTopLeftRadius),
    parseFloat(style.borderTopRightRadius),
    parseFloat(style.borderBottomRightRadius),
    parseFloat(style.borderBottomLeftRadius),
  ];
};

export const onlyElements = (node: Node): node is HTMLElement =>
  node.nodeType === Node.ELEMENT_NODE;

export const getElementReadouts = (
  element: HTMLElement
): Readout | undefined => {
  if (!element.isConnected) {
    return;
  }

  const { left, top, width, height } = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  if (style.display === "none") {
    return;
  }

  return {
    borderWidth: [
      parseFloat(style.borderLeftWidth),
      parseFloat(style.borderTopWidth),
    ],
    borderRadius: getBorderRadius(style),
    dimensions: [left, top, width, height],
    display: style.display,
    position: style.position,
    transform: new DOMMatrixReadOnly(style.transform),
    transformOrigin: style.transformOrigin.split(" ").map(parseFloat) as [
      number,
      number
    ],
  };
};

export const resetHiddenElement = (
  readout: Readout,
  parentReadout: Readout
) => {
  const [left, top, width, height] = readout.dimensions;
  const [parentLeft, parentTop] = parentReadout.dimensions;
  const [borderLeftWidth, borderTopWidth] = parentReadout.borderWidth;

  return {
    position: "fixed",
    display: readout.display,
    left: left - (parentLeft ?? 0) - (borderLeftWidth ?? 0) + "px",
    top: top - (parentTop ?? 0) - (borderTopWidth ?? 0) + "px",
    width: width + "px",
    height: height + "px",
  };
};
