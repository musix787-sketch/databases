Databases, from the ground up
==============================

This is the guide I wish someone had handed me before my first "design the
schema" interview question. It goes from "what even is a database" to why
your production Postgres instance falls over at 3am, and it tries not to
skip the boring-but-important parts in between.

Each topic below is its own page. Use the menu on the left, or browse by
section here.

Start here
----------

.. grid:: 1 2 2 2
   :gutter: 3

   .. grid-item-card:: What's a database, really
      :link: start
      :link-alt: what-is-a-database

      Strip away the buzzwords and a database is just an organized pile of
      information kept somewhere it won't...

   .. grid-item-card:: What a DBMS is actually doing all day
      :link: start
      :link-alt: what-is-a-dbms

      A DBMS earns its keep by doing a handful of unglamorous jobs,
      constantly, without you noticing. When you...

   .. grid-item-card:: Why not just use files?
      :link: start
      :link-alt: files-vs-dbms

      You genuinely can build a system on flat files, CSVs, JSON blobs,
      whatever. Plenty of small tools do...

Data models
-----------

.. grid:: 1 2 2 2
   :gutter: 3

   .. grid-item-card:: The five shapes data can take
      :link: data-models

      Picking a data model is picking which questions will be easy to ask
      later and which will be painful...

   .. grid-item-card:: "SQL vs. NoSQL" isn't really the question
      :link: data-models

      This gets framed as a rivalry, but it's closer to comparing a
      screwdriver to a whole toolbox labeled "not"...

Under the hood
---------------

.. grid:: 1 2 2 2
   :gutter: 3

   .. grid-item-card:: ACID, unpacked
      :link: under-the-hood

      ACID gets recited like a magic word in interviews, but each letter
      is answering a specific, concrete fear...

   .. grid-item-card:: Normal forms, without the textbook language
      :link: under-the-hood

      Normalization is really just "don't write the same fact in two
      places." If a customer's address changes,...

   .. grid-item-card:: Indexes: the whole reason queries aren't slow
      :link: under-the-hood

      Without an index, finding a row means the database checks every
      single one, a full table scan. On a table...

   .. grid-item-card:: Transactions and what happens when two writes collide
      :link: under-the-hood

      A transaction is a group of operations that either all succeed or
      all fail together, you saw the "A" in...

   .. grid-item-card:: The CAP theorem, in one paragraph
      :link: under-the-hood

      Once a database is spread across more than one machine, the network
      between those machines will eventually...

At scale
--------

.. grid:: 1 2 2 2
   :gutter: 3

   .. grid-item-card:: Replication: copies for safety and speed
      :link: at-scale

      A replica is a second copy of your database that stays in sync with
      the original, usually by streaming the...

   .. grid-item-card:: Sharding: when one machine isn't enough, period
      :link: at-scale

      Replication copies the same data everywhere. Sharding does the
      opposite, it splits the data itself across...

Reference
---------

.. grid:: 1 2 2 2
   :gutter: 3

   .. grid-item-card:: Popular systems, and where they actually shine
      :link: reference

      None of these "win" outright, each was built with a specific set of
      trade-offs in mind, and the honest...

   .. grid-item-card:: Glossary
      :link: reference

      Key terms used throughout this guide.

----
