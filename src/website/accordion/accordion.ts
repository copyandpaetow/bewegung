import { Bewegung } from "../../lib2/bewegung";

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

			accordionHeader.setAttribute("aria-expanded", `${!expanded}`);
			target.hidden = expanded;
		});
	});
};

toggleAccordions();
