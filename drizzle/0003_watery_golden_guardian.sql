CREATE TABLE `share_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`contextType` enum('trip','shared_home','group_fund') NOT NULL,
	`contextId` varchar(128) NOT NULL,
	`contextName` text NOT NULL,
	`snapshotJson` text NOT NULL,
	`snapshotHash` varchar(128) NOT NULL,
	`ownerKeyHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `share_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `share_sessions_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `sync_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageTokenHash` varchar(128) NOT NULL,
	`sessionId` int NOT NULL,
	`baseSnapshotHash` varchar(128) NOT NULL,
	`editedSnapshotJson` text NOT NULL,
	`changeSummaryJson` text NOT NULL,
	`recipientName` varchar(255),
	`status` enum('pending','applied','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`appliedAt` timestamp,
	CONSTRAINT `sync_packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `sync_packages_packageTokenHash_unique` UNIQUE(`packageTokenHash`)
);
