-- Runs once, when the Postgres volume is first created.
-- Creates the separate database used by the pytest suite.
CREATE DATABASE acme_events_test;
