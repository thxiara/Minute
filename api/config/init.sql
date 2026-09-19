CREATE DATABASE IF NOT EXISTS minute_db;
USE minute_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `Credentials` (
    `id_credentials` INT AUTO_INCREMENT PRIMARY KEY,
    `email`          VARCHAR(100) NOT NULL UNIQUE,
    `password`       VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `Role` (
    `id_role`   INT AUTO_INCREMENT PRIMARY KEY,
    `name_role` VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS `Exercise` (
    `id_exercise`   INT AUTO_INCREMENT PRIMARY KEY,
    `name_exercise` VARCHAR(30) NOT NULL,
    `desc_exercise` TEXT,
    `media_exercise` VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS `Product` (
    `id_product`   INT AUTO_INCREMENT PRIMARY KEY,
    `name_product` VARCHAR(40) NOT NULL,
    `stock`        INT NOT NULL DEFAULT 0,
    `price`        DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS `Membership` (
    `id_membership`   INT AUTO_INCREMENT PRIMARY KEY,
    `name_membership` VARCHAR(40) NOT NULL,
    `desc_membership` TEXT
);

CREATE TABLE IF NOT EXISTS `Client` (
    `id_client`     INT AUTO_INCREMENT PRIMARY KEY,
    `fr_credentials` INT NOT NULL,
    `fr_role`       INT NOT NULL,
    `phone`         INT,
    `name_client`   VARCHAR(50) NOT NULL,
    `C.I`           VARCHAR(20) NOT NULL UNIQUE,
    CONSTRAINT `fk_client_credentials`
        FOREIGN KEY (`fr_credentials`) REFERENCES `Credentials`(`id_credentials`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_client_role`
        FOREIGN KEY (`fr_role`) REFERENCES `Role`(`id_role`)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `Review` (
    `id_review`   INT AUTO_INCREMENT PRIMARY KEY,
    `fr_client`   INT NOT NULL,
    `desc_review` VARCHAR(300),
    `rating`      DECIMAL(3,1) NOT NULL,
    CONSTRAINT `fk_review_client`
        FOREIGN KEY (`fr_client`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `Routine` (
    `id_routine`   INT AUTO_INCREMENT PRIMARY KEY,
    `fr_trainer`   INT NOT NULL,
    `desc_routine` TEXT,
    `name_routine` VARCHAR(40) NOT NULL,
    CONSTRAINT `fk_routine_trainer`
        FOREIGN KEY (`fr_trainer`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `member_routine` (
    `id_member_routine` INT AUTO_INCREMENT PRIMARY KEY,
    `fr_client`         INT NOT NULL,
    `fr_routine`        INT NOT NULL,
    CONSTRAINT `fk_memberroutine_client`
        FOREIGN KEY (`fr_client`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_memberroutine_routine`
        FOREIGN KEY (`fr_routine`) REFERENCES `Routine`(`id_routine`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_member_routine` (`fr_client`, `fr_routine`)
);

CREATE TABLE IF NOT EXISTS `routine_exercise` (
    `id_routine_exercise` INT AUTO_INCREMENT PRIMARY KEY,
    `fr_routine`  INT NOT NULL,
    `fr_exercise` INT NOT NULL,
    `sets`        INT NOT NULL,
    `repetitions` INT NOT NULL,
    `time`        TIME,
    CONSTRAINT `fk_routineexercise_routine`
        FOREIGN KEY (`fr_routine`) REFERENCES `Routine`(`id_routine`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_routineexercise_exercise`
        FOREIGN KEY (`fr_exercise`) REFERENCES `Exercise`(`id_exercise`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `Purchase` (
    `id_purchase`    INT AUTO_INCREMENT PRIMARY KEY,
    `fr_client`      INT NOT NULL,
    `date_purchase`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `state_purchase` ENUM('paid', 'returned') NOT NULL DEFAULT 'paid',
    CONSTRAINT `fk_purchase_client`
        FOREIGN KEY (`fr_client`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `product_purchase` (
    `id_product_purchase` INT AUTO_INCREMENT PRIMARY KEY,
    `fr_purchase` INT NOT NULL,
    `fr_product`  INT NOT NULL,
    `quantity`    INT NOT NULL,
    CONSTRAINT `fk_productpurchase_purchase`
        FOREIGN KEY (`fr_purchase`) REFERENCES `Purchase`(`id_purchase`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_productpurchase_product`
        FOREIGN KEY (`fr_product`) REFERENCES `Product`(`id_product`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `member_membership` (
    `id_member_membership` INT AUTO_INCREMENT PRIMARY KEY,
    `fr_client`     INT NOT NULL,
    `fr_membership` INT NOT NULL,
    `last_renewed`  DATE NOT NULL,
    `expiry_date`   DATE NOT NULL,
    CONSTRAINT `fk_membermembership_client`
        FOREIGN KEY (`fr_client`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_membermembership_membership`
        FOREIGN KEY (`fr_membership`) REFERENCES `Membership`(`id_membership`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `Course` (
    `id_course`   INT AUTO_INCREMENT PRIMARY KEY,
    `fr_teacher`  INT NOT NULL,
    `name_course` VARCHAR(30) NOT NULL,
    `desc_course` TEXT,
    CONSTRAINT `fk_course_teacher`
        FOREIGN KEY (`fr_teacher`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `student_course` (
    `id_student_course` INT AUTO_INCREMENT PRIMARY KEY,
    `fr_client` INT NOT NULL,
    `fr_course` INT NOT NULL,
    CONSTRAINT `fk_studentcourse_client`
        FOREIGN KEY (`fr_client`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_studentcourse_course`
        FOREIGN KEY (`fr_course`) REFERENCES `Course`(`id_course`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_student_course` (`fr_client`, `fr_course`)
);

CREATE TABLE IF NOT EXISTS `Lesson` (
    `id_lesson`   INT AUTO_INCREMENT PRIMARY KEY,
    `fr_course`   INT NOT NULL,
    `state_lesson` ENUM('active', 'given', 'cancelled') NOT NULL DEFAULT 'active',
    `name_lesson`  VARCHAR(50) NOT NULL,
    `desc_lesson`  TEXT,
    `date_lesson`  DATE NOT NULL,
    CONSTRAINT `fk_lesson_course`
        FOREIGN KEY (`fr_course`) REFERENCES `Course`(`id_course`)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `student_lesson` (
    `id_student_lesson` INT AUTO_INCREMENT PRIMARY KEY,
    `fr_client` INT NOT NULL,
    `fr_lesson` INT NOT NULL,
    `assistance` BOOLEAN NOT NULL DEFAULT FALSE,
    `grade`      DECIMAL(4,2),
    `notes`      VARCHAR(300),
    CONSTRAINT `fk_studentlesson_client`
        FOREIGN KEY (`fr_client`) REFERENCES `Client`(`id_client`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_studentlesson_lesson`
        FOREIGN KEY (`fr_lesson`) REFERENCES `Lesson`(`id_lesson`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uq_student_lesson` (`fr_client`, `fr_lesson`)
);



INSERT INTO `Role` (`id_role`, `name_role`) VALUES
    (1, 'admin'),
    (2, 'entrenador'),
    (3, 'profesor'),
    (4, 'socio');

SET FOREIGN_KEY_CHECKS = 1;
