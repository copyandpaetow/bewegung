import { CustomKeyframeEffect } from "../../lib/types";
import { testThis } from "./test";
import { bewegung2, Bewegung } from "../../lib2/bewegung";
import { BewegungsBlock } from "../../lib2/types";

const initCards = () => {
	const cardsAbortButton = document.querySelector(".cards__button--abort");
	const cardsPlayButton = document.querySelector(".cards__button--play");
	const cardsPauseButton = document.querySelector(".cards__button--pause");
	let activeIndex = 1;
	const cards = Array.from(document.querySelectorAll(".card"));

	const updateIndex = (index: number) => {
		activeIndex = Math.abs((activeIndex + index) % cards.length);
		return activeIndex;
	};

	const getRange = (from: number, to: number, steps = 5) => {
		const value = (to - from) / steps;
		return Array.from({ length: steps }, (_, num) => from + value * num).concat(to);
	};
	const height = getRange(60, 25, 1).map((num) => num + "vh");
	const width = getRange(30, 100, 5).map((num) => num + "%");

	const highlight = () => {
		// const highlightCard: CustomKeyframeEffect = [
		// 	cards[activeIndex],
		// 	{
		// 		height,
		// 	},
		// 	{ delay: 1000, duration: 4000, easing: "ease", rootSelector: "main" },
		// ];

		// const hideOthers: CustomKeyframeEffect = [
		// 	".card:not(.main)",
		// 	{
		// 		height: "",
		// 	},
		// 	{ duration: 2000, easing: "ease-in", rootSelector: "main" },
		// ];

		// const hidePauseButton: CustomKeyframeEffect = [
		// 	cards[activeIndex],
		// 	[
		// 		{
		// 			display: "none",
		// 			offset: 0.2,
		// 		},
		// 		{
		// 			display: "",
		// 		},
		// 	],
		// 	10500,
		// ];

		const changeWidth = (newWidth: number) => {
			const element = cards[activeIndex] as HTMLElement;
			element.style.width = `${newWidth}%`;
		};
		const addSomeAttribute = () => {
			const element = cards[activeIndex] as HTMLElement;
			element.setAttribute("data-test", "something");
		};
		const resetOthers = () => {
			const otherElements = [...cards].splice(activeIndex, 1) as HTMLElement[];

			otherElements.forEach((element) => {
				element.style.width = "";
			});
		};

		const sequence: BewegungsBlock[] = [
			[
				() => {
					changeWidth(100);
					addSomeAttribute();
				},
				{ duration: 2000, at: 0, easing: "ease" },
			],

			// [
			// 	() => {
			// 		const element = cards[0].cloneNode(true) as HTMLElement;
			// 		element.setAttribute("data-bewegungskey", "something");
			// 		cards[0].parentElement?.append(element);
			// 	},
			// 	{ duration: 2000, easing: "ease-out" },
			// ],
			// [
			// 	() => {
			// 		const element = cards[activeIndex] as HTMLElement;
			// 		element.remove();
			// 	},
			// 	{ duration: 2000, at: -200, easing: "cubic-bezier(.5,.25,.8,.6)" },
			// ],
			[() => changeWidth(20), { duration: 2000 }],
			[() => changeWidth(40), { duration: 2000 }],
			[() => changeWidth(60), { duration: 2000 }],
		];

		return bewegung2(sequence, {
			easing: "ease",
		});
	};

	let animation: Bewegung | undefined;
	let paused = false;

	cardsPlayButton?.addEventListener("click", () => {
		if (!animation) {
			animation = highlight();
		}
		animation.playState !== "playing" ? animation.play() : animation.pause();
		paused && animation.pause();
		animation.finished.then(() => {
			animation = undefined;
			updateIndex(+1);
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
	const imageExpandedState = Array.from(Array(imageWrappers.length), () => false);

	imageWrappers.forEach((element, index) => {
		element.addEventListener("click", () => {
			const image = element.querySelector("img")! || element.querySelector("div")!;

			// if (imageExpandedState[index]) {
			// 	const animation = new Bewegung(
			// 		[element, { height: "", width: "" }, { duration: 4000, easing: "ease-in" }],
			// 		[image, { height: "", width: "" }, { duration: 4000, easing: "ease-in" }]
			// 	);
			// 	animation.play();
			// 	imageExpandedState[index] = false;
			// } else {
			// 	const animation = new Bewegung(
			// 		[element, { height: "20vh", width: "30vh" }, { duration: 4000, easing: "ease-in" }],
			// 		[image, { width: "20vh" }, { duration: 4000, easing: "ease-in" }]
			// 	);
			// 	animation.play();
			// 	imageExpandedState[index] = true;
			// }
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
