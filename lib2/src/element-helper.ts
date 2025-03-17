export type ValueOf<T> = T[keyof T];

export type Readout = {
  dimensions: [number, number, number, number];
  borderRadius: [number, number, number, number];
  transform: DOMMatrixReadOnly;
  transformOrigin: [number, number];
  version: number;
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

export const filterElements = (node: Node): node is Element =>
  node.nodeType === Node.ELEMENT_NODE;
