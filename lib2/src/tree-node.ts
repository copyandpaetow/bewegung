import { getBorderRadius, type Readout } from "./element-helper";
import { getKeyframes } from "./keyframes";

type Context = {
  onMount: (node: TreeNode) => void;
  animationOptions: Partial<KeyframeEffectOptions>;
};

export class TreeNode {
  styles: Readout | null = null;
  prevStyles: Readout | null = null;

  processed = true;

  parent: TreeNode | null = null;
  firstChild: TreeNode | null = null;
  lastChild: TreeNode | null = null;
  nextSibling: TreeNode | null = null;
  prevSibling: TreeNode | null = null;

  intersectionObserver!: IntersectionObserver;
  resizeObserver!: ResizeObserver;

  key!: Element;
  counter = -1;

  animation!: Animation;

  constructor(element: Element, parent: TreeNode | null, context: Context) {
    this.key = element;
    this.styles = this.getElementValues();
    context.onMount(this);
    // this.resizeObserver = new ResizeObserver(this.observerCallback.bind(this));
    // this.intersectionObserver = new IntersectionObserver(
    //   this.observerCallback.bind(this),
    //   {
    //     root: parent.key,
    //     rootMargin: getMargins(
    //       this.styles.dimensions,
    //       parent.styles.dimensions
    //     ), //TODO: we need to reset them after each animation
    //     threshold: 1,
    //   }
    // );
    // this.resizeObserver.observe(element);
    // this.intersectionObserver.observe(element);

    this.parent = parent;
    this.counter = parent?.counter ?? -1;

    let index = 0;
    let current = element.firstElementChild
      ? new TreeNode(element.firstElementChild!, this, context)
      : null;
    if (current) {
      this.firstChild = current;
    }

    while (current) {
      index++;
      const child = element.children[index];
      if (!child) {
        break;
      }
      const node = new TreeNode(child, this, context);
      current.nextSibling = node;
      node.prevSibling = current;

      current = node;
    }

    if (current) {
      this.lastChild = current;
    }

    this.animation = new Animation(
      new KeyframeEffect(this.key, null, context.animationOptions)
    );

    this.processed = false;
  }

  getElementValues(counter?: number): Readout {
    const { left, top, width, height } = this.key.getBoundingClientRect();
    const style = window.getComputedStyle(this.key);

    return {
      dimensions: [left, top, width, height],
      borderRadius: getBorderRadius(style),
      transform: new DOMMatrixReadOnly(style.transform),
      transformOrigin: style.transformOrigin.split(" ").map(parseFloat) as [
        number,
        number
      ],
      version: counter ?? this.counter,
    };
  }

  observerCallback(
    entries: IntersectionObserverEntry[] | ResizeObserverEntry[],
    observer: IntersectionObserver | ResizeObserver
  ) {
    if (this.processed) {
      return;
    }
    console.log({ entries });
  }

  requestUpdatedValues(counter: number) {
    //TODO: this could lead to a problem as updates while animating would disrupt this
    //* maybe an array of styles would be better here?
    if (counter !== this.styles?.version) {
      this.prevStyles = this.styles;
      this.styles = this.getElementValues(counter);
    }

    return [this.styles, this.prevStyles];
  }

  //? do we reach in an element or the TreeNode? What about the context
  //? should we save it in here or pass it in again for registration?
  append(child: Element, anchorNode: TreeNode | null, context: Context) {
    const childNode = new TreeNode(child, this, context);

    if (!anchorNode) {
      this.firstChild = this.lastChild = childNode;
      return;
    }

    const prevAnchorNode = anchorNode.prevSibling;

    childNode.prevSibling = prevAnchorNode;
    childNode.nextSibling = anchorNode;
    prevAnchorNode?.nextSibling && (prevAnchorNode.nextSibling = childNode);
    anchorNode.prevSibling = childNode;
  }

  update(counter: number) {
    if (counter === this.counter || this.key.tagName === "BEWEGUNG-BOUNDARY") {
      return;
    }
    this.counter = counter;

    const [currentStyle, prevStyle] = this.requestUpdatedValues(counter);
    const [currentParentStyle, prevParentStyle] =
      this.parent!.requestUpdatedValues(counter);

    //TODO: if we allow either both parents or one of these arguments to be null, we could use it to indicate addition/removal
    const keyframes = getKeyframes(
      { current: currentStyle, parent: currentParentStyle },
      { current: prevStyle, parent: prevParentStyle }
    );

    if (keyframes[0].transform === keyframes[1].transform) {
      return;
    }

    this.parent?.update(counter);
    this.prevSibling?.update(counter);
    this.nextSibling?.update(counter);
    this.firstChild?.update(counter);
    this.lastChild?.update(counter);

    this.animation.effect?.setKeyframes(keyframes);
    this.animation.play();
  }
}
