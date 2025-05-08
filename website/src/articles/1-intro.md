# Intro

I love animations. I remember the delight they brought me and how magical it felt when something on a website or app moves. One of the core reason for me to get into web development was to recreate these magical movements - plot twist, this is not that easy.

## what type of animations are there?

not every animation is equally difficult. Some are harder as others. I will try to classify these to make it easier to talk about these:

1. Animation of elements that are isolated
These are very common like loading spinners and background effects but could also be color changes or opening of navigation drawers (including logo animations)

2. Animation of elements that shift parts of the page and/or interacts with other elements
These have a big range but classics are filtering lists, adding or deleting elements, accordions etc.

3. Animation of elements that persist between pages via browser navigation
I have rarely seen those outside of single page apps (SPA), but they will likely get more common with the view-transition API (as long as other browser vendors will include it too or chrome gets even more dominating of the browser market). Barbara.js was one of the libraries that could do these kind of animations before. SPA page transitions are more like type 2.

## requirements for this work

To make this useful to everyone I will start off by explaining several topics and browser APIs that some people are already familiar with. To strike a balance for new and experienced users I will put some of the topics in dedicated info boxes that can be expanded if needed but will try to keep the language beginner friendly. Towards the end, the topics will likely become more complex.

## Why another animation library?

When I started this, there were not that many animation libraries and none of them really used the FLIP technique, the view-transition API was not yet public, and the most framework only had basic animation support. So it wasn't like "another" library like it was another framework for the JS framework scene (it is the law to include at least one of these jokes in any respectable text)

I wanted to really understand how certain things could be animated and by that of course I mean how to animate like Apple did with their landing pages around 2018-2019.

This included:

- animating on scroll
- zoom in and out of elements
- sticky elements
- elements appearing and disappearing

Additionally, I transitioned into the web development world from a science background without any formal training and always feared not to know enough. This sadly never went away. Having my own project also meant I could try out different approaches and algorithms, so I could see for myself if they work or not. This was also a good way to validate "best practices" because I believe many of those to be a relict of their time and passed down as conventional wisdom or "we always did it that way".
The flip-side to being skeptical and curious is the time it takes to move forward. I usually had only one day a week to work on this and the many detours I took prolonged the project quite some time.

// here needs to be more value
// maybe some focus on ux topics or how to split animations in different chunks?
