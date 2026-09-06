\*This is the English version of a [previously published article](https://toss.tech/article/50761).

Hello! We're Sojin Park, Head of Frontend Engineering at Toss, and Dayong Lee, Frontend Developer at Toss Bank.

Today, we'd like to share the story of es-toolkit: how it started as a small utility function library inside Toss and grew into a project downloaded more than 20 million times a week, eventually being adopted by core libraries like Yarn and Recharts.

## \[Sojin\] The Beginning of es-toolkit

As frontend developers, we often need functions like `throttle`, `debounce`, or `uniq`. However, there was no solution we could confidently rely on.

Of course, we could have used a well-known library like lodash. But lodash fundamentally has a dated code structure, and it implements all of its logic from scratch rather than using functions that browsers now provide natively, like `Array#map`. It also carried defensive logic designed for legacy browsers like Internet Explorer, which is code that modern web applications no longer need.

![](https://static.toss.im/ipd-tcs/toss_core/live/ad3de02e-e645-4a40-91a1-30c8864d5a75/image.png)

_An example of lodash code containing unnecessary logic for supporting old browsers_

It also didn't support ECMAScript Modules, making it difficult to include only the logic you actually use through tree-shaking, which is a technique that has become standard in modern web development.

Another option was using a library like `lodash-es`, which simply adds ECMAScript Modules support on top of the existing lodash code. But that still didn't change the fact that the underlying code was old and ran inefficiently.

No matter how hard we searched for a utility library that could replace `lodash`, we couldn't find a true replacement. Our team at Toss even built and maintained its own shared utility library, called `@toss/utils`. But implementing every function ourselves in a shared utility library was a significant burden, and these utility functions often came with numerous edge cases, requiring significant time to handle them.

We came to believe that we needed a well-built, proven library suited for the modern web development environment.

We figured we probably weren't the only ones facing this problem. Sure enough, fellow frontend developers at other companies were reluctantly using `lodash` or `lodash-es`, or building their own utility libraries despite their shortcomings.

So we decided we should build a modern JavaScript utility library based on `@toss/utils`, and that's how the `es-toolkit` project began. The goal was simple: "Build an efficient utility library that strips out lodash's inefficient logic, making performance fast and cutting out unnecessary code."

When we actually went ahead and implemented the core functions that `lodash` provided, the results were astonishing. It varied from function to function, but simply removing unnecessary logic improved speed by at least 2x and up to more than 10x.

![](https://static.toss.im/ipd-tcs/toss_core/live/856f3f09-f59f-4dd2-92bc-182c2b0c14c4/image.png)

_Performance comparison between early es-toolkit functions and lodash functions_

The change in bundle size was even more dramatic. By removing unnecessary code for supporting old browsers and directly using functions already common in modern browsers, like `Array#map`, the bundle size shrank by more than 30x in some cases.

![](https://static.toss.im/ipd-tcs/toss_core/live/fb592478-505e-4ef2-8662-273e6e3b0607/image.png)

_Bundle size comparison between es-toolkit and lodash_

Seeing this, we figured there would be quite a few people who could benefit from the `es-toolkit` library.

## \[Sojin\] Drawing Enthusiastic Attention at Home and Abroad

After building the first version of es-toolkit, we shared the initial results on Toss Frontend's social media. When we did, we received far more attention than we'd expected.

![](https://static.toss.im/ipd-tcs/toss_core/live/d69c9ade-5011-4e40-9b47-9202444de788/image.png)

More frontend developers than we anticipated started using it, and contributions trickled in here and there. People implemented missing functions, fixed bugs, and optimized parts that hadn't been fully optimized.

The strong response we received in Korea made us think this wasn’t a problem unique to Korean developers. So we shared the project on [Reddit](https://www.reddit.com/r/javascript/comments/1dvmd1v/estoolkit_a_23x_faster_and_97_smaller_alternative/) where many international developers gather.

![](https://static.toss.im/ipd-tcs/toss_core/live/0c74bc3c-1fe6-4eda-a0c2-e3129ef6060a/image.png)

The response was overwhelming. It received over 100 upvotes, driving tens of thousands of developers to the repository. Discussions continued for days in the comments, with people asking questions like, “How did you pull this off?” and suggesting ideas such as, “What if you tried doing it this way instead?”

![](https://static.toss.im/ipd-tcs/toss_core/live/8b43b3d5-95a0-4852-8783-dc53c200bc7d/image.png)

As the discussion heated up in the overseas developer community, well-known blogs and newsletters started spreading the word too. And when that happened, even more people began participating.

![](https://static.toss.im/ipd-tcs/toss_core/live/00c277c9-4d09-49cb-815c-10666ccb8159/image.png)

![](https://static.toss.im/ipd-tcs/toss_core/live/32da4e5c-1bbc-40b6-a4fc-ae42cfd99d47/image.png)

People in the community voluntarily built bundler plugins that replace lodash with es-toolkit, and even swapped the dependencies of well-known libraries over to es-toolkit.

![](https://static.toss.im/ipd-tcs/toss_core/live/6c1d0351-a87d-4356-a4e6-5d2a92c8bc5d/image.png)

## \[Dayong\] From Open-Source Contributor to Toss Developer

Even before I knew about the es-toolkit library, I'd always had this question in the back of my mind: "Why aren't there many good open-source projects in Korea?"

Then one day, I happened to come across news about the es-toolkit library on Toss Frontend's Twitter. The news was that es-toolkit, which was faster than the famous lodash library, was getting explosive responses overseas as well.

![](https://static.toss.im/ipd-tcs/toss_core/live/dc1a36f2-3d99-4838-aeee-2f8bf2bb183e/image.png)

I wanted to see a major open-source project from Korea make a meaningful contribution to the frontend ecosystem. On top of that, the project was maintained by a company I had long admired, which made me even more eager to get involved. Because it was open source, I could open a Pull Request even though I wasn't a Toss employee. So I immediately cloned the repository and started contributing little by little, beginning with small issues.

![](https://static.toss.im/ipd-tcs/toss_core/live/7f901ed0-ca21-456f-ab55-ffe9846b4ab4/image.png)

They were small Pull Requests, but it was fulfilling to watch myself contribute as the library gradually improved. So I kept at it, contributing one piece at a time.

Then I happened to meet Sojin in person at an external tech conference. I still remember how warmly he greeted me and how he remembered who I was. It was a short conversation, but I could feel that Sojin shared the same goal: contributing to the frontend ecosystem in Korea. I was also inspired to see him running an OSS project despite his busy schedule.

From then on, I contributed even harder, and that's how I became the #2 contributor.

![](https://static.toss.im/ipd-tcs/toss_core/live/7e33503d-6858-49f3-bd04-5dffc9459eba/image.png)

Through the process of opening Pull Requests to the es-toolkit library and getting them reviewed, I learned a great deal about interface design principles and the JavaScript language. The experience I built up along the way ultimately led to me joining Toss Bank.

## \[Dayong\] Making a Real Contribution to the Frontend Ecosystem

As Sojin, myself, and many contributors from Korea and abroad began contributing to the es-toolkit library, it kept growing more and more complete. But unlike how quickly our library was coming together, adoption was slow. There were still a huge number of people using old versions of utility libraries.

So we asked ourselves: "How can we help more people enjoy the benefits of fast performance and a small bundle size, faster?"

First, we looked at projects already using utility libraries like lodash. Because of the nature of utility libraries, these projects were importing and using many functions all over the codebase. We figured that migrating by swapping each of these many functions one by one would be a real burden. So we concluded that we needed to provide a drop-in replacement for lodash, a way to reap the benefits immediately just by changing the import statement.

Because es-toolkit focused on the major use cases, its behavior often differed from lodash, which accounts for every possible case. As a result, simply swapping in a similar function without much thought could cause runtime errors in some situations.

So we added an intermediate layer that matches lodash's actual interface and behavior as closely as possible, while modernizing only the internal implementation. The idea was to lower the barrier to entry first and turn people into es-toolkit users. That's how `es-toolkit/compat` came about. Just by modernizing the internal implementation, performance got faster and bundle size got smaller.

Once we did this, the tide turned. It wasn't just companies building services. Big open-source projects like Storybook, Mermaid, and Yarn Berry started adopting es-toolkit too. More and more people felt the value of es-toolkit and spread the word. NPM downloads instantly grew exponentially.

![](https://static.toss.im/ipd-tcs/toss_core/live/612b172d-9853-4021-a3e2-b3a986ff9869/image.png)

Feeling the value of es-toolkit myself, and wanting more people to use it, I spent a while actively contributing to external libraries. I did migrations myself and explained in detail the performance es-toolkit offers, going around here and there almost like a salesperson. In that process, even more contributors joined us, and the folks on Toss's Open Source Committee (now the [Slash Team](https://www.slash.page/)) helped out a great deal as well.

Thanks to all of that, es-toolkit is now used in all kinds of places, from big open-source projects like Recharts down to small services. Weekly NPM downloads have surpassed 20 million.

## \[Sojin\] The Future of es-toolkit

es-toolkit has come a long way. So, where is it headed next?

First, es-toolkit aims to keep contributing so that the frontend and JavaScript ecosystem as a whole can make better choices. Just as libraries like Yarn Berry and Recharts ultimately reduced their bundle sizes by adopting es-toolkit, we want even more libraries to be able to enjoy those benefits.

We also want to nimbly catch the need for new functions in the open-source ecosystem and contribute them. For example, we'd like to additionally provide utility functions suited to the latest JavaScript ecosystem, such as cases where it was hard to implement functions like `filter` on built-in data structures like `Map` or `Set` ([#](https://es-toolkit.dev/reference/map/countBy.html)), or the `delay` function ([#](https://es-toolkit.dev/reference/promise/delay.html)) that's often used when working with `Promise`.

Finally, beyond functions used in every JavaScript environment, we want to grow into a comprehensive utility library by also providing the various functions used on the server, such as in Node.js / Deno / Bun environments. We provide high-quality functions that uphold the es-toolkit spirit of "optimizing for over 80% of use cases so it stays small and runs fast." For example, the recently added `exec` function ([#](https://es-toolkit.dev/server/reference/exec.html)) offers a much smaller implementation than competing JavaScript functions while still packing in all the essential features.

es-toolkit aims to be a simple library that makes an outsized contribution to the JavaScript ecosystem. We hope you'll continue supporting and contributing to the project as we work to make es-toolkit a truly world-class library.

* * *

Toss's [Slash Team](https://www.slash.page/) is a team that builds JavaScript/TypeScript packages designed to help the frontend ecosystem, like es-toolkit. We build and ship convenient packages, from es-toolkit to [es-hangul](http://es-hangul.slash.page/) and [overlay-kit](https://overlay-kit.slash.page/). If you'd like to help build libraries that contribute to the frontend ecosystem, come build them with us [here](https://www.slash.page/team)!
