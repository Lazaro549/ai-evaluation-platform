# Evaluation Methodology

## Deterministic vs Model-Based Metrics

### Deterministic Metrics
Computed algorithmically — same input always produces same output.

- **Exact Match**: Normalised string equality. Useful for short factual answers.
- **Keyword Overlap**: Jaccard similarity of content words. Robust to paraphrasing.
- **Response Length**: Validates output is within acceptable word count bounds.
- **Latency**: Scores response time against a configurable SLA threshold.
- **Token Efficiency**: Penalises responses with excessive output/input token ratio.

### LLM-as-a-Judge Metrics
Use a second LLM to evaluate response quality. Results are non-deterministic with real providers.

- **Answer Relevance**: Does the response address the question?
- **Faithfulness**: Does the response stay grounded in the provided context?
- **Context Relevance**: Is the retrieved context relevant to the question?
- **Semantic Similarity**: How semantically close is the response to the expected answer?

## Scoring

All metrics return a score in [0.0, 1.0].

A case is considered **passed** if its average metric score ≥ 0.5.

## Judge Prompt Design

Judge prompts are structured to elicit JSON responses:
```json
{"score": 0.0-1.0, "reason": "...", "passed": true/false}
```

Malformed responses are handled gracefully — the parser extracts JSON from markdown code blocks and falls back to score=0.0 with an explanatory reason.

## Limitations

- Keyword overlap does not capture semantic meaning
- LLM judge quality depends on the judge model
- Cost estimates are approximations
- No statistical significance testing on run comparisons
