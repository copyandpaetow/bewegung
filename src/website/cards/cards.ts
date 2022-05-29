import { bewegung, CustomKeyframeEffect } from "../../lib/bewegung";
import { bewegung2 } from "../../lib2/bewegung";

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
			{ duration: 2000, easing: "ease-in" },
		];

		const hideOthers: CustomKeyframeEffect = [
			Array.from(cards).filter((card) => card !== cards[activeIndex]),
			{
				width: "",
				order: "",
			},
			{
				duration: 2000,
				easing: "ease-in-out",
			},
		];

		const animation = bewegung(highlightCard, hideOthers);
		animation.play();
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

document.addEventListener(
	"DOMContentLoaded",
	() => {
		initCards();
	},
	false
);
