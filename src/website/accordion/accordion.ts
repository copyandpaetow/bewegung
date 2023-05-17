import { bewegung2 } from "../../lib2/bewegung";

const toggleAccordions = () => {
	const accordionHeaders = [
		...document.querySelectorAll("[data-accordion-header]"),
	] as HTMLButtonElement[];

	accordionHeaders.forEach((accordionHeader) => {
		//@ts-expect-error ts doesnt not that property
		let [target] = accordionHeader.ariaControlsElements as HTMLElement;

		accordionHeader.addEventListener("click", () => {
			let expanded = accordionHeader.getAttribute("aria-expanded") === "true" || false;

			const animation = bewegung2([
				[
					() => {
						target.classList.toggle("hidden");
						accordionHeader.setAttribute("aria-expanded", `${!expanded}`);
					},
					{
						duration: 500,
						root: "main",
					},
				],
			]);

			animation.play();
		});
	});
};

toggleAccordions();
