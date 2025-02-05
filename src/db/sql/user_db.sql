-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS Market (
    id        INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    charId    INT NOT NULL,
    itemIndex INT NOT NULL,
    upgrade   INT NOT NULL,
    price     INT NOT NULL,
    endTime   DATE NOT NULL,
    CONSTRAINT FK_Character_TO_Market_1 FOREIGN KEY (charId) REFERENCES Character(id)
);

CREATE TABLE IF NOT EXISTS Character(
    id         INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    userId     INT NOT NULL,
    charStatId INT NOT NULL,
    gold       INT,
    level      INT,
    exp        FLOAT NOT NULL,
    CONSTRAINT FK_User_TO_Character_1 FOREIGN KEY (userId) REFERENCES User (id),
    CONSTRAINT FK_CharacterStats_TO_Character_1 FOREIGN KEY (charStatId) REFERENCES CharacterStats (id)
);

CREATE TABLE IF NOT EXISTS User (
    id        INT  PRIMARY KEY AUTO_INCREMENT,
    email     VARCHAR(255),
    nickname  VARCHAR(255),
    password  VARCHAR(255),
    createdAt DATE  DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATE  DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE IF NOT EXISTS CharacterStats (
    id    INT   PRIMARY KEY AUTO_INCREMENT,
    hp    FLOAT NULL,
    mp    FLOAT NULL,
    atk   FLOAT NULL,
    def   FLOAT NULL,
    speed FLOAT NULL,
);

CREATE TABLE IF NOT EXISTS Monster (
    id    INT     PRIMARY KEY  AUTO_INCREMENT,
    name  VARCHAR NOT NULL,
    hp    FLOAT   NOT NULL,
    atk   FLOAT   NOT NULL,
    def   FLOAT   NOT NULL,
    speed FLOAT   NOT NULL,
);

CREATE TABLE IF NOT EXISTS BossMonster (
    id    INT      PRIMARY KEY AUTO_INCREMENT,
    name  VARCHAR  NOT NULL,
    hp    FLOAT    NOT NULL,
    atk   FLOAT    NOT NULL,
    def   FLOAT    NOT NULL,
    speed FLOAT    NOT NULL,
);

CREATE TABLE IF NOT EXISTS dungeon (
    id        INT     PRIMARY KEY  AUTO_INCREMENT,
    maxStage  INT,
    name      VARCHAR NOT NULL,
    clearGold INT     NOT NULL,
    clearExp  INT     NOT NULL,
    size      INT,
);

CREATE TABLE IF NOT EXISTS Skill (
    id          INT    PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR,
    job         INT,
    cooldown    FLOAT,
    cost        FLOAT,
    castingTime FLOAT,
    effect      INT,

);

CREATE TABLE IF NOT EXISTS Items (
    id       INT  PRIMARY KEY,
    name     VARCHAR(255),
    itemType INT,
    stat     FLOAT,
    price    INT,
);

-- 2. 제약 조건 추가 (Foreign Keys)
ALTER TABLE Inventory
ADD CONSTRAINT FK_Character_TO_Inventory_1 FOREIGN KEY (charId) REFERENCES Character(id);

ALTER TABLE Equiped
ADD CONSTRAINT FK_Character_TO_Equiped_1 FOREIGN KEY (charId) REFERENCES Character(id);

ALTER TABLE Equiped
ADD CONSTRAINT FK_Inventory_TO_Equiped_1 FOREIGN KEY (invenId) REFERENCES Inventory (id);