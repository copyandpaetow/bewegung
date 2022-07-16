import { bewegung } from "../../lib/bewegung";

const initFilter = () => {
	const checkboxes = document.querySelectorAll("#filter input");
	checkboxes.forEach((checkbox) =>
		checkbox.addEventListener("change", (event) => {
			const element = event.target as HTMLInputElement;
			const selectedImages = Array.from(
				document.querySelectorAll(`img[data-color=${element.value}]`)
			).map((element) => element.parentElement) as HTMLElement[];
			if (element.checked) {
				bewegung(selectedImages, { display: "" }, { duration: 1400 }).play();
			} else {
				bewegung(
					selectedImages,
					{ display: "none" },
					{ duration: 1400 }
				).play();
			}
		})
	);
};

document.addEventListener(
	"DOMContentLoaded",
	() => {
		initFilter();
	},
	false
);
