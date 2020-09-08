---
layout: post
title:  "SwiftUI: View is not UIView"
description: "And body is not setNeedsLayout."
tags: [ios, swift]
categories: [tech]
emoji: ⾝
---

To deliver a smooth user experience with UIKit, we usually want to refresh the view only when it's necessary instead of calling `setNeedsLayout`, `layoutIfNeeded` or `layoutSubviews` brainlessly. Same with SwiftUI, we also want to be mindful of view update performance. 

SwiftUI has multiple ways to achieve the reactive-style data-driven UI update, eg. `State` for local state and `ObservedObject` for external data source. For example, suppose there's an  `AvocadoView` that renders the number of avocado in the inventory, an `AvocadoStore` and an `AvocadoView` could be defined like this:

{% splash %}
final class AvocadoStore: ObservableObject {
    @Published private(set) var avocadoCount: Int
}

struct AvocadoView: View {
    @ObservedObject var avocadoStore: AvocadoStore
    
    var body: some View {
        print("Refreshing 🥑 view")
        return Text(String(repeating: "🥑", count: avocadoStore.avocadoCount))
    }
}
{% endsplash %}

It's summertime, let's get some peaches 🍑 as well. In practice, they probably live together with avocados in the same store.

{% splash %}
final class FruitStore: ObservableObject {
    @Published private(set) var avocadoCount: Int
    @Published private(set) var peachCount: Int
}

struct AvocadoView: View {
    @ObservedObject var fruitStore: FruitStore
    
    var body: some View {
        print("Refreshing 🥑 view")
        return Text(String(repeating: "🥑", count: fruitStore.avocadoCount))
    }
}
{% endsplash %}

Then here comes an interesting problem with `ObservableObject` and `@Published` property wrapper. Suppose someone steals the peaches, which causes `FruitStore` to publish a new value of  `peachCount`. Should  `AvocadoView` be affected in this case? Ideally not. But in reality, I found that the `body` of `AvocadoView` is indeed re-constructed ("Refreshing 🥑 view" is logged). This is because `AvocadoView` observes on the whole `FruitStore`, which makes it re-flow its body as long as any of store's `@Published` property gets updated (aka. "published") - even though only `avocadoCount` is referenced in `body`.

Hmm, this is not good. We should probably embrace *Single-responsibility principle* here to make `AvocadoView` only observe on `avocadoCount`, the data it cares about. In practice, `FruitStore` probably still has to exist to serve some aggregation functionality, or it could simply be it's already a GOD hairball object that's basically impossible to break down easily (yea you know what I'm talking about don't you 🌚). But fortunately enough:

> We can solve any problem by introducing an extra level of indirection.

So I followed the calling by introducing a small and sweet  `AvocadoStore`:

{% splash %}
final class AvocadoStore: ObservableObject {
    @Published private(set) var avocadoCount: Int = 0
    private var cancellable: AnyCancellable!
    
    init(fruitStore: FruitStore) {
        cancellable = fruitStore.$avocadoCount
            .sink { avocadoCountInFruitStore in
            self.avocadoCount = avocadoCountInFruitStore
        }
    }
}

struct AvocadoView: View {
    @ObservedObject var avocadoStore: AvocadoStore
    
    var body: some View {
        print("Refreshing 🥑 view")
        return Text(String(repeating: "🥑", count: avocadoStore.avocadoCount))
    }
}
{% endsplash %}

What `AvocadoStore` basically does is to bridge `FruitStore` and `AvocadoView` while preventing `AvocadoView` from being exposed to irrelevant noise (`peachCount` in our case). This all sounds right...but do we really need it?

I was deriving all my solutions so far based on an assumption: a `View` is like a `UIView` - and calling `body` is like calling `setNeedsLayout` or `layoutSubviews`, which eventually leads to a view refresh. But the assumption is *wrong*, and it is exactly the major difference between SwiftUI and UIKit - the declarative and the imperative. In SwiftUI, `View` is a `struct` value type used to *describe* a view's content and behavior - it's not the view itself. And that's it, the SwiftUI infrastructure will take care of the heavy lifting. In our original implementation, it's true that `AvocadoView` ’s `body` gets called whenever `fruitStore.peachCount` is updated - but it's also true that it gets called with the same `fruitStore.avocadoCount` value each time. The SwiftUI infra will be smart enough to process these `body` update messages and figure out what to do: "Last time it says there are X avocados, this time it's still X. Nothing changes, just sit back and chill."

Don't get me wrong - I'm not saying introducing `AvocadoStore` is completely worthless here. From the API design and dependency management perspective, it still makes a lot of sense - like how we use thin protocols to break down a fat class. It's just the goal is not to correct a *fundamental fault* anymore. Bringing in a layer of indirection reduces coupling but could also fall part when it over complicates things - and that's the tradeoff we need to make in production codebase at scale, case-by-case.
