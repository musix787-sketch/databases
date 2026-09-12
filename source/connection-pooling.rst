Connection pooling
====================

Why your database says "too many connections" even though nothing looks broken.

.. _why-pooling:

Why you need a pool at all
-----------------------------

Every connection to a database costs memory and a bit of CPU on the server side,
even when it's sitting idle doing nothing. Most databases cap how many
connections they'll accept, Postgres defaults to 100. That sounds like a lot
until you remember that every serverless function invocation, every app server
process, every background worker can try to open its own connection at the
same time.

A pool sits between your app and the database and reuses a small number of
real connections across many requests, instead of opening a new one per
request.

.. note::
   The classic failure mode: you deploy to a serverless platform, traffic
   spikes, 200 function instances spin up, each opens its own connection, and
   your database that was fine at 50 connections falls over at 100.

.. _pooling-modes:

The three pooling modes
--------------------------

If you're using PgBouncer (or anything similar) you'll pick one of these:

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Mode
     - What it does
     - Watch out for
   * - **Session**
     - One client connection maps to one real connection for the whole
       session
     - Barely saves you anything, still limited by real connection count
   * - **Transaction**
     - A real connection is only held for the duration of one transaction
     - Can't use session-level features like ``SET`` or advisory locks that
       outlive a transaction
   * - **Statement**
     - A real connection is held for a single statement only
     - Breaks multi-statement transactions entirely, rarely what you want

Most production setups use transaction mode. It gives the biggest connection
savings while still supporting normal transactions.

.. _pool-sizing:

Sizing a pool
----------------

A bigger pool is not automatically better. Past a certain point more
connections just means more contention on the same CPU and disk, and your
database gets slower, not faster.

A reasonable starting formula:

.. code-block:: text

   pool_size = ((core_count * 2) + effective_spindle_count)

For most cloud databases on SSDs, that's roughly ``(cores * 2) + 1``. Start
small, watch your metrics, and go up only if you can show the pool itself is
the bottleneck.

How to tell the pool is actually the problem
-----------------------------
Check for queries queuing up waiting for a connection, not queries running
slowly once they get one. If ``pg_stat_activity`` shows a lot of
connections in ``idle`` and requests are still timing out before they even
start a query, that's a pool problem. If queries are slow once they're
running, that's a different problem, probably missing indexes or lock
contention.

.. _pooling-serverless:

Serverless makes this worse
-------------------------------

Traditional app servers hold a small, stable number of long-lived processes.
Serverless spins up and tears down instances constantly, and each one wants
its own connection. Two common fixes:

- Put a pooler like PgBouncer or your cloud provider's managed pooler between
  the functions and the database, so the database only ever sees a handful of
  real connections no matter how many functions are running
- Use a database built for this, some newer serverless-friendly databases
  handle thousands of short-lived connections natively

Either way, "just increase max_connections" is treating the symptom, not the
cause.

.. _idle-timeouts:

Idle connections and timeouts
-----------------------------------

A connection sitting idle for an hour is still holding a slot in the pool
that a busy request can't use. Set an idle timeout so connections that
aren't doing anything get closed and returned.

.. code-block:: text

   idle_timeout = 300   # seconds before an unused connection is dropped

Too short and you'll be reconnecting constantly, adding latency. Too long and
idle connections quietly starve the pool during a traffic spike.

.. _pool-per-service:

One pool per service, or one shared pool
-----------------------------------------------

If several services talk to the same database, each with its own pool, the
database still sees the sum of all of them. A shared pooler in front of
everything gives you one place to size and monitor, instead of guessing at
five different pool configs that might add up to more than the database can
handle.

.. _pgbouncer-config:

A minimal PgBouncer config
-------------------------------

.. code-block:: ini

   [databases]
   mydb = host=127.0.0.1 port=5432 dbname=mydb

   [pgbouncer]
   pool_mode = transaction
   max_client_conn = 1000
   default_pool_size = 20

``max_client_conn`` is how many app connections PgBouncer accepts.
``default_pool_size`` is how many real connections it opens to the database.
The whole point is the first number can be much bigger than the second.

.. _detecting-leaks:

Detecting connection leaks
-------------------------------

A leak is code that opens a connection and never gives it back, usually from
a missing ``close()`` on an error path. Symptoms build slowly, connection
count creeps up over hours or days instead of spiking suddenly.

How to find one
--------------------------------

Compare connection count against request rate over time. If connections
keep climbing even when traffic is flat or dropping, something isn't
releasing them. Check error handling paths first, leaks almost always
hide in the branch that only runs when something goes wrong.

.. _pool-and-replicas:

Pooling with read replicas
--------------------------------

If reads go to replicas and writes go to the primary, you generally want a
separate pool per target, not one pool juggling both. Mixing them makes it
easy for a batch of slow reads to eat into capacity a write actually needed.

.. _pooler-vs-load-balancer:

A pooler is not a load balancer
-------------------------------------

A load balancer picks which server to send a request to. A pooler manages
how many real connections exist to a server at all. You often need both, a
load balancer routing between read replicas, and a pooler in front of each
one limiting connection count.

.. _pool-warmup:

Health checks and pool warmup
------------------------------------

A pool with zero warm connections means the very first requests after a
deploy or scale-up event pay the cost of opening a fresh connection.
Warming a small number of connections on startup avoids a cold, slow first
few seconds after every deploy.

.. _multi-tenant-pooling:

Pooling in a multi-tenant setup
--------------------------------------

If different customers or teams share a database, one noisy tenant can eat
the whole pool. Some setups give each tenant, or tenant tier, its own
sub-pool with a cap, so one bad actor can't starve everyone else out.

.. _pool-metrics:

What to actually watch on the pool itself
------------------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Metric
     - What it tells you
   * - Active connections
     - How many are currently doing work
   * - Waiting clients
     - Requests queued because the pool is full, the real warning sign
   * - Average wait time
     - How long requests sit before getting a connection

.. _pooling-mistakes:

Common pooling mistakes
----------------------------

- Sizing the pool to match expected traffic instead of what the database
  can actually handle underneath it
- Forgetting that migrations and admin tools also open connections, and
  count against the same limit
- Assuming a bigger pool fixes a slow query, it just lets more slow queries
  run at once
