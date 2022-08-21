import { bewegung } from "../../lib/bewegung";
import { Bewegung, CustomKeyframeEffect } from "../../lib/types";
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
				// transform: [
				// 	"translate(0px, 0px) rotate(0deg)",
				// 	"translate(-100px, -100px) rotate(45deg)",
				// 	"translate(100px, 100px) rotate(-45deg)",
				// ],
				// order: "-1",
				// height: "60vh",",
			},
			{ duration: 4000, easing: "ease" },
		];

		const hideOthers: CustomKeyframeEffect = [
			[...cards].filter((_, index) => index !== activeIndex),
			{
				//width: "",
				//transform: "",
				// order: "",
				// height: "",
			},
			{ duration: 4000, easing: "ease-in" },
		];

		return new Bewegung2(highlightCard, hideOthers);
		//return bewegung(highlightCard, hideOthers);
	};

	let animation: Bewegung | undefined;
	let paused = false;

	cardsPlayButton?.addEventListener("click", () => {
		if (!animation) {
			animation = highlight();
		}
		animation?.play();
		// console.log(animation.playState());
		// animation.playState() !== "running" ? animation.play() : animation.pause();
		// paused && animation.pause();
		// animation.finished.then(() => {
		// 	animation = undefined;
		// 	updateIndex(+1);
		// 	console.log("finished");
		// });
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
	const imageExpandedState = Array.from(
		Array(imageWrappers.length),
		() => false
	);

	imageWrappers.forEach((element, index) => {
		element.addEventListener("click", () => {
			const image =
				element.querySelector("img")! || element.querySelector("div")!;

			if (imageExpandedState[index]) {
				bewegung(
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
				imageExpandedState[index] = false;
			} else {
				bewegung(
					[
						element,
						{ height: "20vh", width: "30vh" },
						{ duration: 4000, easing: "ease-in" },
					],
					[image, { width: "20vh" }, { duration: 4000, easing: "ease-in" }]
				).play();
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
