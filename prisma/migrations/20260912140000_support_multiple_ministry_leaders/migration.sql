CREATE TABLE "_MinistryLeaders" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_MinistryLeaders_AB_unique" ON "_MinistryLeaders"("A", "B");
CREATE INDEX "_MinistryLeaders_B_index" ON "_MinistryLeaders"("B");

ALTER TABLE "_MinistryLeaders"
  ADD CONSTRAINT "_MinistryLeaders_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Ministry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_MinistryLeaders_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Volunteer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "_MinistryLeaders" ("A", "B")
SELECT "id", "leaderId" FROM "Ministry" WHERE "leaderId" IS NOT NULL;

ALTER TABLE "Ministry" DROP CONSTRAINT IF EXISTS "Ministry_leaderId_fkey";
ALTER TABLE "Ministry" DROP COLUMN "leaderId";