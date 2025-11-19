-- Active: 1751372420486@@127.0.0.1@3306@chatbot
USE `chatbot`

INSERT INTO users (username, email, password, createdAt, updatedAt)
VALUES
('Ryan', "ytsung99@gmail.com", "20011107ryan", NOW(), NOW())

SHOW CREATE TABLE messages;