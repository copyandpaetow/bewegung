import { Bewegung } from "../../lib/bewegung";
import { CustomKeyframeEffect } from "../../lib2/types";
import { Bewegung2 } from "../../lib2/bewegung";

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
				width: ["30%", "100%", "55%"],
				height: ["50vh", "25vh", "65vh"],
			},
			{ duration: 4000, easing: "ease" },
		];

		const hideOthers: CustomKeyframeEffect = [
			[...cards].filter((_, index) => index !== activeIndex),
			{
				width: "",
				height: "",
			},
			{ duration: 4000, easing: "ease-in" },
		];

		return new Bewegung2(highlightCard, hideOthers);
	};

	let animation;
	let paused = false;

	cardsPlayButton?.addEventListener("click", () => {
		highlight();
		// if (!animation) {
		// 	animation = highlight();
		// }
		// animation.playState !== "running" ? animation.play() : animation.pause();
		// paused && animation.pause();
		// animation.finished.then(() => {
		// 	animation = undefined;
		// 	updateIndex(+1);
		// 	console.log("finished");
		// });
	});
	// cardsPauseButton?.addEventListener("click", () => {
	// 	paused = !paused;
	// 	cardsPauseButton.innerHTML = `start paused: ${paused}`;
	// });
	// cardsAbortButton?.addEventListener("click", () => {
	// 	animation?.cancel();
	// 	updateIndex(+1);
	// 	animation = undefined;
	// });
};

const initAdditionalImages = () => {
	const imageWrappers = document.querySelectorAll(".additional__image");
	const imageExpandedState = Array.from(
		Array(imageWrappers.length),
		() => false
	);

	imageWrappers.forEach((element, index) => {
		element.addEventListener("click", () => {
			const image =
				element.querySelector("img")! || element.querySelector("div")!;

			if (imageExpandedState[index]) {
				const animation = new Bewegung(
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
				);
				animation.play();
				imageExpandedState[index] = false;
			} else {
				const animation = new Bewegung(
					[
						element,
						{ height: "20vh", width: "30vh" },
						{ duration: 4000, easing: "ease-in" },
					],
					[image, { width: "20vh" }, { duration: 4000, easing: "ease-in" }]
				);
				animation.play();
				animation.pause();
				imageExpandedState[index] = true;
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
