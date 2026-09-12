-- Additive migration: preserves existing church, volunteer and schedule data.

ALTER TABLE "Volunteer"
  ADD COLUMN "accessClerkUserId" TEXT,
  ALTER COLUMN "departamento" DROP NOT NULL;

CREATE UNIQUE INDEX "Volunteer_accessClerkUserId_key"
  ON "Volunteer"("accessClerkUserId");

CREATE TABLE "Ministry" (
  "id" TEXT NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "leaderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ministry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ministry_clerkUserId_idx" ON "Ministry"("clerkUserId");

CREATE TABLE "_VolunteerMinistries" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_VolunteerMinistries_AB_unique"
  ON "_VolunteerMinistries"("A", "B");
CREATE INDEX "_VolunteerMinistries_B_index"
  ON "_VolunteerMinistries"("B");

ALTER TABLE "Schedule"
  ADD COLUMN "ministryId" TEXT;

ALTER TABLE "Ministry"
  ADD CONSTRAINT "Ministry_clerkUserId_fkey"
  FOREIGN KEY ("clerkUserId") REFERENCES "UserSettings"("clerkUserId")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Ministry_leaderId_fkey"
  FOREIGN KEY ("leaderId") REFERENCES "Volunteer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Schedule"
  ADD CONSTRAINT "Schedule_ministryId_fkey"
  FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_VolunteerMinistries"
  ADD CONSTRAINT "_VolunteerMinistries_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Ministry"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_VolunteerMinistries_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Volunteer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing accounts start in the default ministry and remain fully accessible.
INSERT INTO "Ministry" ("id", "clerkUserId", "nome", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text)::uuid::text,
       settings."clerkUserId",
       'Obreiros',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "UserSettings" settings;

INSERT INTO "_VolunteerMinistries" ("A", "B")
SELECT ministry."id", volunteer."id"
FROM "Ministry" ministry
JOIN "Volunteer" volunteer
  ON volunteer."clerkUserId" = ministry."clerkUserId";

UPDATE "Schedule" schedule
SET "ministryId" = ministry."id"
FROM "Event" event
JOIN "Ministry" ministry
  ON ministry."clerkUserId" = event."clerkUserId"
WHERE schedule."eventId" = event."id";