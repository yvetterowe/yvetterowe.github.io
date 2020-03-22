---
layout: post
title:  "Enum is All About Expressiveness"
description: "Not-that-hard choices, easy life."
tags: [ios, swift]
categories: [tech]
---
[Enum](https://docs.swift.org/swift-book/LanguageGuide/Enumerations.html) is one of my favorite gems empowered by Swift's strong type system. As mentioned in [The Elements of UI Engineering](https://overreacted.io/the-elements-of-ui-engineering/), making _state_ consistent and predictable despite its entropy is a crucial part of building a delightful user experience. A properly designed data structure that could express _"This is exactly what I mean. Period."_ and _"That absolutely can't happen to me. Period."_ explicitly will make the state management less painful. 

Suppose we want to build the home screen of a stock trading app, where users' investment portfolio is rendered. A simple model object that represents a portfolio holding could be something like this:

```swift 
struct PortfolioHolding {
    let stockID: String
    let numberOfShares: Int
    // other properties
}
```  
<br/>
And portfolio home screen could be modeled as:

```swift
struct PortfolioHomeScreenModel {
    var portfolioHoldings: [PortfolioHolding]
}
```
<br/>
Then view controller could render the view based on this model:

```swift
class PortfolioHomeScreenViewController: UIViewController {
    func apply(model: PortfolioHomeScreenModel) {
        // render view based on `model`
    }
}
```
<br/>
Then at some point, the view controller gets confused - because there are multiple scenarios that could cause this `portfolioHoldings` to be empty, and we definitely want to render different contents for them:
1. User puts all money in checking account, hasn't made any investment yet - we want to render an ***onboarding state***
2. User has made some investments before but sold them all to purchase a house - we want to render an ***empty state***
3. User is still holding some stocks but runs out of 4G data ... - we want to render a ***loading state***

Our current `PortfolioHomeScreenModel` can't really differentiate these contexts. Let's refine it a bit with enum type:
```swift
struct InvestmentHomeScreenModel {
    var loadingState: LoadingState
    var investmentState: InvestmentState
    
    enum LoadingState {
        case loading
        case loaded
    }
    
    enum InvestmentState {
        case neverInvested
        case invested([InvestmentHolding])
    }
}
```

<br/>
Much better! Now we could represent the 3 states as follow:
1. Onboarding state:  `(loadingState: .loaded, investmentState: .neverInvested)`
2.  Empty state: `(loadingState: .loaded, investmentState: .invested([]))`
3.  Loading state: `(loadingState: .loading, investmentState: ???)`

But...I bet you notice the problem, for *loading state* we're not sure which value should be assigned to `investmentState` . Given both `LoadingState` and `InvestmentState` contain _2_ cases, their combination contains _2 * 2 = 4_ cases, but we only need _3_. 

Let's eliminate that overhead:

```swift
struct PortfolioHomeScreenModel {
    var loadingState: LoadingState
        
    enum LoadingState {
        case loading
        case loaded(InvestmentState)

        enum InvestmentState {
            case neverInvested
            case invested([PortfolioHolding])
        }
    }
}
```
<br/>
Then the 3 states could be represented as:
1. Onboarding state: `(loadingState: .loaded(.neverInvested))`
2. Empty state: `(loadingState: .loaded(.invested([])))`
3. Loading state: `(loadingState: .loading)`

Then view controller could render the view based on an expressive and unambiguous model: 
```swift
func apply(model: PortfolioHomeScreenModel) {
    switch model.loadingState {
        case .loading:
            // render loading state
        case let .loaded(investmentState):
            switch investmentState {
                case .neverInvested:
                    // render onboarding state
                case let .invested(portfolioHoldings):
                    if portfolioHoldings.isEmpty {
                        // render empty state
                    } else {
                        // render normal non-empty state
                    }
            }
    }
}
```
<br/>
Swift's own built-in API also embraces enum everywhere, some examples are :
* [`Optional`](https://github.com/apple/swift/blob/master/stdlib/public/core/Optional.swift) is an enum under the hood.
* [`Result`](https://github.com/apple/swift/blob/master/stdlib/public/core/Result.swift) eliminates the impossible state that _success_ and _failure_ could be presented at the same time in a completion block [like this](https://developer.apple.com/documentation/foundation/urlsession/1410330-datatask).
* [`fatalError`](https://github.com/apple/swift/blob/0d87a14785796380d29e8dc18cfe6c8e1fb660bc/stdlib/public/core/Assert.swift#L190) actually has a return value called [`Never`](https://developer.apple.com/documentation/swift/never), which is an empty enum.

Not-that-hard choices, but easy life! With all that, a user with a well diversified and high ROI portfolio is less likely to wake up to a home screen being told "Hey, let's make your first investment", freak out, uninstall the app, and give a 1 star on App Store.

Happy enuming!
