import { Bewegung } from "../../lib/bewegung";

const toggleAccordions = () => {
	const accordionHeaders = [
		...document.querySelectorAll("[data-accordion-header]"),
	] as HTMLButtonElement[];

	accordionHeaders.forEach((accordionHeader) => {
		let target = accordionHeader.parentElement!
			.nextElementSibling as HTMLElement;

		accordionHeader.addEventListener("click", () => {
			let expanded =
				accordionHeader.getAttribute("aria-expanded") === "true" || false;

			const animation = new Bewegung(
				[accordionHeader, { attribute: `aria-expanded=${!expanded}` }, 400],
				[target, { attribute: `hidden=${expanded}` }, 400]
			);

			animation.play();
		});
	});
};

toggleAccordions();
