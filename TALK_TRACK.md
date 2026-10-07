# Talk track: Escalate only the uncertain decisions (AI Gateway decision fallbacks)

**Length:** about 2.5 minutes · **Demo:** https://confidence-escalation-walkthrough.vercel.app
**Setup:** open the demo on step 1, threshold at 0.60. Simulated walkthrough with example data. Tasman Connect is a fictional company.

---

### 1. The issue (≈30s) · Screen: "The issue"

"Every enterprise I talk to is now making thousands of AI decisions a day. Route this enquiry. Approve this order. Flag this claim.

Take Tasman Connect, a business telco here in ANZ. A hundred and twenty thousand AI decisions a day, routing every business enquiry to the right team.

And they're stuck choosing one model for every call.

*(point to the red card)* Use a fast model everywhere and it's quick and cheap, but it guesses on the messy ones. That's seventeen thousand misroutes a day. A café owner with no EFTPOS sitting in the billing queue.

*(point to the amber card)* Use a frontier model everywhere and it's accurate, but every simple 'where's my invoice' pays frontier prices and waits a full second. A quarter of a million dollars a year. The easy eighty percent is subsidising the hard twenty.

*(point to the green card)* What they actually want is how a good team works. Juniors take the clear cases. Seniors take the ones nobody's sure about."

**Click:** "Run today's queue"

### 2. Live decisions (≈50s) · Screen: "Live decisions"

"This is the queue running. Every enquiry goes to Jev first, a fast decision model, through Vercel AI Gateway.

*(point to a green bar)* See this bar? That's how sure Jev is. When it's confident, it answers in around a quarter of a second. Done. Cheapest possible call.

*(wait for an amber row, point at it)* Now this one. 'Need a credit for the outage at our Chatswood store.' Is that billing or faults? Jev isn't sure. It's below our threshold. So AI Gateway automatically reruns that one decision on a stronger model, GPT-6 Astra, and *that* answer goes back to the app.

*(click the escalated row, point to the panel on the right)* And it's not a black box. Every escalation tells you which model answered and why. Triggered by: confidence below.

*(point to the live tally)* Same enquiries, three ways. Fast model everywhere, frontier everywhere, and Jev plus fallback. Watch the right-hand column. Fast-model speed. Accuracy up with the frontier model."

**Click:** "Run all 600", then "See the numbers"

### 3. The numbers (≈45s) · Screen: "The numbers"

"Here's the whole day's sample, scaled to their volume.

At a threshold of 0.6, only about eighteen percent of decisions ever need the stronger model. The result is seventy-six percent cheaper than running frontier on every call, more than twice as fast on average, and ten thousand fewer misroutes a day than the fast model on its own.

*(drag the slider to 0.70)* And the threshold is a business dial, not a rebuild. Move it to 0.7 and you're at ninety-six percent accuracy, right alongside frontier everywhere, for about eighty-six thousand dollars a year instead of two hundred and fifty-four.

*(point to the blue bars)* Your team sees exactly how often the fallback kicks in, right in Vercel observability."

**Click:** "What it takes"

### 4. What it takes (≈25s) · Screen: "What it takes"

"So what did Tasman Connect have to build? *(point to the highlighted lines)* This. One object in the request they already send through AI Gateway. Which model to escalate to, and below what confidence.

*(nudge the slider, the number in the code changes)* No new service, no routing layer to maintain.

That's the point. Fast where it can be, right where it matters, and you only pay for the strong model when the decision actually needs it.

If your teams are making AI decisions at scale, let's look at where your easy eighty percent is paying for your hard twenty."
