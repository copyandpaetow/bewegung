import {
  getElementReadouts,
  onlyElements,
  Readout,
  resetHiddenElement,
} from "./helper/element";
import { MO_OPTIONS } from "./helper/observer";
import { getKeyframes } from "./keyframes";

export class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;

  currentStyles = new Map<HTMLElement, Readout>();
  previousStyles = new Map<HTMLElement, Readout>();

  animations = new Map<HTMLElement, Animation>();
  activeAnimations = new Map<HTMLElement, Animation>();

  styleOverride = new Map<HTMLElement, string>();

  inprogress = false;
  animationOptions: KeyframeEffectOptions;
  //TODO: we could have one timekeeper animation here that we could use to scrub the other animations

  constructor() {
    super();
    this.style.contain = "layout";
    this.animationOptions = {
      duration: 1000,
    };
  }

  async disconnectedCallback() {
    await Promise.resolve();
    if (!this.isConnected) {
    }
  }

  /*
  todo:

  - we need to exclude nested web-components and their children
  - we are currently only reacting to elements, text nodes are something entirely different
  => maybe we can get a range for dimensions? 


 TODO: when we resize the RO and IO call for animations, but that is likely not wanted
 TODO: we need to cancel/pause other animations 

  */

  connectedCallback() {
    this.setReadout(this);
    this.querySelectorAll("*").forEach((element) =>
      this.setReadout(element as HTMLElement)
    );

    this.setMO();
  }

  setReadout(element: HTMLElement) {
    const readout = getElementReadouts(element);
    if (!readout) {
      return;
    }
    this.currentStyles.set(element, readout);
  }

  scheduleUpdate() {
    if (this.inprogress) {
      return;
    }
    this.inprogress = true;

    requestAnimationFrame(() =>
      queueMicrotask(() => {
        this.inprogress = false;
      })
    );
  }

  transferStylesToPrevious() {
    this.currentStyles.forEach((style, key) => {
      this.previousStyles.set(key, style);
    });
    this.currentStyles.clear();
  }

  getParentElement(element: HTMLElement): HTMLElement {
    const parent = element.parentElement;
    if (!parent || parent.tagName === "BEWEGUNG-BOUNDARY") {
      return element;
    }
    return parent;
  }

  deleteElement(element: HTMLElement) {
    this.previousStyles.delete(element);
    this.currentStyles.delete(element);
    this.activeAnimations.delete(element);
    this.animations.delete(element);
    this.styleOverride.delete(element);

    element
      .querySelectorAll("*")
      .forEach((child) => this.deleteElement(child as HTMLElement));
  }

  setAnimation(element: HTMLElement, keyframes: Keyframe[]) {
    let anim = this.animations.get(element);

    if (!anim) {
      anim = new Animation(
        new KeyframeEffect(element, keyframes, this.animationOptions)
      );
      this.animations.set(element, anim);
    } else {
      (anim.effect as KeyframeEffect).setKeyframes(keyframes);
    }

    this.activeAnimations.set(element, anim);
    anim.onfinish = () => {
      const style = this.currentStyles.get(element);
      const override = this.styleOverride.get(element);

      if (style) {
        this.previousStyles.set(element, style);
        this.currentStyles.delete(element);
      }
      if (override) {
        element.style.cssText = override;
        this.styleOverride.delete(element);
      }

      if (element.hasAttribute("data-bewegung-delete")) {
        this.deleteElement(element);
      }
    };
  }

  //TODO: this is not right yet, we might need to allow for null as a value
  getOrSetStyle(element: HTMLElement) {
    const style =
      this.currentStyles.get(element) ?? getElementReadouts(element);
    style && this.currentStyles.set(element, style);

    return style;
  }

  updateElements(elements: Set<HTMLElement>) {
    for (const element of elements) {
      const parent = this.getParentElement(element);

      const parentStyle = this.getOrSetStyle(parent);
      const style = this.getOrSetStyle(element);

      const prevStyle = this.previousStyles.get(element);
      const parentPrevStyle = this.previousStyles.get(parent);

      if (!style) {
        this.styleOverride.set(element, element.style.cssText);

        Object.assign(
          element.style,
          resetHiddenElement(prevStyle, this.previousStyles.get(this)!)
        );
      }

      const keyframes = getKeyframes(
        { current: style, parent: parentStyle },
        { current: prevStyle, parent: parentPrevStyle }
      );

      if (keyframes[0].transform === keyframes[1].transform) {
        continue;
      }

      this.setAnimation(element, keyframes);

      elements.add(parent);
      element.previousElementSibling &&
        elements.add(element.previousElementSibling as HTMLElement);
      element.nextElementSibling &&
        elements.add(element.nextElementSibling as HTMLElement);

      const isDefault = Boolean(style && prevStyle);

      for (const child of element.children) {
        isDefault
          ? elements.add(child as HTMLElement)
          : elements.delete(child as HTMLElement);
      }
    }
  }

  setMO() {
    //TODO: here we could listen for resizes as well and mark the element as disabled
    //todo: with a disabled flag, we could stop nested trees from animating
    this.MO ??= new MutationObserver((entries) => {
      this.scheduleUpdate();
      this.transferStylesToPrevious();
      this.MO?.disconnect();
      this.MO = null;

      const dirtyElements = new Set<HTMLElement>();

      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        const parent = this.getParentElement(target);

        dirtyElements.add(target);
        dirtyElements.add(parent);
        target.previousElementSibling &&
          dirtyElements.add(target.previousElementSibling as HTMLElement);
        target.nextElementSibling &&
          dirtyElements.add(target.nextElementSibling as HTMLElement);
        for (const child of target.children) {
          dirtyElements.add(child as HTMLElement);
        }

        [...entry.addedNodes].filter(onlyElements).forEach((addedElement) => {
          dirtyElements.add(addedElement);
          this.setReadout(addedElement);
        });

        [...entry.removedNodes]
          .filter(onlyElements)
          .forEach((removedElement) => {
            dirtyElements.add(removedElement);
            queueMicrotask(() => {
              removedElement.setAttribute("data-bewegung-delete", "");
              entry.target.insertBefore(removedElement, entry.nextSibling);
            });
          });
      });

      this.updateElements(dirtyElements);

      console.log(this.activeAnimations);

      this.activeAnimations.forEach((anim) => {
        anim.play();
        // anim.pause();
      });
    });

    this.MO.observe(this, MO_OPTIONS);
  }
}

customElements.define("bewegung-boundary", Bewegung);
