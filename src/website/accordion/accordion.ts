import { Bewegung } from "../../lib/bewegung";

const toggleAccordions = () => {
	const accordionHeaders = [
		...document.querySelectorAll("[data-accordion-header]"),
	] as HTMLButtonElement[];

	accordionHeaders.forEach((accordionHeader) => {
		//@ts-expect-error ts doesnt not that property
		let [target] = accordionHeader.ariaControlsElements;

		accordionHeader.addEventListener("click", () => {
			let expanded =
				accordionHeader.getAttribute("aria-expanded") === "true" || false;

			const animation = new Bewegung(
				[accordionHeader, { attribute: `aria-expanded=${!expanded}` }, 500],
				[target, { attribute: `hidden` }, 500]
			);

			animation.play();
		});
	});
};

toggleAccordions();
