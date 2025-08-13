# Load Testing Guide (Concurrent Operations)

This guide outlines how to plan and execute load tests for Stegnocchi’s core flows (encode/decode, file IO, vector processing) using industry-standard tools, while following security and observability guidelines.

Note: Do not commit shell scripts to the repository. Keep load profiles and results under version control as JSON/Markdown only.

## What to test

- Encode flow (AES-GCM + EXIF/.jpgv)
- Decode flow (including error paths: wrong password, corrupted payload)
- Vector payload prep/encryption (compressed vs uncompressed)
- File IO (download/share endpoints if applicable)

## KPIs

- P95/P99 latency per operation
- Error rate and failure distribution
- Throughput (requests/sec)
- Resource impact (CPU/Memory where observable)

## Tools (pick one)

- k6: scriptable load gen; results in JSON; integrate with CI
- Artillery: YAML/JS scenarios; good HTTP workflows

Example (pseudo-k6 code, not checked in as .js):

```
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
  },
  scenarios: {
    encode: { executor: 'ramping-vus', startVUs: 1, stages: [ { duration: '2m', target: 50 } ] },
  },
};

export default function () {
  const res = http.post('https://localhost:19006/api/encode', { /* payload */ });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

## Profiles

- Smoke: 1–5 VUs, 1–2 minutes
- Baseline: 10–50 VUs, 10–15 minutes
- Stress: increase until SLA breach; capture failure modes

## Best Practices

- Run against a staging environment; never production
- Use anonymized/canned test images; avoid PII
- Sanitize logs; measure via structured `application.log`
- Gate results: fail CI if thresholds or error budgets exceeded
- Record environment (commit hash, config, machine type)

## Reporting

- Check in JSON result summaries and Markdown analysis
- Track KPI trends over time

## Security

- Use TLS and certificate pinning where applicable
- Do not print secrets (passwords/keys) in scripts or outputs 