Cassandra
============

:bdg-warning:`Wide-column` :bdg-danger:`Eventually consistent` :bdg-success:`Massively scalable`

Built at Facebook to do one thing at planet scale: absorb writes without falling over.

.. _cassandra-what-it-is:

What it is
--------------

Apache Cassandra is a distributed wide-column database designed from the
ground up for horizontal scale across many nodes, including across data
centers, with no single point of failure. There is no primary node, every
node is equal (a "masterless" architecture).

.. _cassandra-how-it-works:

How it works under the hood
----------------------------------

Data is partitioned across the cluster by a partition key, using
consistent hashing so adding or removing nodes only reshuffles a fraction
of the data. Every piece of data is replicated to multiple nodes
(controlled by a replication factor), and reads and writes can tolerate
some nodes being down entirely, controlled by a tunable consistency level
per query.

.. dropdown:: The gossip protocol

   Nodes don't rely on a central coordinator to know about each other,
   they gossip: each node periodically exchanges state information with a
   few random peers, and cluster-wide knowledge spreads within a few
   rounds. This is exactly what makes the masterless design survive nodes
   joining, leaving, or failing without coordination overhead.

.. _cassandra-setup:

Setting it up
------------------

.. tab-set::

   .. tab-item:: Docker

      .. code-block:: bash

         docker run --name cassandra -p 9042:9042 -d cassandra:5

   .. tab-item:: Local install

      .. code-block:: bash

         tar -xzf apache-cassandra-5.0-bin.tar.gz
         cd apache-cassandra-5.0
         bin/cassandra -f

.. _cassandra-first-queries:

Your first queries (CQL)
-------------------------------

.. code-block:: sql

   CREATE KEYSPACE app WITH replication = {
     'class': 'SimpleStrategy', 'replication_factor': 3
   };

   CREATE TABLE app.events (
     device_id text,
     event_time timestamp,
     payload text,
     PRIMARY KEY (device_id, event_time)
   ) WITH CLUSTERING ORDER BY (event_time DESC);

   INSERT INTO app.events (device_id, event_time, payload)
   VALUES ('sensor-1', toTimestamp(now()), '{"temp": 21.5}');

.. important::
   CQL looks like SQL but isn't. You can't join tables, and you generally
   can't query by anything other than the partition key without a
   secondary index or a separate table designed for that access pattern.

.. _cassandra-modeling:

Modeling data query-first
--------------------------------

.. note::
   In a relational database you model entities, then write queries
   against them. In Cassandra you design the table around the specific
   query it needs to serve, and you often duplicate data across multiple
   tables to support different access patterns. This is the single
   biggest mental shift for people coming from SQL.

.. _cassandra-consistency:

Tunable consistency
------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Consistency level
     - Meaning
   * - ``ONE``
     - Only one replica needs to respond; fastest, weakest guarantee
   * - ``QUORUM``
     - A majority of replicas must respond; the common middle ground
   * - ``ALL``
     - Every replica must respond; strongest, least available under
       failure

.. code-block:: sql

   CONSISTENCY QUORUM;
   SELECT * FROM app.events WHERE device_id = 'sensor-1';

.. _cassandra-in-production:

In production
-----------------

.. code-block:: text

   nodetool status
   nodetool tpstats

.. warning::
   A poorly chosen partition key creates a "hot partition", one node
   absorbing far more traffic than the rest of the cluster, which defeats
   the entire point of a distributed design. This is the Cassandra
   equivalent of a MongoDB hot shard.

Repair (``nodetool repair``) needs to run regularly to reconcile data
across replicas that missed writes during downtime, skipping it for too
long risks permanently inconsistent data.

.. _cassandra-pros-cons:

Pros and cons
------------------

.. grid:: 2

   .. grid-item-card:: Pros

      - Linear horizontal write scalability across many nodes
      - No single point of failure, survives node and even data center loss
      - Tunable consistency per query
      - Proven at genuinely massive scale (originated at Facebook, used at Netflix, Apple)

   .. grid-item-card:: Cons

      - No joins, no ad hoc queries outside your modeled access patterns
      - Query-first modeling is a real learning curve
      - Operational complexity (repair, compaction, tombstones) is
        significant
      - Overkill for anything that fits on one strong Postgres instance

.. _cassandra-when-to-use:

When to reach for it
-------------------------

Good fits: time-series and event data at huge scale, write-heavy
workloads (IoT telemetry, activity logs), applications needing multi-data
center replication with no single point of failure, and access patterns
that are well understood in advance.

.. _cassandra-not-fit:

When it's not the right fit
--------------------------------

- Applications needing flexible, ad hoc querying
- Small to medium datasets that don't need this level of horizontal scale
- Teams without the operational capacity to run a distributed database

.. seealso::
   :doc:`multi-region-considerations` and
   :doc:`consistency-tradeoffs-at-scale` cover the distributed-systems
   concepts Cassandra leans on most heavily.
