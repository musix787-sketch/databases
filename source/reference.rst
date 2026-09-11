Reference
==========

Systems compared, and terms defined.

.. _systems:

Popular systems, and where they actually shine
---------------------------------------------------

None of these "win" outright, each was built with a specific set of
trade-offs in mind, and the honest answer to "which should I use" is
almost always "what does your team already know how to operate."

.. list-table::
   :header-rows: 1
   :widths: 15 15 45 15

   * - System
     - Model
     - Reach for it when
     - Consistency
   * - **PostgreSQL**
     - Relational
     - Default choice for most apps, strong guarantees, extensible,
       well-documented failure modes
     - Strong
   * - **MySQL**
     - Relational
     - Web apps, especially anything already living in the
       WordPress/PHP ecosystem
     - Strong
   * - **MongoDB**
     - Document
     - Data shape changes often, or nests deeply and doesn't map
       cleanly to tables
     - Tunable
   * - **Redis**
     - Key-value
     - Caching, session storage, anything where sub-millisecond reads
       matter more than durability
     - Eventual
   * - **Neo4j**
     - Graph
     - Recommendation engines, fraud detection, anything about how
       things connect to each other
     - Strong
   * - **ClickHouse**
     - Columnar
     - Analytics dashboards crunching billions of rows, where you
       rarely fetch a single record
     - Tunable

.. _glossary:

Glossary
---------

.. glossary::

   Primary key
      The column (or combination of columns) that uniquely identifies a
      row. No two rows can share one.

   Foreign key
      A column that points at another table's primary key, used to link
      related rows together instead of copying data.

   Join
      Combining rows from two or more tables based on a related column,
      the core operation that makes relational databases useful.

   Schema
      The defined structure of a database: what tables exist, what
      columns they have, and what rules apply to them.

   Latency vs. throughput
      Latency is how long one query takes. Throughput is how many
      queries the system can handle per second. Optimizing for one
      sometimes costs you the other.

   Write-ahead log (WAL)
      A durable log of every change, written before the change is
      applied, the mechanism most databases use to survive crashes
      without losing committed data.

----

.. seealso::

   Previous: :doc:`at-scale`
