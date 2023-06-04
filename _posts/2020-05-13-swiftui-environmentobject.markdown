---
layout: post
title:  "SwiftUI: EnvironmentObject as Dependency Injection"
description: "Though it really sounds like a global singleton."
tags: [ios, swift]
categories: [post]
emoji: 💉
---
This toy counter could illustrate how to leverage `EnvironmentObject` as dependency injection to flow data around the app. It only maintains one global app-wise state `count` and supports two functionalities:

1. On one view, increase/decrease the `count`, and show its current updated value.
2. On another view, show the up-to-date value of `count`.

{% splash %}
// MARK - Source of Truth
class SourceOfTruth: ObservableObject {
    @Published private(set) var value: Int = 0
    func increase() { value += 1 }
    func decrease() { value -= 1 }
}

// MARK - View
struct SourceOfTruthReadView: View {
    @EnvironmentObject var sourceOfTruth: SourceOfTruth
    
    var body: some View {
        Text("Sourth of truth is \(self.sourceOfTruth.value)")
    }
}

struct SourceOfTruthUpdateView: View {
    @EnvironmentObject var sourceOfTruth: SourceOfTruth
    
    var body: some View {
        HStack {
            Button(action: { self.sourceOfTruth.decrease() }) { Text("-") }
            Text("\(self.sourceOfTruth.value)")
            Button(action: { self.sourceOfTruth.increase() }) { Text("+") }
        }
    }
}

struct ContentView: View {
    let updateView: AnyView
    let readView: AnyView
    
    var body: some View {
        NavigationView {
            List {
                NavigationLink(destination: updateView) {
                   Text("Update source of truth")
                }
                NavigationLink(destination: readView) {
                    Text("Read source of truth")
                }
            }
        }
    }
}

// MARK - Put things together
let sourceOfTruth = SourceOfTruth()
let sourceOfTruthUpdateView = SourceOfTruthUpdateView().environmentObject(sourceOfTruth)
let sourceOfTruthReadView = SourceOfTruthReadView().environmentObject(sourceOfTruth)
let contentView = ContentView(
  updateView: AnyView(sourceOfTruthUpdateView),
  readView: AnyView(sourceOfTruthReadView)
)

{% endsplash %}

Nothing really changes right? I mean, building with SwiftUI in a *production* way. The `SourceOfTruth` is still *injected* into different components (vs. accessed from singleton), and we can still easily swap out the implementation of `SourceOfTruth` for a subclass to build a dependency graph that’s used for testing. And yeah, `count` is a *read-only* `@Published` by setting access control as `private(set)`, so that read and write are separated. 
