CREATE TABLE "Polls" (
  "id" varchar(8) DEFAULT substr(gen_random_uuid()::text, 1, 8) PRIMARY KEY,
  "name" varchar(50) NOT NULL,
  "start_date" date,
  "end_date" date,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "Participants" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" varchar(50) NOT NULL,
  "poll_id" varchar(8) NOT NULL
);

CREATE TABLE "Availabilities" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "slot" tsmultirange NOT NULL,
  "participant_id" uuid NOT NULL
);

ALTER TABLE "Participants" ADD FOREIGN KEY ("poll_id") REFERENCES "Polls" ("id") ON DELETE CASCADE;

ALTER TABLE "Availabilities" ADD FOREIGN KEY ("participant_id") REFERENCES "Participants" ("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX uniq_participants_poll_name_ci
ON "Participants" (poll_id, LOWER(name));

CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Availabilities"
  ADD CONSTRAINT uniq_availability_participant_ci
  EXCLUDE USING gist (slot WITH &&, participant_id WITH =);

CREATE INDEX ON "Availabilities" USING gist (slot);