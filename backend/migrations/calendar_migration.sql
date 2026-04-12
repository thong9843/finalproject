ALTER TABLE activities ADD COLUMN end_date DATE NULL;
ALTER TABLE activities ADD COLUMN start_time TIME NULL;
ALTER TABLE activities ADD COLUMN end_time TIME NULL;
ALTER TABLE activities ADD COLUMN person_in_charge VARCHAR(255) NULL;
ALTER TABLE activities ADD COLUMN tasks JSON NULL;