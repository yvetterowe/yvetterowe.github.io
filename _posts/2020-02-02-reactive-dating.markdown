---
layout: post
title:  "Reactive Dating"
description: "All the world's a stream, and all the men and women merely observables."
tags: [tech, reactiveprogramming]
categories: [post]
emoji: 💑
---

> Change is the only constant.

> If anything can go wrong, it will.

> This being human is a guest house. Every morning is a new arrival. A joy, a depression, a meanness, some momentary awareness comes as an unexpected visitor… Welcome and entertain them all. Treat each guest honorably. The dark thought, the shame, the malice, meet them at the door laughing, and invite them in. Be grateful for whoever comes, because each has been sent as a guide from beyond. 

I bet you run into these epigrams from time to time on the internet, even if all you want are memes and dogs.

They bring up a lot of challenges in real life, as well as in building software. But don't panic, [reactive programming](https://www.reactivemanifesto.org/) could come to the rescue. We could start from a real-world example - _dating_, and see how the reactive manner helps you build a peace of mind. Why dating? Because if concurrency is the hardest problem in the world, dating probably comes to the next. 

### Your date is flaky.
Ok, imagine you meet someone online and you're planning out dinner. 
> EXT. SUBWAY STATION - MONDAY NIGHT <br>
> *You open the dating app, see the message from your date.* <br>
> **YOUR DATE**: Are you free this Friday at 7pm? I was thinking to have dinner at Masa (_a 3 Stars MICHELIN restaurant_) <br>
> **YOU:**  *(ecstatically, in love)* Yeah sounds good! I'd love to. <br>
> <br>
> INT. YOUR DATE'S APARTMENT - WEDNESDAY NIGHT <br>
>*Your date stairs at the W2 tax form.* <br>
> **YOUR DATE:** (Hmmm, Masa is way too expensive. I'll just take her to 99cents pizza.) <br>
> <br>
> EXT. WAY TO 99CENTS PIZZA - FRIDAY NIGHT 6:50PM <br>
>*Your date gets paged on the way to 99cents pizza.* <br>
> **YOUR DATE:** (What the hell...I gotta head back to the office now...) 

### And you're _imperative_.
Your date seems a bit flaky. And you are young and naive and ... TL; DR _imperative_ :
> INT. YOUR APARTMENT - TUESDAY NIGHT <br>
> *You're bored and anxious to death.* <br>
>**YOU:** *(calling your date)* <br>
>**YOUR DATE:** *(no answer)* <br>
>**YOU:** *(half an hour later, calling your date again)* <br>
>**YOUR DATE:** *(still no answer)* <br>
>**YOU:** *(another half an hour later, calling your date again and again)* <br>
>**YOUR DATE:** Hey there? <br>
>**YOU:** Where were you ?? Just confirm we'll have dinner at Masa this Friday right? <br>
>**YOUR DATE:** Yea. <br>
>**YOU:** *(ecstatically, in love)* Great! <br>
> <br>
> INT. SAKS FIFTH AVENUE, - WEDNESDAY NIGHT <br>
>*You stand before the mirror, trying out various fancy dresses. You get the \$\$\$\$ one.* <br>
> **YOU:** (l'll be shining at the fancy dinner table.) <br>
> <br>
> INT. MASA, - FRIDAY NIGHT 7PM <br>
> **YOU:** Reservation for two, the name is under My Date. <br>
> **WAITER:** Sorry, we don't have a reservation under this name. <br>
> **YOU:** *(surprised and confused, calling your date)* <br>
> **YOUR DATE:** *(debugging concurrency, no answer)* <br>
> **YOU:** *(calling again and again and again, for an hour)* <br>
> **YOUR DATE:** Hey there? <br>
> **YOU:** Where are you?? I'm at Masa but there's no reservation under your name. <br>
> **YOUR DATE:** Ahhh sorry I forgot to tell you I decided to take you to 99cents pizza instead. And...I just got paged and am debugging in the office... <br>
> **YOU:** (?!??!?!?) <br>
> *You hang off the phone, feeling lost. You head to a movie theater but find all tickets are sold out. You head home, cry your heart out for the whole night, and wake up not believing in love anymore.*

### But you can also be _reactive_.
It's tough. It sucks. HUUUUGS. But...if you believe in parallel world, there's probably another _reactive-you_ who handles these sh*tty situations more gracefully :
> EXT. SUBWAY STATION - MONDAY NIGHT <br>
> *You just accept the dinner invite from your date.* <br>
> **YOU:** Hey btw could you send a calendar invite to me? If you want to change the place or time, just update the calendar to let me know. <br>
> **YOUR DATE:** Sounds good. I'll _try_. <br>
> **YOU:** And if I don't see you after 10 minutes, I'll just assume the plan is canceled. <br>
> **YOUR DATE:** Sounds good. <br>
> <br>
> EXT. WAY TO SAKS FIFTH AVENUE, - WEDNESDAY NIGHT <br>
>*You get a calendar push notification.* <br>
> **YOU:** ("Your Friday dinner place is updated to 99cents pizza..." Wut? Well fine, good to know before I spend \$\$\$\$ on the dress, save some money.) <br>
*You head back home directly, buy a movie ticket for Friday night online, just in case the plan is canceled so you still have some backup fun.* <br>
> <br>
> INT. 99CENTS PIZZA - FRIDAY NIGHT 7:10PM <br>
> *Your date still not shows up yet.* <br>
> **YOU:** (Ok maybe he got paged... anyway, time for the movie!) <br>
> *You head to the movie theatre and have a wonderful night.*

Facing the same situation, let's do a simple comparison between _imperative-you_ and _reactive-you_ :

| Situation | _Imperative-you_ | Reactive-you |
| --- | --- | --- |
| You want to make sure the dinner is on track. | You waste time calling your date day and night. | You get a calendar update notification. |
| Your date changes dinner place. | You don't know so you waste \$\$\$\$ on the dress and go to the wrong place. | You get notified so you save \$\$\$\$ from the dress and go to the right place. |
| Your date doesn't show up on time. | You're not sure what's going on and it's too late for a backup plan. | You assume your date won't show up because it's over 10 mins. You go to see the movie because you get the ticket in advance. |

Let's see how _reactive you_ embraces the key features of a reactive system defined in the [manifesto](https://www.reactivemanifesto.org/):

#### Responsive 

> The system responds in a timely manner if at all possible. Problems may be detected quickly and dealt with effectively.

You immediately decide to drop that \$\$\$\$ dress upon knowing you won't go to the \$\$\$\$ dinner. You won't go to the wrong place. Basically you won't be shocked if the plan is changed because you know what to do next accordingly. You're responsive that Friday night and days after because your energy is not focused on suppressing inner chaos, at the expense of spontaneous involvement in your life.

#### Resilient

> The system stays responsive in the face of failure. Failures are contained within each component, the client of a component is not burdened with handling its failures.

You two have set up rules on calendar invite and waiting time. So even if your date forgets to update the calendar invite or doesn't show up on time, you won't be completely messed up because you're prepared in advance for that case. _Failure_ is unexpected while _error_ is not. You treat error and normal cases equally to protect yourself being corrupted. Again, take the contract seriously. The boundary forces you to be brutally honest with yourself, but eventually ensures that you have no obligation to pay for other people's faults.

#### Elastic

> The systems can react to changes in the input rate by increasing or decreasing the resources allocated to service these inputs.

You save \$\$\$\$ from that dress! If your date cancels the plan, you have more time to spend with family and friends. Basically you have full control of the pace of your life.

#### Message Driven

> The systems rely on asynchronous message-passing to establish a boundary between components that ensures loose coupling, isolation and location transparency.

You embrace the fact that everyone has their business to take care of, so you're cool and won't be that needy when they're not always right there for you. You spend your time doing something fun instead of calling your date all day. You trust your date will stick to the rule, so you'll get notified when necessary. Again, if not, it's not your fault and it's not the end of the world.

### At the end of the day ...
To be that _reactive-you_ is about mastering the skill of self-regulation and self-leadership. You enjoy being present at the moment, as well as anticipating the discomfort and strengthening your capacity to deal with distress.

Everything comes with a cost, though. If your date sticks to the plan, you probably waste your money on that redundant movie ticket.

Or maybe you just want to embrace the unexpected and be vulnerable sometimes? After all, human beings are much more fascinating than machines.
