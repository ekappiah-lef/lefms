-- LEF MS schema   pure DDL, no seed data (see server/seed.js for that).
-- Regenerated 2026-09-05 from the live database via mysqldump --no-data;
-- keep this in sync whenever a migration changes the schema.
DROP DATABASE IF EXISTS `lefms`;
CREATE DATABASE `lefms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lefms`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag` varchar(30) NOT NULL,
  `name` varchar(120) NOT NULL,
  `category` varchar(60) NOT NULL,
  `site_id` int(11) NOT NULL,
  `manufacturer` varchar(80) DEFAULT NULL,
  `model` varchar(80) DEFAULT NULL,
  `serial_no` varchar(80) DEFAULT NULL,
  `calibration_due_date` date DEFAULT NULL,
  `warranty_expiry` date DEFAULT NULL,
  `status` enum('Operational','Under Maintenance','Out of Service','Retired') NOT NULL DEFAULT 'Operational',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag` (`tag`),
  KEY `idx_assets_site` (`site_id`),
  KEY `idx_assets_status` (`status`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('work_order','ehs_record','spare_request') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `history_id` int(11) DEFAULT NULL,
  `stage` enum('creation','completion','other') NOT NULL DEFAULT 'other',
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_attachments_entity` (`entity_type`,`entity_id`),
  KEY `idx_attachments_history` (`history_id`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `attachments_ibfk_2` FOREIGN KEY (`history_id`) REFERENCES `ticket_history` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ehs_checklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ehs_checklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ehs_record_id` int(11) NOT NULL,
  `question` varchar(200) NOT NULL,
  `response` enum('Yes','No','N/A') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ehs_record_id` (`ehs_record_id`),
  CONSTRAINT `ehs_checklist_ibfk_1` FOREIGN KEY (`ehs_record_id`) REFERENCES `ehs_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ehs_checklist_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ehs_checklist_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(200) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ehs_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ehs_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ehs_no` varchar(30) NOT NULL,
  `work_order_id` int(11) NOT NULL,
  `status` enum('PENDING','SUBMITTED','REVIEWED') NOT NULL DEFAULT 'PENDING',
  `outcome` enum('Approved','Flagged') DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ehs_no` (`ehs_no`),
  UNIQUE KEY `work_order_id` (`work_order_id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_ehs_status` (`status`),
  CONSTRAINT `ehs_records_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ehs_records_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `ehs_records_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `regions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_code` varchar(30) NOT NULL,
  `name` varchar(120) NOT NULL,
  `region_id` int(11) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `assigned_engineer_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_code` (`site_code`),
  KEY `idx_sites_region` (`region_id`),
  KEY `idx_sites_engineer` (`assigned_engineer_id`),
  CONSTRAINT `sites_ibfk_1` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `sites_ibfk_2` FOREIGN KEY (`assigned_engineer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `spare_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `spare_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sku` varchar(40) NOT NULL,
  `name` varchar(160) NOT NULL,
  `category` varchar(60) DEFAULT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs',
  `unit_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reorder_level` int(11) NOT NULL DEFAULT 0,
  `quantity_on_hand` int(11) NOT NULL DEFAULT 0,
  `store_location` varchar(120) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_spare_items_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `spare_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `spare_request_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spare_request_id` int(11) NOT NULL,
  `spare_item_id` int(11) NOT NULL,
  `qty_requested` int(11) NOT NULL,
  `qty_issued` int(11) NOT NULL DEFAULT 0,
  `qty_returned` int(11) NOT NULL DEFAULT 0,
  `unit_cost_snapshot` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `spare_request_id` (`spare_request_id`),
  KEY `spare_item_id` (`spare_item_id`),
  CONSTRAINT `spare_request_items_ibfk_1` FOREIGN KEY (`spare_request_id`) REFERENCES `spare_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `spare_request_items_ibfk_2` FOREIGN KEY (`spare_item_id`) REFERENCES `spare_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `spare_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `spare_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_no` varchar(30) NOT NULL,
  `work_order_id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `status` enum('Requested','Approved','Rejected','Issued','Partially Issued','Closed') NOT NULL DEFAULT 'Requested',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `decided_by` int(11) DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `decision_note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_no` (`request_no`),
  KEY `site_id` (`site_id`),
  KEY `requested_by` (`requested_by`),
  KEY `decided_by` (`decided_by`),
  KEY `idx_spare_requests_wo` (`work_order_id`),
  KEY `idx_spare_requests_status` (`status`),
  CONSTRAINT `spare_requests_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `spare_requests_ibfk_2` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`),
  CONSTRAINT `spare_requests_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `spare_requests_ibfk_4` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `spare_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `spare_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `spare_item_id` int(11) NOT NULL,
  `spare_request_item_id` int(11) DEFAULT NULL,
  `type` enum('Issue','Return','Adjustment','Restock','Sent for Service','Direct Issue','Direct Return') NOT NULL,
  `qty` int(11) NOT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `site_id` int(11) DEFAULT NULL,
  `performed_by` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `spare_request_item_id` (`spare_request_item_id`),
  KEY `work_order_id` (`work_order_id`),
  KEY `site_id` (`site_id`),
  KEY `performed_by` (`performed_by`),
  KEY `idx_spare_tx_item` (`spare_item_id`),
  CONSTRAINT `spare_transactions_ibfk_1` FOREIGN KEY (`spare_item_id`) REFERENCES `spare_items` (`id`),
  CONSTRAINT `spare_transactions_ibfk_2` FOREIGN KEY (`spare_request_item_id`) REFERENCES `spare_request_items` (`id`),
  CONSTRAINT `spare_transactions_ibfk_3` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `spare_transactions_ibfk_4` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`),
  CONSTRAINT `spare_transactions_ibfk_5` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ticket_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('work_order','ehs_record','spare_request','trouble_ticket') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) NOT NULL,
  `action` varchar(30) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `checklist_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checklist_snapshot`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `actor_id` (`actor_id`),
  KEY `idx_history_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `ticket_history_ibfk_1` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `trouble_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trouble_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tt_no` varchar(30) NOT NULL,
  `site_id` int(11) NOT NULL,
  `site_code` varchar(30) NOT NULL,
  `site_name` varchar(120) NOT NULL,
  `region_id` int(11) NOT NULL,
  `region_name` varchar(60) NOT NULL,
  `site_location` varchar(255) DEFAULT NULL,
  `site_priority` enum('Low','Medium','High','Critical') NOT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `title` varchar(160) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('Low','Medium','High','Critical','Emergency') NOT NULL DEFAULT 'Medium',
  `status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  `engineer_id` int(11) NOT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `closed_at` datetime DEFAULT NULL,
  `closed_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tt_no` (`tt_no`),
  KEY `idx_tt_site` (`site_id`),
  KEY `idx_tt_region` (`region_id`),
  KEY `idx_tt_status` (`status`),
  KEY `idx_tt_engineer` (`engineer_id`),
  KEY `idx_tt_wo` (`work_order_id`),
  KEY `trouble_tickets_ibfk_3` (`asset_id`),
  KEY `trouble_tickets_ibfk_5` (`created_by`),
  KEY `trouble_tickets_ibfk_6` (`closed_by`),
  CONSTRAINT `trouble_tickets_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`),
  CONSTRAINT `trouble_tickets_ibfk_2` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `trouble_tickets_ibfk_3` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `trouble_tickets_ibfk_4` FOREIGN KEY (`engineer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `trouble_tickets_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `trouble_tickets_ibfk_6` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `trouble_tickets_ibfk_7` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_no` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `region_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_no` (`staff_no`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_region` (`region_id`),
  KEY `idx_users_role` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wo_checklist_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wo_checklist_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(200) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_order_checklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_order_checklist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_order_id` int(11) NOT NULL,
  `task` varchar(200) NOT NULL,
  `response` enum('Yes','No','N/A') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `work_order_id` (`work_order_id`),
  CONSTRAINT `work_order_checklist_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_order_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_order_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_order_id` int(11) NOT NULL,
  `author_id` int(11) NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `work_order_id` (`work_order_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `work_order_comments_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_order_comments_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wo_no` varchar(30) NOT NULL,
  `wo_type` enum('CM','PM','PLM') NOT NULL,
  `site_id` int(11) NOT NULL,
  `site_code` varchar(30) NOT NULL,
  `site_name` varchar(120) NOT NULL,
  `region_id` int(11) NOT NULL,
  `region_name` varchar(60) NOT NULL,
  `site_location` varchar(255) DEFAULT NULL,
  `site_priority` enum('Low','Medium','High','Critical') NOT NULL,
  `asset_id` int(11) DEFAULT NULL,
  `title` varchar(160) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('Low','Medium','High','Critical','Emergency') NOT NULL DEFAULT 'Medium',
  `status` enum('CR','PR','CO','CL','RJ','CA') NOT NULL DEFAULT 'CR',
  `frequency` enum('Daily','Weekly','Biweekly','Monthly','Quarterly','Biannual','Annual') DEFAULT NULL,
  `next_due` date DEFAULT NULL,
  `last_done` date DEFAULT NULL,
  `planned_date` date DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `engineer_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wo_no` (`wo_no`),
  KEY `asset_id` (`asset_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_wo_type` (`wo_type`),
  KEY `idx_wo_site` (`site_id`),
  KEY `idx_wo_region` (`region_id`),
  KEY `idx_wo_status` (`status`),
  KEY `idx_wo_engineer` (`engineer_id`),
  KEY `idx_wo_created` (`created_at`),
  CONSTRAINT `work_orders_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`),
  CONSTRAINT `work_orders_ibfk_2` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `work_orders_ibfk_3` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `work_orders_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `work_orders_ibfk_5` FOREIGN KEY (`engineer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

