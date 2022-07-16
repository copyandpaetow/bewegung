import { bewegung3 } from "../../lib/bewegung";
import { bewegung, CustomKeyframeEffect } from "../../lib/types";

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
				// width: "100%",
				// order: "-1",
				height: "70vh",
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
				// width: "",
				// order: "",
				height: "",
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

const initAdditionalImages = () => {
	const imageWrappers = document.querySelectorAll(".additional__image");

	imageWrappers.forEach((element) => {
		element.addEventListener("click", () => {
			const image =
				element.querySelector("img")! || element.querySelector("div")!;

			let expanded = false;
			if (expanded) {
				bewegung3(
					[
						element,
						{ height: "", width: "" },
						{ duration: 4000, easing: "ease-in" },
					],
					[
						image,
						{ height: "", width: "" },
						{ duration: 4000, easing: "ease-in" },
					]
				).play();
				expanded = false;
			} else {
				bewegung3(
					[
						element,
						{ height: "20vh", width: "30vh" },
						{ duration: 4000, easing: "ease-in" },
					],
					[
						image,
						{ height: "15vh", width: "20vh" },
						{ duration: 4000, easing: "ease-in" },
					]
				).play();
				expanded = true;
			}
		});
	});
};

document.addEventListener(
	"DOMContentLoaded",
	() => {
		initCards();
		initAdditionalImages();
	},
	false
);
