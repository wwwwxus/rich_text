CREATE DATABASE  IF NOT EXISTS `rich_text_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `rich_text_db`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: rich_text_db
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `collaborations`
--

DROP TABLE IF EXISTS `collaborations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `collaborations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `knowledgeBaseId` int NOT NULL,
  `permission` enum('read','write','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'read',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_kb` (`userId`,`knowledgeBaseId`),
  KEY `fk_collaborations_user_idx` (`userId`),
  KEY `fk_collaborations_kb_idx` (`knowledgeBaseId`),
  CONSTRAINT `fk_collaborations_kb` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `knowledgebases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collaborations_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collaborations`
--

LOCK TABLES `collaborations` WRITE;
/*!40000 ALTER TABLE `collaborations` DISABLE KEYS */;
/*!40000 ALTER TABLE `collaborations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `knowledgeBaseId` int NOT NULL,
  `folderId` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_documents_kb_idx` (`knowledgeBaseId`),
  KEY `fk_documents_folder_idx` (`folderId`),
  CONSTRAINT `fk_documents_folder` FOREIGN KEY (`folderId`) REFERENCES `folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_kb` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `knowledgebases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (5,'测试文档','这是第二个版本的内容，内容增加了 - 2025/6/28 19:18:03',21,2,0,'2025-06-28 19:16:54','2025-06-28 20:02:36'),(7,'hihi','哈哈哈哈哈哈',21,NULL,0,'2025-06-28 19:58:08','2025-06-28 20:01:51'),(8,'hihi','',21,NULL,1,'2025-06-28 20:04:23','2025-06-28 20:04:23'),(9,'hihi','xixixixixii',22,NULL,1,'2025-06-28 20:08:38','2025-06-28 20:32:36');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentversions`
--

DROP TABLE IF EXISTS `documentversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentversions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentId` int NOT NULL COMMENT '文档id',
  `versionNumber` int NOT NULL DEFAULT '0' COMMENT '版本号',
  `content` longtext NOT NULL COMMENT '该版本的内容',
  `diff` text COMMENT '与上一版本的差别',
  `savedAt` datetime NOT NULL COMMENT '保存时间',
  `isActive` tinyint(1) DEFAULT '1' COMMENT '是否有效',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_versions_document_id_version_number` (`documentId`,`versionNumber`),
  KEY `document_versions_document_id` (`documentId`),
  CONSTRAINT `documentversions_ibfk_1` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentversions`
--

LOCK TABLES `documentversions` WRITE;
/*!40000 ALTER TABLE `documentversions` DISABLE KEYS */;
INSERT INTO `documentversions` VALUES (9,5,0,'这是第一个版本的内容 - 2025/6/28 19:18:03','内容减少 6 个字符','2025-06-28 19:18:03',0,'2025-06-28 19:18:03','2025-06-28 20:02:36'),(12,5,1,'这是第二个版本的内容，内容增加了 - 2025/6/28 19:18:03','内容增加 6 个字符','2025-06-28 19:18:03',0,'2025-06-28 19:18:03','2025-06-28 20:02:36'),(13,5,2,'这是第二个版本的内容，内容增加了 - 2025/6/28 19:18:03','内容增加 6 个字符','2025-06-28 19:18:03',0,'2025-06-28 19:18:03','2025-06-28 20:02:36'),(14,7,1,'','初始版本','2025-06-28 19:58:08',0,'2025-06-28 19:58:08','2025-06-28 20:01:51'),(15,7,2,'hihi我来给你添加内容了','初始版本','2025-06-28 20:00:53',0,'2025-06-28 20:00:53','2025-06-28 20:01:51'),(16,7,3,'哈哈哈哈哈哈','内容减少 7 个字符','2025-06-28 20:01:09',0,'2025-06-28 20:01:09','2025-06-28 20:01:51'),(17,8,1,'','初始版本','2025-06-28 20:04:23',1,'2025-06-28 20:04:23','2025-06-28 20:04:23'),(18,9,1,'xixixixixii','初始版本','2025-06-28 20:08:38',1,'2025-06-28 20:08:38','2025-06-28 20:08:38'),(19,9,2,'好好笑','内容减少 8 个字符','2025-06-28 20:14:09',0,'2025-06-28 20:14:09','2025-06-28 20:35:08'),(20,9,3,'xixixixixii','内容增加 8 个字符','2025-06-28 20:32:36',1,'2025-06-28 20:32:36','2025-06-28 20:32:36');
/*!40000 ALTER TABLE `documentversions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `folders`
--

DROP TABLE IF EXISTS `folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `folders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `knowledgeBaseId` int NOT NULL,
  `parentFolderId` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_folders_kb_idx` (`knowledgeBaseId`),
  KEY `fk_folders_parent_idx` (`parentFolderId`),
  CONSTRAINT `fk_folders_kb` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `knowledgebases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_folders_parent` FOREIGN KEY (`parentFolderId`) REFERENCES `folders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folders`
--

LOCK TABLES `folders` WRITE;
/*!40000 ALTER TABLE `folders` DISABLE KEYS */;
INSERT INTO `folders` VALUES (2,'测试文件夹',21,NULL,1,'2025-06-28 19:16:54','2025-06-28 19:16:54');
/*!40000 ALTER TABLE `folders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledgebases`
--

DROP TABLE IF EXISTS `knowledgebases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledgebases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ownerId` int NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_knowledge_bases_owner_idx` (`ownerId`),
  CONSTRAINT `fk_knowledge_bases_owner` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledgebases`
--

LOCK TABLES `knowledgebases` WRITE;
/*!40000 ALTER TABLE `knowledgebases` DISABLE KEYS */;
INSERT INTO `knowledgebases` VALUES (1,'我的第一个知识库','这是一个测试知识库',1,1,'2025-06-21 17:47:25','2025-06-21 17:47:25'),(2,'项目文档','项目相关文档集合',1,1,'2025-06-21 17:47:25','2025-06-21 17:47:25'),(3,'DJQ','djqcccc',3,1,'2025-06-21 17:01:43','2025-06-21 17:01:43'),(4,'测试','测hi是城市都从内地市场不动产v举报v从',5,1,'2025-06-24 18:40:18','2025-06-24 18:40:18'),(5,'嘻嘻嘻嘻','嘻嘻嘻嘻嘻嘻嘻i嘻嘻嘻嘻嘻',5,1,'2025-06-24 18:56:30','2025-06-24 18:56:30'),(6,'知识库名称999','知识库简介999',5,1,'2025-06-24 22:14:44','2025-06-24 22:14:44'),(7,'111','111111111111',5,1,'2025-06-24 22:27:46','2025-06-24 22:27:46'),(8,'222','222222222222222222222',5,1,'2025-06-24 23:30:15','2025-06-24 23:30:15'),(9,'222','222222222222222222',9,0,'2025-06-26 11:58:57','2025-06-26 17:28:16'),(10,'ceshi','111111111111111',9,1,'2025-06-26 12:02:46','2025-06-26 12:02:46'),(11,'333',' nj k h g vjb k m',9,1,'2025-06-26 12:03:02','2025-06-26 12:03:02'),(12,'ceshiunjj ','bhjhhnjnk',9,1,'2025-06-26 12:05:10','2025-06-26 12:05:10'),(13,'1111','333333333333',9,1,'2025-06-26 12:06:20','2025-06-26 12:06:20'),(14,'52','njhn mj nubgyb',9,1,'2025-06-26 12:08:09','2025-06-26 12:08:09'),(15,'我是最后一次','请成功！！',9,1,'2025-06-26 12:09:32','2025-06-26 12:09:32'),(16,'11111111111','cbnidsvbdviubgrfeui',9,1,'2025-06-26 12:43:12','2025-06-26 12:43:12'),(17,'nccbfj','fvn wkerjngv rjw',9,1,'2025-06-26 12:43:45','2025-06-26 12:43:45'),(21,'测试知识库','这是一个用于测试的知识库',21,1,'2025-06-28 19:16:54','2025-06-28 19:16:54'),(22,'11','1111111111',23,1,'2025-06-29 17:51:29','2025-06-29 17:51:29'),(23,'222','222222',23,1,'2025-06-29 17:51:43','2025-06-29 17:51:43');
/*!40000 ALTER TABLE `knowledgebases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recentaccess`
--

DROP TABLE IF EXISTS `recentaccess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recentaccess` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `knowledgeBaseId` int NOT NULL,
  `lastAccessedAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_kb_access` (`userId`,`knowledgeBaseId`),
  KEY `fk_recent_access_user_idx` (`userId`),
  KEY `fk_recent_access_kb_idx` (`knowledgeBaseId`),
  CONSTRAINT `fk_recent_access_kb` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `knowledgebases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_recent_access_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recentaccess`
--

LOCK TABLES `recentaccess` WRITE;
/*!40000 ALTER TABLE `recentaccess` DISABLE KEYS */;
INSERT INTO `recentaccess` VALUES (1,5,4,'2025-06-25 20:07:54','2025-06-24 22:06:57','2025-06-25 20:07:54'),(2,5,5,'2025-06-24 23:04:36','2025-06-24 23:04:36','2025-06-24 23:04:36'),(4,9,9,'2025-06-26 12:47:30','2025-06-26 12:43:59','2025-06-26 12:47:30'),(6,9,16,'2025-06-26 12:44:05','2025-06-26 12:44:05','2025-06-26 12:44:05'),(7,9,17,'2025-06-26 12:44:06','2025-06-26 12:44:06','2025-06-26 12:44:06'),(8,9,12,'2025-06-26 12:44:08','2025-06-26 12:44:08','2025-06-26 12:44:08'),(10,9,11,'2025-06-26 17:36:26','2025-06-26 12:48:07','2025-06-26 17:36:26'),(11,9,10,'2025-06-26 17:26:43','2025-06-26 17:26:43','2025-06-26 17:26:43'),(12,9,15,'2025-06-26 17:29:12','2025-06-26 17:29:06','2025-06-26 17:29:12');
/*!40000 ALTER TABLE `recentaccess` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `textcomments`
--

DROP TABLE IF EXISTS `textcomments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `textcomments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `textNanoid` varchar(50) NOT NULL COMMENT '所选文本的唯一标识',
  `comment` text NOT NULL COMMENT '评论内容',
  `userId` int NOT NULL COMMENT '评论用户ID',
  `documentId` int NOT NULL COMMENT '文档ID',
  `parentId` int DEFAULT NULL COMMENT '父评论ID，支持嵌套回复',
  `isActive` tinyint(1) DEFAULT '1' COMMENT '是否有效',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `text_comments_text_nanoid` (`textNanoid`),
  KEY `text_comments_document_id` (`documentId`),
  KEY `text_comments_user_id` (`userId`),
  KEY `text_comments_parent_id` (`parentId`),
  CONSTRAINT `textcomments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `textcomments_ibfk_2` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `textcomments_ibfk_3` FOREIGN KEY (`parentId`) REFERENCES `textcomments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `textcomments`
--

LOCK TABLES `textcomments` WRITE;
/*!40000 ALTER TABLE `textcomments` DISABLE KEYS */;
INSERT INTO `textcomments` VALUES (6,'98','你好','哈哈哈哈哈',21,8,NULL,1,'2025-06-28 20:04:48','2025-06-28 20:04:48'),(7,'98','你好','xixixixixiixx',21,8,NULL,1,'2025-06-28 20:06:31','2025-06-28 20:06:31'),(8,'98','xixi','xixixixixiixx',22,9,NULL,0,'2025-06-28 20:09:05','2025-06-28 20:11:23');
/*!40000 ALTER TABLE `textcomments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@example.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',1,'2025-06-21 17:47:25','2025-06-21 17:47:25'),(3,'djq','djq@qq.com','$2a$10$zdXL4.kzKziya6DCj8dRzu5QD9TZK0IOf1aOogd6hhCbzz8MkECYq',1,'2025-06-21 16:53:38','2025-06-21 16:53:38'),(4,'xinxin','xx@qq.com','$2a$10$UOzlIOs8ipfBaFHlyQeOi.9Vscp21hAl5rsJAnV/esEtuGfH1sA9q',1,'2025-06-22 01:10:25','2025-06-22 01:10:25'),(5,'闻语桐','123456@126.com','$2a$10$85XVxjbtOXSs6n.hvI6/F.ylkNhYHfG0CBUvrwqnY03Qkc6LocXim',1,'2025-06-24 17:46:40','2025-06-24 17:46:40'),(6,'xxx','xxxx@126.com','$2a$10$VEUpZVNd3ZFR5OHq4/s6e.ppdQ4x//JWUy35InlS6gd6dGWYpnUI6',1,'2025-06-24 22:15:17','2025-06-24 22:15:17'),(7,'lll','lll@126.com','$2a$10$IUuPdIFmb6V37xEak9OaCeHvjjjZ7dPlndbv4Zbhx6H/VfgrO7LXK',1,'2025-06-24 22:26:59','2025-06-24 22:26:59'),(9,'djq111','111@qq.com','$2a$10$XMlDrKEM3SGDAPfN5A9VnujCQN2Zuwmhyjr5EMcFXHRYbJImgMYku',1,'2025-06-26 11:57:50','2025-06-26 11:57:50'),(10,'qjd','123@qq.com','$2a$10$ZV80UXEIpKs.4IZ9jcgAV.oUEVoeC8IbYcVcz8Bp1rJ1UJbZqi/Te',1,'2025-06-28 10:31:35','2025-06-28 10:31:35'),(11,'aaabbb','3456@qq.com','$2a$10$NvCS/51LI6ehTj2IKN82NeWrm1uxcNScrunHqXPRPj3j2BPsPDV4O',1,'2025-06-28 11:35:42','2025-06-28 11:35:42'),(21,'testuser','test@example.com','$2a$10$FeDncYaZazkq6CfpgByV6.MCAnFkD1PZCpFEriSZZS2Y4juvXQRmS',1,'2025-06-28 19:16:54','2025-06-28 19:16:54'),(22,'励国兰','123456@outlook.com','$2a$10$dVXNsf3GqN2HFYiv5WQj0eYtOh4kx7JfS/6xR4EUtBTm2xDAJQ.Fi',1,'2025-06-28 20:07:47','2025-06-28 20:07:47'),(23,'111','789@qq.com','$2a$10$P7CW9LXfi0xR5LD5HdFUEeRzYAtsQzfZODGUMn0dpOyRQG.jBgKcS',1,'2025-06-29 17:50:57','2025-06-29 17:50:57');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-29 20:58:49
