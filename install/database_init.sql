CREATE DATABASE if not exists bensordaten;
USE bensordaten;
DROP TABLE IF EXISTS measurements;
CREATE TABLE if not exists `measurements` (
  `measurement_id` integer PRIMARY KEY auto_increment,
  `timestamp` timestamp,
  `temperature` float,
  `humidity` float,
  `altitude` float,
  `pressure` float
);

DROP TABLE IF EXISTS accounts;
CREATE TABLE IF NOT EXISTS accounts (
    id int NOT NULL AUTO_INCREMENT,
    email varchar(255) NOT NULL,
    firstname varchar(255) NOT NULL,
    lastname varchar(255) NOT NULL,
    username varchar(255) NOT NULL,
    hash varchar(255) NOT NULL,
    PRIMARY KEY (id)
);