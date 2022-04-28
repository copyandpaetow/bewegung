import { bewegung, CustomKeyframeEffect } from "../lib/bewegung";

const initCards = () => {
	const cardsPrevButton = document.querySelector(".cards__button--prev");
	const cardsNextButton = document.querySelector(".cards__button--next");
	let activeIndex = 1;
	const cards = document.querySelectorAll(".card");

	const updateIndex = (index: number) => {
		activeIndex = Math.abs((activeIndex + index) % cards.length);
		return activeIndex;
	};

	const highlight = () => {
		const highlightCard: CustomKeyframeEffect = [
			cards[activeIndex],
			{
				width: "100%",
				order: "-1",
			},
			{ duration: 8000, easing: "ease-in" },
		];

		const hideOthers: CustomKeyframeEffect = [
			Array.from(cards).filter((card) => card !== cards[activeIndex]),
			{
				width: "",
				order: "",
			},
			{
				duration: 8000,
				easing: "ease-in-out",
			},
		];
		const animation = bewegung(highlightCard, hideOthers);
		animation.play();
		setTimeout(() => {
			animation.pause();
		});
	};

	cardsNextButton?.addEventListener("click", () => {
		highlight();
		updateIndex(1);
	});
	cardsPrevButton?.addEventListener("click", () => {
		highlight();
		updateIndex(-1);
	});
};

const initFilter = () => {
	const checkboxes = document.querySelectorAll("#filter input");
	checkboxes.forEach((checkbox) =>
		checkbox.addEventListener("change", (event) => {
			const element = event.target as HTMLInputElement;
			const selectedImages = Array.from(
				document.querySelectorAll(`img[data-color=${element.value}]`)
			).map((element) => element.parentElement) as HTMLElement[];
			if (element.checked) {
				bewegung(
					selectedImages,
					{ display: "", transformOrigin: "50% 50%" },
					{ duration: 1500 }
				).play();
			} else {
				bewegung(
					selectedImages,
					{ display: "none", transformOrigin: "50% 50%" },
					{ duration: 1500 }
				).play();
			}
		})
	);
};

document.addEventListener(
	"DOMContentLoaded",
	() => {
		initCards();
		initFilter();
	},
	false
);
