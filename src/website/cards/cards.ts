import { CustomKeyframeEffect } from "../../lib/bewegung";
import { bewegung2 } from "../../lib2/bewegung";
import { bewegung3 } from "../../lib3/bewegung";
import { bewegung } from "../../lib3/types";

const initCards = () => {
	const cardsAbortButton = document.querySelector(".cards__button--abort");
	const cardsPlayButton = document.querySelector(".cards__button--play");
	const cardsPauseButton = document.querySelector(".cards__button--pause");
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
				width: "15%",
				order: "-1",
				// height: "60vh",
			},
			{ duration: 4000, easing: "ease" },
		];

		// const hideOthers: CustomKeyframeEffect = [
		// 	Array.from(cards).filter((card) => card !== cards[activeIndex]),
		// 	{
		// 		width: "",
		// 		order: "",
		// 	},
		// 	{
		// 		duration: 2000,
		// 		easing: "ease-in-out",
		// 	},
		// ];

		const hideOthers: CustomKeyframeEffect = [
			[...cards].filter((card, index) => index !== activeIndex),
			{
				width: "",
				order: "",
				// height: "",
			},
			{ duration: 4000, easing: "ease-in" },
		];

		return bewegung3(highlightCard, hideOthers);
	};

	let animation: bewegung | undefined;
	let paused = false;

	cardsPlayButton?.addEventListener("click", () => {
		if (!animation) {
			animation = highlight();
		}
		console.log(animation.playState());
		animation.playState() !== "running" ? animation.play() : animation.pause();
		paused && animation.pause();
		animation.finished.then(() => {
			animation = undefined;
			updateIndex(+1);
			console.log("finished");
		});
	});
	cardsPauseButton?.addEventListener("click", () => {
		paused = !paused;
		cardsPauseButton.innerHTML = `start paused: ${paused}`;
	});
	cardsAbortButton?.addEventListener("click", () => {
		animation?.cancel();
		updateIndex(+1);
		animation = undefined;
	});
};

document.addEventListener(
	"DOMContentLoaded",
	() => {
		initCards();
	},
	false
);
