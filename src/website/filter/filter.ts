import { bewegung } from "../../lib/bewegung";
import { bewegung3 } from "../../lib3/bewegung";

const initFilter = () => {
	const checkboxes = document.querySelectorAll("#filter input");
	checkboxes.forEach((checkbox) =>
		checkbox.addEventListener("change", (event) => {
			const element = event.target as HTMLInputElement;
			const selectedImages = Array.from(
				document.querySelectorAll(`img[data-color=${element.value}]`)
			).map((element) => element.parentElement) as HTMLElement[];
			if (element.checked) {
				bewegung3(selectedImages, { display: "" }, { duration: 1400 }).play();
			} else {
				bewegung3(
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
