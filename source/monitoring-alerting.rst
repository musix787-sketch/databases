Monitoring and alerting
===========================

The handful of numbers that tell you something's wrong before a user does.

.. _core-metrics:

The metrics that actually matter
--------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Metric
     - What it tells you
     - Rough alert threshold
   * - Connection count
     - How close you are to exhausting the pool
     - Above 80 percent of max, sustained
   * - Replication lag
     - How stale your read replicas are
     - More than a few seconds, depends on your app's tolerance
   * - Slow query count
     - Queries taking longer than they should
     - Any sudden spike, not just an absolute number
   * - Lock wait time
     - Queries stuck waiting on other queries
     - Any sustained wait above a second or two
   * - Disk usage
     - Whether you're about to run out of space, which is catastrophic
     - Above 80 percent, with a plan before it hits 90
   * - Cache hit ratio
     - How much you're actually hitting disk instead of memory
     - Below 99 percent on a warm database is worth investigating

.. note::
   Alert on trends and sustained thresholds, not single spikes. A one second
   blip in slow queries is normal. The same thing sustained for five minutes
   is an incident.

.. _slow-query-log:

Turning on the slow query log
------------------------------------

Most databases can log any query over a threshold automatically.

Postgres

.. code-block:: sql

   -- Log anything slower than 200ms
   ALTER SYSTEM SET log_min_duration_statement = 200;
   SELECT pg_reload_conf();

MySQL

.. code-block:: sql

   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 0.2;

Don't set the threshold too low on a busy database, logging every query adds
real overhead. Start loose, tighten once you've cleared the obvious offenders.

.. _what-good-monitoring-looks-like:

What good monitoring actually looks like
-----------------------------------------------

A minimal setup that covers most incidents

- Dashboard showing connections, replication lag, and disk space, checked without needing to dig

- Slow query log shipped somewhere searchable, not just sitting on disk

- Alerts that page a human only for things that need a human right now, everything else goes to a channel someone checks during the day

- One dashboard your whole team actually knows how to read, better than five dashboards nobody opens

The goal isn't collecting every possible metric. It's having the few that
would have told you about your last three incidents before they became
incidents.

.. _dashboards:

Setting up dashboards people actually open
------------------------------------------------

A dashboard nobody looks at until an incident is already happening isn't
doing its job. Keep the main one small, the handful of metrics from the
table above, and put it somewhere your team sees by default, not three
clicks deep in a tool people forget exists.

.. _alert-fatigue:

Alert fatigue
------------------

An alert that fires every day and gets ignored trains people to ignore
alerts. If something pages a human, it should mean a human needs to act
right now. Anything else belongs in a dashboard or a daily digest, not a
page at 3am.

.. _runbooks:

On-call runbooks
---------------------

For each alert that can page someone, write down what it means and the
first two or three things to check, before an incident, not during one.

.. dropdown:: What a decent runbook entry looks like

   - What the alert means, in plain language
   - The first query or dashboard to check
   - The most common cause, and the most common fix
   - When to escalate instead of trying to fix it alone

.. _query-tracing:

Query-level tracing
------------------------

Aggregate metrics tell you something's slow. Tracing tells you which
specific request, and which specific query inside it, was the slow part.
Worth adding once "average query time" stops being specific enough to debug
with.

.. _synthetic-monitoring:

Synthetic checks
---------------------

A simple query run on a schedule, from outside your infrastructure, checking
that the database actually responds and returns the expected result. This
catches problems your internal metrics might miss, like the database being
up but unreachable from where your app actually runs.

.. _logs-metrics-traces:

Logs, metrics, and traces are different tools
------------------------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Tool
     - Answers
     - Example
   * - **Metrics**
     - Is something wrong, right now, in aggregate
     - Connection count over time
   * - **Logs**
     - What exactly happened, in detail
     - The exact slow query text
   * - **Traces**
     - Where time was spent across a whole request
     - Which of five queries in a request was the slow one

.. _anomaly-detection:

Anomaly detection vs fixed thresholds
--------------------------------------------

A fixed threshold, like "alert above 500 connections," is easy to set up but
doesn't adapt to normal daily or weekly patterns. Anomaly-based alerting,
comparing against what's normal for this hour on this day, catches things a
fixed number misses, at the cost of being harder to reason about when it
fires.

.. _capacity-planning:

Capacity planning from your own metrics
------------------------------------------------

Your connection count, disk usage, and query volume trends over the last few
months are the best predictor you have of when you'll need to scale up,
better than guessing. Look at the trend line, not just today's number, and
plan the upgrade before you're forced into it during an incident.

.. _monitoring-tools:

Picking a monitoring tool
------------------------------

Most managed databases ship basic metrics out of the box. Whether you need
more than that depends on scale, a small app might be fine with the built-in
dashboard, a larger one benefits from a dedicated tool that can correlate
database metrics with app-level traces.

.. _postmortems:

Postmortems feed back into monitoring
-------------------------------------------

Every real incident should end with a question: would a metric or alert
have caught this earlier. If not, that's a gap worth closing, monitoring
that only ever confirms problems after users report them isn't doing much.
