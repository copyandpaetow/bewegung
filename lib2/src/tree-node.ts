import { getBorderRadius, ValueOf, type Readout } from "./helper/element";
import { getKeyframes } from "./keyframes";
import { Bewegung } from "./web-component";

export const TYPE = {
  DELETE: 0,
  MOVE: 1,
  ADD: 2,
} as const;

export class TreeNode {
  styles: Readout | null = null;
  prevStyles: Readout | null = null;

  processed = true;

  intersectionObserver!: IntersectionObserver;
  resizeObserver!: ResizeObserver;

  context: Bewegung;
  key!: Element;
  counter = -1;

  type: ValueOf<typeof TYPE> = TYPE.MOVE;

  animation!: Animation;

  constructor(element: Element, context: Bewegung) {
    this.key = element;
    this.context = context;
    this.counter = context.updateCounter;
    this.styles = this.getElementValues(this.counter);
    this.animation = new Animation(
      new KeyframeEffect(this.key, [], context.animationOptions)
    );

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

    this.processed = false;
  }

  getElementValues(counter: number): Readout | null {
    if (!this.key.isConnected) {
      return null;
    }

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
      version: counter,
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

  scheduleDelete() {
    this.type = TYPE.DELETE;
    this.key.style.position = "absolute";
  }

  cleanup() {
    this.key.remove();
    this.context.treeNodes.delete(this.key);
    this.key
      .querySelectorAll("*")
      .forEach((child) => this.context.treeNodes.delete(child));
  }

  requestUpdatedValues(counter: number) {
    if (counter !== this.styles?.version) {
      this.prevStyles = this.styles;
      this.styles = this.getElementValues(counter);
    }

    return [this.styles, this.prevStyles];
  }

  needsUpdate(counter: number) {
    if (this.key.tagName === "BEWEGUNG-BOUNDARY") {
      return false;
    }
    return !this.styles || !this.prevStyles || this.counter !== counter;
  }

  update(counter: number) {
    if (!this.needsUpdate(counter)) {
      return false;
    }
    this.counter = counter;
    const parent = this.context.treeNodes.get(
      this.key.parentElement ?? this.context
    )!;

    const [currentStyle, prevStyle] = this.requestUpdatedValues(counter);
    const [currentParentStyle, prevParentStyle] =
      parent!.requestUpdatedValues(counter);

    const keyframes = getKeyframes(
      { current: currentStyle, parent: currentParentStyle! },
      { current: prevStyle, parent: prevParentStyle! }
    );

    if (keyframes[0].transform === keyframes[1].transform) {
      return false;
    }

    this.animation.effect?.setKeyframes(keyframes);
    this.animation.onfinish = () => {
      if (this.type === TYPE.DELETE) {
        this.cleanup();
      }
    };

    queueMicrotask(() => {
      this.animation.play();
    });

    return true;
  }
}
