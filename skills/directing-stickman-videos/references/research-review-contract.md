# Research Review Contract

Use this reference before Phase A whenever a video source contains factual,
historical, scientific, medical, legal, financial, current-event, public-figure,
product, date, statistic, quotation, or causal claim. Do not use it for purely
fictional stories unless the user asks for research.

## Goal

Create a concise factual brief that makes source uncertainty visible before it
enters a high-retention script. Research improves accuracy; it does not license
adding dramatic claims, theories, or details that the user did not supply.

## Source hierarchy

Prefer sources in this order when relevant:

1. Primary records, archival collections, original papers, official reports,
   direct institutional documentation, and first-party data.
2. Peer-reviewed research, university or museum material, and established
   specialist organizations.
3. High-quality independent reporting and reputable reference works.

Do not use search snippets as evidence. Do not treat social posts, unsourced
blogs, AI summaries, or entertainment retellings as decisive evidence. For a
claim that cannot be independently verified, retain the user's hedged wording
or remove it from the script; never upgrade it to a fact.

## Research workflow

1. Extract every factual claim from the user's source, including names, dates,
   counts, quotations, causes, allegations, and uncertainty language.
2. Search enough authoritative sources to test the load-bearing claims. Use at
   least two independent sources when the claim is disputed, consequential, or
   not supported by a primary source.
3. Build a claim ledger with one of four statuses:
   - **Supported:** reliable sources support the wording.
   - **Qualified:** the core claim is supported only with narrower or hedged
     wording.
   - **Unresolved:** evidence is insufficient or credible sources disagree.
   - **Remove:** the claim is contradicted, misleading, or lacks usable support.
4. Preserve the distinction between allegation, family account, theory,
   suspicion, and confirmed evidence. Absence of evidence is not proof of an
   alternative theory.
5. Check every date against the current date when recency matters. State exact
   dates rather than relative dates when there is potential ambiguity.

## Research Review output

Before Phase A, include a compact section in the user's language:

```markdown
## Research Review

- **Sources reviewed:** [source types or named institutions/publications]
- **Supported:** [load-bearing verified points]
- **Qualified or unresolved:** [claims that need hedging]
- **Removed or not used:** [unsupported claims, if any]
- **Script rule:** [how the English VO will preserve uncertainty]
```

Do not overwhelm the user with raw notes. Provide URLs or citations only when
the user asks for them or when attribution is necessary to explain a material
conflict. If web research is used, cite the factual review in the response.

## Stop conditions

Stop and ask the user before Phase A when:

- the source's central claim is materially contradicted;
- no reliable evidence supports a necessary factual claim;
- the topic creates medical, legal, financial, safety, or defamation risk that
  cannot be represented responsibly with available evidence; or
- the user asks to present an allegation or theory as confirmed fact.

## Script rules after review

- Write only from Supported and Qualified claims.
- Use wording such as “accounts say,” “has been proposed,” “historians disagree,”
  or “no confirmed evidence has established” when the ledger requires it.
- Do not use unsourced certainty, causal claims, sinister implication, or a
  misleading visual that makes an unresolved theory look confirmed.
- Keep Research Review separate from Phase B prompts. Phase B repeats only the
  approved script and visual constraints.
