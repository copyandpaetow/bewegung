# humble beginnings

for work I had the opportunity to write some articles about any topic where I chose to write about flip and requestAnimationFrame animations in detail. This was a lot of fun but left me unsatisfied in my quest to understand how to animate all the things. The example for the flip animation I was using could only transition one element. This is also how most tutorials and articles were covering the topic and it made me wonder what I would need to animate more than one element / how far one could take this approach towards a viable animation library.

To explain the issue a little further: Imagine having 3 sibling elements. If we increase the size of the first one, the other elements have to move. If we just animate the first one, it will stay after the dom change at its position and animate beautifully but the other ones will jump straight to their final position.  

## 1. lets flip all the things first, ask questions later

It is not easy to guess/estimate something if we don't know what issues might arise. This is why I like just starting of with simple test implementation and see what difficulties come out of it.
So a super naive, initial approach was

- to get all the participating elements
- do the flip technique for each of them

which might look like this:

```js
//pseudo code

//the user provides a callback to change the dom and some options that are used in the keyframes
const naiveFlipAnimation = (domChangeFunction: VoidFunction, options: KeyframeOptions) => {
	const elements = Array.from(document.body.querySelectorAll("*"))

	const before = elements.map(readDomFunction)

	domChangeFunction()

	const after = elements.map(readDomFunction)
	const keyframes = after.map((currentReadouts, index) => calculateKeyframes(before[index], currentReadouts))

	elements.forEach((element, index) => element.animate(keyframes[index], options))
}

```

This has several drawbacks:

### We need to reduce the element count as most websites have a huge DOM

They are likely somewhat old and were written by different people with different views, skillsets and priorities. If you only getting paid to implement features, refactorings become an afterthought. I also encountered the cliché of the React developer several times, who doesn't really care about HTML and CSS and adds a div whenever they see the chance.

//this could be less mean as people don't do this on purpose

A bigger site with 1500+ elements is not uncommon and makes it a little difficult for the CPU to just get all the dimensions twice, while also change the DOM including all the related internal recalculations. This will even bring beefy computers / the newest iPhone to halt for a short time.

As you can see in our naive approach, we iterate 4x the length of the elements array. Reducing the length of the array somehow will yield the greatest performance improvements as we reduce operations further (4x1000 to 4x100 is far less than 4x1000 to 3x1000) which is why this topic will be a reoccurring thing.

=> this means we need to somehow limit the depth of how many elements we need to read. Since we can't know which elements have changed without measuring them first, we can only forward this task to the users of our library. They likely know which elements are affected by a change. The options object could feature a root element entry that scopes our initial elements pool to a smaller one.

### We need to address Parent child relationship in our calculations

Most of the time only a few elements are directly affected by a change and there are a lot of elements that only change as a result of the initial change like toggling an accordion moves the page further down as well as all elements after it but the change only happens at one element.

#### translate

In that case a lot of elements move but most of them move together. Most likely only the direct sibling elements need to actually move but we don't know that from the readouts. Both the sibling element and its child elements will move by e.g. 300px. If we flip both, the position of the child will be off by 300px.

//example here

=> to solve this issue we need to correct the child dimension by the parent dimensions

#### scale

Changing the elements dimensions via scale has the same effect on all its children, so we need to counter scale those additionally to their own changes.

//example here

If scale is used in a `transform` property, it might also need to be applied to its on translate values, since they apply after another (from right to left) and might affect each other.

//example here

=> we need to counter scale the parents translate values as well as the children scale

### We didn't account for DOM structure changes

If our users just wanted to change some margin or the order in a flex container, we would be golden with our current approach but if they added or removed an element the calculations would be off in different ways.

- the indices would not match anymore
- an added element would not have any initial data to compare against. Even JS with all its little quirks can't divide by undefined
- not only do removed elements have this problem as well, but additionally they are not in the dom anymore after the `domChangeFunction`. How to animate that?

The less difficult version of this problem is animating to/from `display: none`. We still get a readout but its just `0` for all the dimensions.

=> We first need to store elements in a different way. ES6 Maps/WeakMaps are interesting for this approach as they can use a dom element as key. Maps will store our elements but if they are getting removed, they are still in the Map and we would need to updated that manually. Cue WeakMaps: They will forget the value if the key has no reference anymore, which in our case would be when the dom element gets removed. This is nice, so there are no memory leaks but they cant be iterated though, which means we would still need to keep a list of dom elements around.

=> We need to find a way to get the missing dimensions for added/removed/display-noned elements and keep them in the dom (but out of sight). Spoiler alert: This turned out to be a difficult problem I could have skipped but this was one of the missing features of the current animation library landscape and I personally think, it is better if it is hard for me and simple for the user than the other way around. This will be addressed in its own chapter.

### We want more control for the users

One of the classic UX examples for websites is "our website should behave and work like all the other websites, so the user is not confused" which I also liked for this library. If it should be easy to use, it would be ideal if it can be used like something the users are already familiar with. I took inspiration from the WAAPI but wanted it simpler: Just provide an element, what styles you want to change and maybe some options.

=> We need to change the overall API

## Intermediate result

After all the considerations, we can update our library to tackle most of the issues we talked about

```js
//pseudo code 

const naiveFlipAnimation = (element: HTMLElement, cssChanges: Keyframe, options: KeyframeOptions &{root: HTMLElement}) => {
	const elements = getRootElementAndDescendants(element, options.root)
	const parentElements = getParentElements(elements)
	const before = storeReadoutsInAMap(elements)

	applyKeyframes(element, cssChanges)

	const after = storeReadoutsInAMap(elements)
	const keyframes = new Map<HTMLElement, Keyframe>()

	after.forEach((currentReadout, element) => {
		const parent = getParent(element, parentElements)
		const parentReadouts = getParentDimensions(parent, before, after)
		const previousReadout = getReadout(element, before) ?? getFallbackReadouts()

		keyframes.set(element, calculateKeyframes(previousReadout, currentReadout, parentReadouts))
		before.delete(element)
	})

	keyframes.forEach((keyframe, element) => element.animate(keyframes, options))
}
```

It got more complex but will do a better job. With this we also sneakily avoided the difference in the DOM Tree since the user can only input css changes and our issue got a little easier. To avoid breaking the universe by dividing by 0, we provide a fallback to the previous readouts.
