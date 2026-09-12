Authentication and least privilege
======================================

Your app should not be able to do more to the database than it actually needs to.

.. _why-not-superuser:

Why the app user shouldn't be an admin
--------------------------------------------

It's tempting to connect as the same superuser you use to run migrations,
one set of credentials, one less thing to manage. The problem shows up the
first time there's a bug or an injection vulnerability, an app connecting as
superuser can drop tables, read other databases on the same server, and
change permissions, not just misbehave inside its own data.

.. warning::
   If your app's database credentials could run ``DROP DATABASE``, that's not
   a hypothetical risk, that's the blast radius of your next bug.

.. _role-separation:

Splitting roles by job
--------------------------

Postgres

A reasonable minimum split for most production systems:

.. list-table::
   :header-rows: 1
   :widths: 25 35 40

   * - Role
     - Can do
     - Used by
   * - **App**
     - SELECT, INSERT, UPDATE, DELETE on app tables only
     - The application itself
   * - **Migration**
     - Everything the app role has, plus schema changes
     - CI/CD pipeline, not the running app
   * - **Read only**
     - SELECT only
     - Analytics, reporting tools, read replicas exposed to other teams
   * - **Admin**
     - Full control
     - A human, used rarely, ideally with extra auth like MFA

.. _grant-example:

Setting this up
-------------------



.. code-block:: sql

     CREATE ROLE app_user LOGIN PASSWORD '...';
     GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

     CREATE ROLE readonly_user LOGIN PASSWORD '...';
     GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

.. code-block:: sql

     CREATE USER 'app_user'@'%' IDENTIFIED BY '...';
     GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_user'@'%';

     CREATE USER 'readonly_user'@'%' IDENTIFIED BY '...';
     GRANT SELECT ON mydb.* TO 'readonly_user'@'%';

Default privileges catch you later
----------------------------------------

Granting privileges on today's tables doesn't cover tables created tomorrow.
It's easy to grant access carefully at setup, then six months later add a new
table that's wide open because nobody remembered to grant it explicitly.

.. code-block:: sql

   -- Postgres: make sure future tables inherit the same grants
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

.. note::
   Worth a recurring check, not just a one time setup: does every table
   actually have the permissions you think it has, or just the ones it had
   when it was created.

.. _row-level-security:

Row level security
-----------------------

Beyond table-level grants, some databases can restrict access to specific
rows based on who's asking, not just what table they're touching.

.. code-block:: sql

   -- Postgres: a tenant can only see their own rows
   CREATE POLICY tenant_isolation ON orders
     USING (tenant_id = current_setting('app.tenant_id')::int);

Useful for multi-tenant systems where a bug in application logic shouldn't
be able to leak one customer's data to another, the database enforces it
even if the app forgets to filter.

.. _service-vs-human:

Service accounts vs human accounts
------------------------------------------

An app's database credentials and a person's personal login should never be
the same thing. Service accounts should be scoped tightly to what the app
needs, human accounts should be individually identifiable, so access can be
traced back to a specific person, not a shared password everyone knows.

.. _mfa-admin:

MFA for admin access
--------------------------

The admin role, the one that can do real damage, is exactly the one worth
protecting with more than a password. Most managed database providers
support MFA on the console or CLI access, worth turning on even if it adds a
small amount of friction.

.. _network-access-control:

Network level access control
-----------------------------------

Least privilege isn't only about what a role can query, it's also about
where connections can come from at all.

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Control
     - What it limits
   * - VPC / private network
     - The database isn't reachable from the public internet at all
   * - Firewall / security group rules
     - Only specific known IP ranges can even attempt to connect
   * - IP allowlisting
     - A manual list of exactly which sources are trusted

A perfectly scoped role still doesn't help if the database is reachable from
anywhere on the internet in the first place.

.. _auditing-privilege-changes:

Auditing who changed what permission
--------------------------------------------

Grants and revokes should leave a trail. If a role suddenly has more access
than it did last month, you want to be able to answer who changed that and
when, not just notice it happened.

.. _just-in-time-access:

Temporary, just in time access
------------------------------------

Instead of a human having standing admin access all the time, some setups
grant elevated access only for a limited window, requested and approved for
a specific task, and automatically revoked afterward. Shrinks the window
where a compromised account could do real damage.

.. _offboarding-access:

Revoking access when someone leaves
-------------------------------------------

A surprisingly common gap, a former employee's or contractor's database
credentials quietly still work months after they've left. Tie credential
revocation to your offboarding process directly, not to someone remembering
to do it separately.

.. _db-vs-app-authorization:

Database level vs application level authorization
------------------------------------------------------------

Application code often has its own permission checks, "can this user see
this order." Those checks are only a backstop if the database itself would
also refuse an unauthorized query, relying on the app to always remember to
check is a single point of failure, row level security or scoped roles are
the actual enforcement layer.

.. _cert-based-auth:

Certificate based authentication
--------------------------------------

Instead of, or in addition to, a password, some setups authenticate
connections using client certificates. Harder to phish or accidentally leak
in a log line than a password, but adds real overhead to issue, rotate, and
distribute the certificates.

.. _reviewing-permissions:

Reviewing permissions on a schedule
--------------------------------------------

Access accumulates over time, someone gets temporary write access for a
migration and it's never revoked, a role gets a broad grant "just to get
something working" and nobody circles back. A periodic review, even just
quarterly, catches drift that no single change would have flagged on its
own.
