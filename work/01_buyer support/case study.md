---
title: Troubleshooting Made Easier with a Central Support Module
timeline: 4 weeks
contributors: 1 Product Designer (Me), 1 Product Manager, 3 Developers
contribution: Research, End-to-end design and delivery
---

## Product Context
*Some Overview*

Visa provides a Virtual Account Payment Method system that enables businesses to make and manage payments using virtual cards.
In simple terms, corporates can create virtual cards from their company's primary card and distribute these cards to employees for business-related expenses. This gives companies more control over how their cards are used, while also making expenses easier to manage and reconcile.
[Learn More about Virtual Cards](https://www.visa.com/en-us/business/cards/virtual-card)

Juspay, in partnership with Visa and IndusInd Bank, built Jusbiz - a platform that facilitates these virtual card payments through Virtual Tokens.
Jusbiz helps businesses create and manage virtual cards while keeping the original primary card protected. Depending on the company's setup, only certain users can access the primary card details.

> Visa provides the underlying virtual card technology. Juspay built the platform that helps banks and businesses use it.

[IMAGE: working-capital-banner.jpg]

## Problem Statement

As part of Juspay and Visa's strategy to reach global benchmarks, Juspay had to enhance its Virtual Card Platform to give Issuers and Visa admins with a suite of features for support and buyer management.

In line with this, the expectation was to add the ability to proactively resolve potential issues for corporates, and to troubleshoot issues when corporates came in with queries.

**Problem Statement**

- **User:** Banks and Visa Admins
- **User Role:** responsible for handling merchants' issues.
- **User Need:** a troubleshooting and support-aiding tool
- **Goal:** improve their merchants' experience with quick error resolution.

## Previous Solution
*Preliminary Research*

### What was the Previous Solution?

I started by speaking to our Support Engineers to understand how they actually handled corporate issues.
I found that a lot of the troubleshooting happened manually.
When a corporate reported an issue, support engineers would typically look through logs and try to resolve it.

The support engineers also had WhatsApp groups with corporate SPOCs where issues and queries were discussed.

Also, there was already a Corporate/Buyer Management module in Jusbiz.
However, it was essentially a list of all registered corporates with very limited functionality.
There was certainly a lot of opportunity here to add and improve upon.

## Ideation and Brainstorming

**Getting to Work**

### What exactly needs to be fixed?

Now, I started looking at the problem as two connected but different needs.

1. First was **Proactive Support**: Support teams shouldn't always have to wait for a corporate to report an issue. If there was something wrong or something that needed attention, the Buyer module should help surface it.
2. The second was **Reactive Troubleshooting**: Once an issue was reported, the support engineer needed a quick way to find the relevant information and understand what had happened.

### Aligning the Team

I discussed my observations and understandings with the PMs and developers to understand what was feasible within the timeline and development effort.
We finally aligned on the following solution:

1. Add a new search-based module for troubleshooting: This would give support engineers a focused place to search for information and investigate issues.
2. Make the existing Buyer module more functional: The existing list would be redesigned to provide more useful information and surface pending or upcoming actions against a corporate.

Instead of making the existing Buyer module do everything, we could create a separate search-driven experience specifically for troubleshooting.

## Final Product
*lessgooo*

**What we finally made**

### New Buyer Support Module

The Buyer Support module was designed specifically around the way support engineers approached troubleshooting.
The main idea was simple:

> Start with what you know → Search for it →
> Find the relevant information → Investigate the issue.

There were three main search criteria, which we separated into tabs. Each tab was built around a different troubleshooting need, while keeping the overall interaction consistent.

[VIDEO: new-buyer-support-demo.mp4]

### Updated Buyer's List Module

The existing Buyer module was essentially a list, and wasn't particularly useful for day-to-day support.
We changed the form factor to a table, which made it easier to scan and compare information across multiple corporates. We also introduced action nudges for upcoming or pending items against a corporate.
Instead of waiting for the corporate to report an issue, the nudges surface things that might need attention later, ahead of time. The idea was -

> "Is there anything I need to know or act on for this Buyer?"

This shifted the module from being a directory of Buyers to being a more action-oriented workspace.

[VIDEO: updated-buyers-list-demo.mp4]

## Impact
*What changed?*

### The Impact

While I could not gather numbers to demonstrate the impact, our changes certainly elevated the experience for the people involved in keeping the Virtual Cards platform running smoothly.

The Support Staff informed us that the number of queries shared in the WhatsApp groups went from a few every day to only a few every month. They also mentioned that troubleshooting specific issues took significantly less time, since they could now search for the relevant transaction, payment or API information directly within Jusbiz.
While the feature did not completely replace the existing support process, it made the process much more streamlined and reduced a lot of the back-and-forth involved in resolving issues.

## Thoughts
*Some Key Moments*

### Pausing to think and reflect

This was a project with a very short deadline but also maximum impact. If done well, this feature would single-handedly speed up and streamline a lot of work for our support engineers as well as the banks—which, btw, it actually did.
I am very grateful that I was entrusted to take this project forward independently and was involved in all the decision making.
Looking back, there are things that I could have done better, but isn't that always the case—we do and we learn and we do better next time.
And I certainly learnt a lot.
