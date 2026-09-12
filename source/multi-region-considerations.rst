Multi-region considerations
===============================

Once your database lives in more than one place on the planet, distance itself becomes a variable you have to design around.

.. _why-multi-region:

Why go multi-region at all
--------------------------------

Two usual reasons: latency, putting data physically closer to users so
requests don't cross an ocean, and resilience, surviving an entire region
going down, not just one machine.

.. _one-fact-drives-everything:

The one fact that drives everything else here
--------------------------------------------------------

Network round trips between distant regions take real, unavoidable time,
tens to hundreds of milliseconds. No amount of good engineering removes
this, it's limited by the speed of light over real distance. Every
multi-region decision is really a decision about which operations are
allowed to pay that cost and which aren't.

.. _active-active-vs-passive:

Active-passive vs active-active
--------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 40 35

   * - Setup
     - How it works
     - Trade off
   * - **Active-passive**
     - One region takes all writes, others are read-only standbys
     - Simple, consistent, but the passive regions add latency for local
       writes since they still go to the far-away primary
   * - **Active-active**
     - Multiple regions accept writes independently
     - Low write latency everywhere, but conflicts between regions become
       your problem to solve

.. _where-primary-lives:

Where the primary lives
----------------------------

In an active-passive setup, picking the primary region matters more than
it seems. It should usually be wherever your heaviest write traffic
actually originates, not just wherever the company happens to be
headquartered.

.. _cross-region-replication:

Replication across regions
--------------------------------

.. code-block:: text

   Primary region -> async replication -> Region B, Region C

Almost always asynchronous across regions, synchronous cross-region
replication would mean every write waits on the slowest region's round
trip, which is usually unacceptable for a user-facing request.

.. warning::
   Async replication means a region can be behind by the time it takes for
   a write to physically travel there. If the primary region fails before
   a write replicates, that write can be lost. Worth knowing exactly how
   much data you're implicitly willing to lose in that scenario.

.. _conflict-handling-active-active:

Conflict handling in active-active
-----------------------------------------

If two regions both accept a write to the same record before syncing, you
get a conflict. Same techniques as any distributed consistency problem:
last write wins, app-level merge logic, or conflict-free data structures.
The right choice depends entirely on what the data actually represents, a
shopping cart merges differently than a bank balance.

.. _data-residency:

Data residency and legal requirements
--------------------------------------------

Some data legally has to stay within a specific country or region,
healthcare or financial records in many jurisdictions, for example. This
isn't just a performance decision anymore, it constrains which regions can
even hold a copy of certain data at all.

.. _routing-users:

Routing users to the right region
----------------------------------------

- **DNS-based routing**, users get directed to the nearest region
  automatically based on where their request originates
- **Application-aware routing**, the app itself knows which region owns a
  given user's data and routes accordingly
- **Anycast**, network-level routing to the nearest healthy region, common
  for stateless edge services in front of the database

.. _failover-between-regions:

Failover between regions
------------------------------

Losing an entire region is a bigger event than losing one server. Recovery
usually means promoting a different region's replica to take over as
primary, updating routing so traffic flows there, and accepting that
anything not yet replicated at the moment of failure is gone.

.. dropdown:: Why this is harder to test than single-region failover

   You can't easily simulate "an entire AWS region disappeared" in a
   staging environment the same way you can kill one server. Most teams
   either trust their cloud provider's tooling for this, or run periodic
   game days that intentionally fail over to a secondary region on
   purpose, specifically to prove the process still works.

.. _latency-budgets:

Latency budgets
--------------------

Think in terms of an actual number, how many milliseconds can a request
afford to spend on cross-region calls before the user notices. Every
synchronous cross-region hop eats into that budget. Multi-region
architectures that ignore this end up technically distributed but
practically slow everywhere.

.. _local-vs-global-data:

What to keep local vs global
------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Kind of data
     - Usual placement
   * - User session and profile data
     - Local to the user's region, replicated for backup only
   * - Reference data that rarely changes, like a product catalog
     - Replicated everywhere, read locally
   * - Anything requiring a single global source of truth, like a unique
       username registry
     - Centralized in one region, accepting the latency cost for that
       specific operation

.. _cost-not-small:

Cost is not small
----------------------

Cross-region data transfer and running redundant infrastructure in
multiple regions costs real money, often significantly more than a
single-region setup. Worth being deliberate about which parts of the
system actually need multi-region treatment, rather than replicating
everything by default.

.. _monitoring-across-regions:

Monitoring across regions
--------------------------------

Watch replication lag per region the same way you'd watch it for a
single-region replica, plus cross-region request latency specifically,
separate from your normal latency dashboards, since it behaves
differently and fails differently than local latency spikes.

.. _starting-point:

Starting point if you're not sure you need this yet
------------------------------------------------------------

Most applications don't need multi-region until they have a specific,
concrete reason: real users far enough away that latency is a measurable
problem, or a compliance requirement that demands it. Adding this
complexity before you need it is a common way to make a system harder to
operate for a benefit nobody's actually using yet.
