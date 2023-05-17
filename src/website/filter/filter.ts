import { bewegung2 } from "../../lib2/bewegung";

const initFilter = () => {
	const checkboxes = document.querySelectorAll("#filter input");
	checkboxes.forEach((checkbox) =>
		checkbox.addEventListener("change", (event) => {
			const element = event.target as HTMLInputElement;
			const selectedImages = Array.from(
				document.querySelectorAll(`img[data-color=${element.value}]`)
			).map((element) => element.parentElement) as HTMLElement[];
			if (element.checked) {
				const animation = bewegung2([
					[
						() => {
							selectedImages.forEach((element) => (element.style.display = ""));
						},
						{ duration: 1400, root: "main" },
					],
				]);
				animation.play();
			} else {
				const animation = bewegung2([
					[
						() => {
							selectedImages.forEach((element) => (element.style.display = "none"));
						},
						{ duration: 1400, root: "main" },
					],
				]);
				animation.play();
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
