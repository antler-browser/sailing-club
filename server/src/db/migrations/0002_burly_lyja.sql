CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` text NOT NULL,
	`user_did` text NOT NULL,
	`date` text NOT NULL,
	`start_slot` integer NOT NULL,
	`end_slot` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_equipment_date` ON `bookings` (`equipment_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_bookings_user` ON `bookings` (`user_did`);--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`sort_order` integer DEFAULT 0
);
