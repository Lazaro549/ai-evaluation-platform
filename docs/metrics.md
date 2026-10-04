# Metrics Reference

## Deterministic Metrics

### exact_match
- **Type**: Deterministic
- **Score**: 1.0 (match) or 0.0 (no match)
- **Method**: Lowercase + whitespace normalisation, then string equality
- **Best for**: Short factual answers, structured outputs

### keyword_overlap
- **Type**: Deterministic
- **Score**: Jaccard similarity [0, 1]
- **Method**: Stopword-filtered token sets, intersection/union ratio
- **Best for**: Longer answers where paraphrasing is acceptable

### response_length
- **Type**: Deterministic
- **Score**: 1.0 (acceptable), 0.5 (too long), 0.0 (too short)
- **Configurable**: min_words=5, max_words=500
- **Best for**: Detecting empty or excessively verbose responses

### latency
- **Type**: Deterministic
- **Score**: 1.0 (≤ threshold), linear decay to 0.0 at 2× threshold
- **Default threshold**: 5000ms
- **Best for**: SLA monitoring

### token_efficiency
- **Type**: Deterministic
- **Score**: Penalises output/input ratio > max_ratio
- **Default max_ratio**: 10.0
- **Best for**: Cost and verbosity control

## Model-Based Metrics

### answer_relevance
- **Type**: Model-based (LLM judge)
- **Score**: 0.0–1.0
- **Evaluates**: Whether the answer addresses the question

### faithfulness
- **Type**: Model-based (LLM judge)
- **Score**: 0.0–1.0
- **Evaluates**: Whether claims are supported by the provided context
- **Requires**: context field in the evaluation case

### context_relevance
- **Type**: Model-based (LLM judge)
- **Score**: 0.0–1.0
- **Evaluates**: Whether the retrieved context is relevant to the question
- **Requires**: context field in the evaluation case

### semantic_similarity
- **Type**: Model-based (LLM judge)
- **Score**: 0.0–1.0
- **Evaluates**: Semantic closeness to the expected answer
