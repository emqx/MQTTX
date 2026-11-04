# Benchmark diagnostics

Use this guide for suspicious rates, count mismatches or high-load disconnects. Use provided or authorized broker evidence; configuration or source changes belong to separately requested broker-side work.

## Reproduce the active workload

Record the executable path, full CLI version and build/source revision when available. Capture all simultaneously active publisher and subscriber commands, relevant protected defaults, broker revision/configuration, MQTT version, QoS, topic templates, payload size, client counts, connection/message intervals and reconnect settings. A publisher command followed by `Ctrl+C` in a screenshot does not establish the publisher load during a later subscription run.

Preserve the original output mode when reproducing a display or scheduling problem: interactive output, `--verbose` and redirected output can behave differently. Retain the raw stdout/stderr or PTY stream; screenshots can omit overwritten samples. Budget connection setup separately from the measured phase: `count * interval` is an approximate startup cost, before retries, steady traffic and drain time.

For a faithful performance comparison, match shared CPU/memory limits when the original broker and clients share one VM. Independent per-container limits do not establish the same combined resource budget. Label observed values, inferred candidates and unknowns separately. A candidate reconstructed from screenshots is not a confirmed identical environment. A quick diagnostic can shorten startup; label that difference and confirm with the original parameters when available.

## Interpret counts and rates

| Observation | Meaning |
| --- | --- |
| `bench sub` received total/rate | Aggregate messages received by that process across its benchmark clients. |
| `bench pub`/`simulate` count at QoS 0 | Client-side publish/write completion; the protocol supplies no broker acceptance acknowledgement. |
| Publish completion at QoS 1 | Broker acknowledgement, not evidence of subscriber processing or durable storage. |
| Configured message interval | An offered-load target per client, not achieved throughput. |
| Broker accepted, delivered or drop counters | Broker-specific stages; inspect their definitions before equating them with client receipts. |

For ordinary matching subscriptions, one publication can be delivered to every subscribed client. For example, 50,000 publications/second and two subscriber processes with ten matching clients each can produce 1,000,000 aggregate deliveries/second. Account for shared subscription groups, rejected grants, filters and disconnected clients before applying this multiplier. A rate in the millions is not by itself evidence of a formatting or overflow defect.

Check rate accuracy using consecutive counter samples and an independent monotonic clock:

```text
elapsedSeconds = sampleTime[n] - sampleTime[n - 1]
actualRate = (total[n] - total[n - 1]) / elapsedSeconds
```

Record the timing boundary and each sample's delta, elapsed time and displayed rate. Prefer timestamps near sample production; output buffering and observer scheduling can delay arrival timestamps. Parse complete updates, avoid counting a TTY redraw as another sample, and ensure the observer can keep up.

Earlier implementations labeled each sampling-window increment as `/s`, assuming the timer always fired after exactly one second. Under load the window can stretch to several seconds. Current handlers use elapsed monotonic time. Verify the installed build rather than inferring behavior from a release number alone; neither a million-message threshold nor a fixed tenfold multiplier follows from a high displayed rate.

## Verify completion and drain

Start subscribers first, check grants as well as readiness, then start publishers. After reconnect, verify message flow resumes; `Connected` or `Reconnected` alone is insufficient. Distinguish startup, steady traffic and drain samples.

Stop publishers before final delivery comparisons and keep subscribers alive through a bounded drain. Align counter snapshots and verify expected receipts or queue completion using the broker's actual metrics. If work remains queued or completion cannot be established by the deadline, report incomplete drain rather than counting the remainder as loss. Subscription gaps can invalidate `accepted * configuredSubscribers` as an expected receive total.

A broker's `delivered` counter may advance when output enters a writer queue, before socket completion. A drop counter may cover subscription-boundary filtering or unsubscribe cleanup while excluding connection-close cleanup. Read those definitions or increment sites before interpreting a zero counter or a send/receive difference. QoS 0 write counts alone cannot establish broker admissions or end-to-end delivery.

## Locate disconnects

Correlate client events with authorized broker logs and identify the endpoint that initiates close. Inspect authentication, malformed packets, duplicate IDs and keepalive alongside owner, peer, global and per-client budgets or queue limits. A client-side `Connection closed` line does not identify the cause. Check process CPU as well as aggregate idle CPU; one event loop can be saturated while other cores are idle.

Use controlled comparisons where the cause remains uncertain:

- Retain connection counts and lower offered traffic to distinguish connection capacity from traffic pressure.
- Replace one endpoint while retaining the other and the workload. A client using the same MQTT library excludes CLI-specific behavior, but not a shared library defect; use an independent implementation when that distinction matters.
- In an authorized isolated broker experiment, change one relevant limit and observe its guard and backlog. A larger budget can postpone exhaustion without improving sustained capacity.

Separate an intentional overload-close policy from a protocol or recovery defect. Preserve the observed close reason and resource values before recommending client changes or broker tuning. Report which settings matched the original run, which varied, whether drain completed, and which owned processes were stopped.
