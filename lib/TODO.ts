/*
TODOs

* updates / features

- animation options in the overall options / config file
=> iterations
=> direction?
=> expose the animations?

- since the library is kinda low lever, we could include helper like observers etc

- "at" needs some improvements / aditions
=> how are easings when there is an overlap?
=> should singular BewegungsEntries have iterations?

- cache animations? Let them stay alive?
=> imagine an animation that is performed often but on an interaction (like hovering over a card to expand it)

- stagger?
=> we could set a data-attribute for this if the option is set or the user sets them manually
=> like this there could be some fine tuning from the user
=> if we add a delay, the animation would be finished later. The stagger-delay would need to be included in the calculations...



* bugs

- if you change the sequence entry with at to something negative like [{change: fn1, duration: 1000}, {change: fn2,duration: 1000, at: -3000}], everything breaks :/
- we might need to sort (or error out) the props if the "at" is changing the entry so much, that it actually changes the order of the sequence
=> the example above would need to be [{change: fn2, duration: 1000}, {change: fn1,duration: 1000, at: 1000}]

- we might need some meta data because the jumping issue is based on the viewport
=> we could also generate 2 sets of keyframes and chose based on the viewport
=> since there could be a delay between the generation of the animation and its playing, we would need to decide at playtime

- counter scaling looks still buggy => easing issue

- if the root element is removed, its absolute position might lead to bugs because we dont know the next anchor parent
=> maybe we would need to change the code in a way that the parent is the first non-animation element
=> that also would make rootCalculations easier but it is unclear if the weird browser fix could be implemented otherwise

- if the user sets transform or clipPath, we will override them

- display: none is meaningless to see if an element is onscreen. We should focus on the actual dimensions instead

- if any element is already included in another animation, it might lead to confusions
=> hash/salt the keys with an animation id? But what if the user sets a key manually?

- it looks like if the image becomes bigger than the parent via implicit overflow, that the image calculations are off
? maybe the wrapper style is missing something good to compare to?

- the easings could maybe be better included within the tree data instead of a data-attribute
- then we could also add a root attribute, which is more descriptive


* tasks

- update docs

*/

/*
* example 1
? maybe this could also be done with a base promise and adding .then over and over again

const bewegung3 = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {

	let normalizedProps = normalize(props, config)
	let api = null;
	let whileInProgress = []

	const setApi = async (method: string) => {
		whileInProgress.push(method)
		if(whileInProgress.length> 1 && api === null){
			return
		}

		try {
			if(preferesReducedMotion){
				throw "reducedMotion"
			}
			api = await animationController(normalizedProps)
	
		} catch (error) {
				if(error === "recalc"){
					normalizedProps = updateProps(normalizedProps) 
					api = await animationController(normalizedProps)
					return
				}
				console.warn(error)
				api = emptyApi()
	
		} finally {
			while (whileInProgress.length) {
					api[whileInProgress.shift()]()
			}
		}
	}

...
}


! things that didnt really work

- combining the labeling with the inital readout doubled the labeling time

- reading all callouts after each other => the overhead of setting things up takes some time

- combining all independent changes into one because the reading takes so long

- intersection observer 
=> cloning or hiding the actual dom to do changes there
=> cloning will take a long time because the browser needs a calculate all elements new (and render images new)
=> hiding the dom with an image or an svg takes very long since the visible dom needs to be rebuild

- from/to
=> modals are kinda annoying to do if you need to calculate them yourself
=> if we use from/to as the last or first spot only it is not that difficult
=> we could use a number to indicate the function call to which it belongs to like "data-bewegung-from-1" (default would be "data-bewegung-from-0")
=> maybe we could use them internally to indicate relationships? 

*/
