---
layout: post
title:  "Validate Bitcoin Transaction"
description: ""
tags: [cryptocurrency]
categories: [post]
emoji: 🤑
---

The implementation and test cases mentioned in this post can be found [here](https://gist.github.com/yvetterowe/de42b30a7ef5cdc6e5c5a0312302c3f3).

## The Trust Issue

When talking about accepting digital money, people usually have some basic concerns:

1. Can I trust that the money is authentic and not counterfeit ?
2. Can I trust that the money can only be spent once ?
3. Can I trust that no one else can claim this money belongs to them and not me ?

Paper money address these concerns by its physical presence nature and advanced print technologies. For fiat money that is stored and transmitted digitally (eg. credit card, P2P payment apps, etc.), these issues are usually resolved by introducing central authorities that have a global ledger of the currency in circulation. 

Same requirements apply to cryptocurrency like Bitcoin as well. If it fails either of them, it loses the trust. In this post, I'm building a simplified version (yes, no fancy Merkle tree, Script, Proof-of-Work, etc.) of Bitcoin transaction verification system for a single node - with the end goal to fool it, and lose trust on it.

## What does a Bitcoin transaction look like ? 

The Bitcoin system works like a [double-entry bookkeeping ledger](https://en.wikipedia.org/wiki/Double-entry_bookkeeping), in which all the information about a money movement is encoded in a [Bitcoin transaction](https://en.bitcoin.it/wiki/Transaction) . Most standard P2P transactions consist of `inputs` and `outputs`, where the former describes where the fund comes from and the latter describes where it’ll end up at. [Coinbase transaction](https://bitcoin.org/en/glossary/coinbase-transaction) is an exception that doesn’t have any `inputs` because instead of transferred from a previous owner, it’s created by miners. Also, each transaction can be identified with a unique [Transaction Identifier (TXID)](https://bitcoin.org/en/glossary/txid), which is the hash of raw transaction data.

{% splash %}
enum Transaction {
    case coinbase(id: ID, outputs: [Output])
    case standard(id: ID, inputs: [Input], outputs: [Output])
}
{% endsplash %}

`Output` gives instructions on transferring the Bitcoin: *to whom* and *how much.*

{% splash %}
struct Output {
    let recipientAddress: Address
    let value: Coins
}
{% endsplash %}

Remember that in order for the double-entry ledger to neither lose money nor create money out of thin air, an `Input` of a transaction must refer to the  `Output` of a previous transaction.

Here’s how this connection is bridged. Whenever an `Output` is generated, it’s “dumped” into a pool where it waits to be redeemd by the new owner. It maintains a temporary identity as [Unspent Transaction Output (UTXO)](https://bitcoin.org/en/glossary/unspent-transaction-output) during this grace period. 

{% splash %}
struct UnspentTransactionOutputID: Hashable {
    let txID: ID
    let txOutputIndex: Int
}

let utxoPool = [Transaction.UnspentTransactionOutputID: Transaction.Output]()
{% endsplash %}

When the new owner is ready to redeem the money payable to her, she starts assembling her `Input` that could be used to locate  `Output` in the pool.

{% splash %}
struct Input {
    let previousTxID: ID
    let previousTxOutputIndex: Int
    let signature: Signature
}
{% endsplash %}

{% splash %}
let utxoID = UnspentTransactionOutputID(txID: input.previousTxID, txOutputIndex: input.previousTxOutputIndex)
let utxo = utxoPool[utxoID]
{% endsplash %}

But remember that this located `utxo` can be spotted by everyone, not limited to the recipient. Then does that mean everyone can just pick it up from the pool and claim it as theirs? Good luck with that.  

`Signature` comes to the rescue. When an `Output` is dumped to the pool with `recipientAddress`, it follows such a protocol

> I’m payable to whomever can present a signature from the key corresponding to this public address

Say if `Output.recipientAddress` points to Alice, Bob can never claim it either with his own signature, or a fake Alice's signature.


## How does a node verify Bitcoin transactions ? 

With discussions above and the concerns thrown out at the begining, we could derive some basic principles to validate a transacion:

1. Input must be in current UTXO pool.
2. Input signature must be valid.
3. Same UTXO can’t be redeemd multiple times.
4. Total input value must not be less than total output value.

Based on these principles, we can try building that simplified version of Bitcoin transaction verification system. 

## Let’s break things.

Things only go well when they go well. Assume Alice 👩🏻‍🌾 and Bob 🦹🏻‍♂️ are usually good citizens, but sometimes they can be bad actors as well.

#### **Case 1.** 👩🏻‍🌾 and 🦹🏻‍♂️ both get initial 💰💰💰 from a coinbase transaction

{% splash %}
let initialCoins: Transaction = .coinbase(
    id: "🔮",
    outputs: [
        .init(recipientAddress: "👩🏻‍🌾📮", value: "💰💰💰"),
        .init(recipientAddress: "🦹🏻‍♂️📮", value: "💰💰💰"),
    ]
)
{% endsplash %}

Everything just works! Now each of them owns some money.
{% splash %}
🤠 hooray your transaction is validated!
Current UTXO pool:
🔮(1) | owner: 🦹🏻‍♂️ | amount: 💰💰💰 
🔮(0) | owner: 👩🏻‍🌾 | amount: 💰💰💰 
{% endsplash %}

#### **Case 2.** 👩🏻‍🌾 pays 💰💰 to 🦹🏻‍♂️ 
She locates the (only) previous transaction payable to her (identified as "🔮"), redeems it by verifying her signature - so far she has proved 💰💰💰 is hers, and she can do whatever she wants with them. She sends 💰💰 to 🦹🏻‍♂️ and sends the remaining 💰 back to herself as change. 

{% splash %}
let realAlicePayBob: Transaction = .standard(
    id: "🍹",
    inputs: [
        .init(
            previousTxID: "🔮",
            previousTxOutputIndex: 0,
            signature: "👩🏻‍🌾🔐🍹"
        ),
    ],
    outputs: [
        .init(recipientAddress: "🦹🏻‍♂️📮", value: "💰💰"),
        .init(recipientAddress: "👩🏻‍🌾📮", value: "💰"), // change
    ]
)
{% endsplash %}

Great, now 👩🏻‍🌾 only has 💰 and 🦹🏻‍♂️ has 💰💰💰💰💰 in total. 
{% splash %}
🤠 hooray your transaction is validated!
Current UTXO pool:
🍹(0) | owner: 🦹🏻‍♂️ | amount: 💰💰 
🍹(1) | owner: 👩🏻‍🌾 | amount: 💰 
🔮(1) | owner: 🦹🏻‍♂️ | amount: 💰💰💰
{% endsplash %}

#### **Case 3.** 🦹🏻‍♂️ counterfeits 💰💰💰 out of thin air
Unfortunately, he’s too lazy to do due diligence so just picks up a random transction ID  🥃 to locate previous transaction, which never exists.

{% splash %}
let bobDayDream: Transaction = .standard(
    id: "🍸",
    inputs: [
        .init(
            previousTxID: "🥃", // never exists in UTXO pool
            previousTxOutputIndex: 1,
            signature: "🦹🏻‍♂️🔐🍸"
        ),
    ],
    outputs: [
        .init(recipientAddress: "🦹🏻‍♂️📮", value: "💰💰💰"),
    ]
)
{% endsplash %}

Unsurprisingly, his transaction is denied.
{% splash %}
😏 uh oh your transaction is denied. 
Reason: Input not found in UTXO pool
Current UTXO pool:
🍹(0) | owner: 🦹🏻‍♂️ | amount: 💰💰 
🍹(1) | owner: 👩🏻‍🌾 | amount: 💰 
🔮(1) | owner: 🦹🏻‍♂️ | amount: 💰💰💰
{% endsplash %}
    
#### **Case 4.** 🦹🏻‍♂️ counterfeits 💰 paid by 👩🏻‍🌾
This time he gets smarter. He looks up a previous existing transaction 🍹 payable to 👩🏻‍🌾, fakes a signature and put himself as recipient. 
{% splash %}
let fakeAlicePayBob: Transaction = .standard(
    id: "🍺",
    inputs: [
        .init(
            previousTxID: "🍹",
            previousTxOutputIndex: 1,
            signature: "👷🏻‍♀️🔐🍺" // fake 👩🏻‍🌾 signature signed by 🦹🏻‍♂️
        ),
    ],
    outputs: [
        .init(recipientAddress: "🦹🏻‍♂️📮", value: "💰"),
    ]
)
{% endsplash %}

But…transaction 🍹 is payable to 👩🏻‍🌾, so only her signature could redeem it.
{% splash %}
😏 uh oh your transaction is denied. 
Reason: Invalid input signature
Current UTXO pool:
🍹(0) | owner: 🦹🏻‍♂️ | amount: 💰💰 
🍹(1) | owner: 👩🏻‍🌾 | amount: 💰 
🔮(1) | owner: 🦹🏻‍♂️ | amount: 💰💰💰
{% endsplash %}

#### **Case 5.** 👩🏻‍🌾 tries paying 💰💰 to 🦹🏻‍♂️ by redeeming 💰 twice 
She needs to pay 🦹🏻 💰💰, but she only owns 💰now - so she's gonna try her luck by redeeming same UTXO payable to her multiple times.💰x 2 = 💰💰,  what a beautiful math.
{% splash %}
let alicePayBobDoubleSpend: Transaction = .standard(
    id: "🥂",
    inputs: [
        .init(
            previousTxID: "🍹",
            previousTxOutputIndex: 1,
            signature: "👩🏻‍🌾🔐🥂"
        ),
        .init(
            previousTxID: "🍹",
            previousTxOutputIndex: 1,
            signature: "👩🏻‍🌾🔐🥂"
        ),
    ],
    outputs: [
        .init(recipientAddress: "🦹🏻‍♂️📮", value: "💰💰"),
    ]
)
{% endsplash %}

"Same UTXO redeemd multiple times in inputs"...Bummer.

{% splash %}
Try adding a transaction...
😏 uh oh your transaction is denied. 
Reason: Same UTXO redeemd multiple times in inputs
Current UTXO pool:
🍹(0) | owner: 🦹🏻‍♂️ | amount: 💰💰 
🍹(1) | owner: 👩🏻‍🌾 | amount: 💰 
🔮(1) | owner: 🦹🏻‍♂️ | amount: 💰💰💰
{% endsplash %}

#### **Case 6.** 🦹🏻‍♂️ tries aggregating 💰💰💰 + 💰💰 into 💰💰💰💰💰💰
He just loses faith that 👩🏻‍🌾 could figure out a way to pay him, so he decides to try something creative again. “What if I just aggregate all my funds, and secretly add a little more to it?” 

{% splash %}
let bobAggregateChangesMoreThanHeOwn: Transaction = .standard(
    id: "🍻",
    inputs: [
        .init(
            previousTxID: "🔮",
            previousTxOutputIndex: 1,
            signature: "🦹🏻‍♂️🔐🍻"
        ),
        .init(
            previousTxID: "🍹",
            previousTxOutputIndex: 0,
            signature: "🦹🏻‍♂️🔐🍻"
        ),
    ],
    outputs: [
        .init(recipientAddress: "🦹🏻‍♂️📮", value: "💰💰💰💰💰💰"),
    ]
)
{% endsplash %}

OK, fair enough. 
{% splash %}
😏 uh oh your transaction is denied. 
Reason: Total input 💰💰💰💰💰 is less than total output 💰💰💰💰💰💰
Current UTXO pool:
🍹(0) | owner: 🦹🏻‍♂️ | amount: 💰💰 
🍹(1) | owner: 👩🏻‍🌾 | amount: 💰 
🔮(1) | owner: 🦹🏻‍♂️ | amount: 💰💰💰 
{% endsplash %}

It feels like being a bad actor is way much harder than being a good citizen? 
