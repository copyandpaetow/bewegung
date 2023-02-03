import { Bewegung } from "../../lib2/bewegung";

const initFilter = () => {
	const checkboxes = document.querySelectorAll("#filter input");
	checkboxes.forEach((checkbox) =>
		checkbox.addEventListener("change", (event) => {
			const element = event.target as HTMLInputElement;
			const selectedImages = Array.from(
				document.querySelectorAll(`img[data-color=${element.value}]`)
			).map((element) => element.parentElement) as HTMLElement[];
			if (element.checked) {
				const animation = new Bewegung(
					selectedImages,
					{ display: "" },
					{ duration: 1400, rootSelector: "main" }
				);
				animation.play();
				animation.pause();
			} else {
				const animation = new Bewegung(
					selectedImages,
					{ display: "none" },
					{ duration: 1400, rootSelector: "main" }
				);
				animation.play();
				animation.pause();
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
