
USE rich_text_db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(30) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建知识库表
CREATE TABLE IF NOT EXISTS `KnowledgeBases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `ownerId` INT NOT NULL,
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_knowledge_bases_owner_idx` (`ownerId` ASC),
  CONSTRAINT `fk_knowledge_bases_owner`
    FOREIGN KEY (`ownerId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建协作关系表
CREATE TABLE IF NOT EXISTS `Collaborations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `knowledgeBaseId` INT NOT NULL,
  `permission` ENUM('read', 'write', 'admin') DEFAULT 'read',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_user_kb` (`userId`, `knowledgeBaseId`),
  INDEX `fk_collaborations_user_idx` (`userId` ASC),
  INDEX `fk_collaborations_kb_idx` (`knowledgeBaseId` ASC),
  CONSTRAINT `fk_collaborations_user`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_collaborations_kb`
    FOREIGN KEY (`knowledgeBaseId`)
    REFERENCES `KnowledgeBases` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建文件夹表
CREATE TABLE IF NOT EXISTS `Folders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `knowledgeBaseId` INT NOT NULL,
  `parentFolderId` INT NULL,
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_folders_kb_idx` (`knowledgeBaseId` ASC),
  INDEX `fk_folders_parent_idx` (`parentFolderId` ASC),
  CONSTRAINT `fk_folders_kb`
    FOREIGN KEY (`knowledgeBaseId`)
    REFERENCES `KnowledgeBases` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_folders_parent`
    FOREIGN KEY (`parentFolderId`)
    REFERENCES `Folders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建文档表
CREATE TABLE IF NOT EXISTS `Documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT,
  `knowledgeBaseId` INT NOT NULL,
  `folderId` INT NULL,
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_documents_kb_idx` (`knowledgeBaseId` ASC),
  INDEX `fk_documents_folder_idx` (`folderId` ASC),
  CONSTRAINT `fk_documents_kb`
    FOREIGN KEY (`knowledgeBaseId`)
    REFERENCES `KnowledgeBases` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_documents_folder`
    FOREIGN KEY (`folderId`)
    REFERENCES `Folders` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建最近访问记录表
CREATE TABLE IF NOT EXISTS `RecentAccess` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `knowledgeBaseId` INT NOT NULL,
  `lastAccessedAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_user_kb_access` (`userId`, `knowledgeBaseId`),
  INDEX `fk_recent_access_user_idx` (`userId` ASC),
  INDEX `fk_recent_access_kb_idx` (`knowledgeBaseId` ASC),
  CONSTRAINT `fk_recent_access_user`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_recent_access_kb`
    FOREIGN KEY (`knowledgeBaseId`)
    REFERENCES `KnowledgeBases` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试数据
INSERT INTO `Users` (`username`, `email`, `password`, `createdAt`, `updatedAt`) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('testuser', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW());

INSERT INTO `KnowledgeBases` (`name`, `description`, `ownerId`, `createdAt`, `updatedAt`) VALUES
('我的第一个知识库', '这是一个测试知识库', 1, NOW(), NOW()),
('项目文档', '项目相关文档集合', 1, NOW(), NOW());

INSERT INTO `Collaborations` (`userId`, `knowledgeBaseId`, `permission`, `createdAt`, `updatedAt`) VALUES
(2, 1, 'read', NOW(), NOW()); 