# Experiment evidence custody and handoff

Each experiment run has one canonical raw-evidence location. Reusable study
records normally live in Analysis. An Adviser acceptance experiment may originate
and remain in Adviser while its model is being validated; moving it to Analysis
is not a prerequisite for collection or acceptance. This is the proposed handoff
convention, not an already implemented cross-repository service.

Before play, freeze a run ID, scenario and predictions at an immutable commit.
Use a collision-resistant ID such as `ctw-run-<UUID>` (universally unique
identifier); keep readable titles separately. Record Data commit and relevant
owner/file fingerprints, game build/mods, exact unit/map variants, model commit
and schema/version, settings, orders, assumptions, random seed if available, and
predicted measures/stopping criteria. Mark unavailable values explicitly. The
prediction artifact must predate the observations; never replace it with a fitted
post-play prediction.

After play, record observations, capture method, actual settings/deviations and
limitations under that same run ID. Raw video/logs may live in a durable artifact
store, with immutable version and content hash referenced from the canonical
record; they need not bloat Git. Preserve raw evidence separately from labels,
interpretations, calculated errors and calibration. Data receives only reviewed
source/reference improvements with their provenance, not an inferred stat change
because one experiment disagreed with a model.

For reuse across Analysis and Adviser:

1. The origin record supplies a canonical immutable artifact reference and hashes.
2. Analysis owns comparative interpretation and calibration studies; Adviser owns
   the acceptance verdict and regression fixture tied to its exact model version.
3. Prefer references to raw evidence. If portability needs a copy or a compact
   fixture, retain run ID, source version/hash, transform and selection criteria.
   That copy is derived evidence, not a competing original.
4. If custody moves, publish the destination and verify its hashes before adding
   a forwarding record at the origin. Retain the earlier immutable references;
   do not delete the only reusable source or require both repos at runtime.
5. Corrections create a new evidence/annotation version with a reason and a link
   to the superseded version. Preserve raw captures and original predictions.
   Notify the affected work through its tracked change; update the relevant study
   and Adviser acceptance fixture explicitly. Old results remain pinned until
   re-evaluated, with the known correction stated.

One run supports only its observed settings. A verified runtime observation can
exist on an unmerged branch; it neither proves unrelated semantics nor makes its
repository a production authority. Higher evidence claims in the inventory must
carry scope, method, limitations and an immutable supporting artifact.
