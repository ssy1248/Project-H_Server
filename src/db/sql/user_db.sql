-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS User (
    id        INT  PRIMARY KEY AUTO_INCREMENT,
    email     VARCHAR(255) UNIQUE, 
    nickname  VARCHAR(255) UNIQUE,
    password  VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CharacterStats (
    id    INT   PRIMARY KEY AUTO_INCREMENT,
    hp    FLOAT NOT NULL,
    mp    FLOAT NOT NULL,
    atk   FLOAT NOT NULL,
    def   FLOAT NOT NULL,
    speed FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS Characters(
    id         INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    userId     INT NOT NULL UNIQUE,
    charStatId INT NOT NULL,
    gold       INT DEFAULT 0,
    level      INT DEFAULT 1,
    exp        INT DEFAULT 0,
    CONSTRAINT FK_User_TO_Character_1 FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE,
    CONSTRAINT FK_CharacterStats_TO_Character_1 FOREIGN KEY (charStatId) REFERENCES CharacterStats (id)
);

CREATE TABLE IF NOT EXISTS Market (
    id        INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    charId    INT NOT NULL UNIQUE,
    itemIndex INT NOT NULL,
    upgrade   INT NOT NULL,
    price     INT NOT NULL,
    endTime   DATE NOT NULL,
    CONSTRAINT FK_Character_TO_Market_1 FOREIGN KEY (charId) REFERENCES Characters(id)
);

CREATE TABLE IF NOT EXISTS Items (
    id       INT  PRIMARY KEY AUTO_INCREMENT,
    name     VARCHAR(255) UNIQUE,
    itemType INT NOT NULL ,
    stat     FLOAT NOT NULL,
    price    INT NOT NULL
);

CREATE TABLE IF NOT EXISTS Inventory(
    id         INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    charId     INT NOT NULL UNIQUE,
    itemId     INT NOT NULL,
    rarity     INT DEFAULT 0,
    equiped    BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (charId) REFERENCES Characters (id) ON DELETE CASCADE,
    FOREIGN KEY (itemId) REFERENCES Items(id)
);

CREATE TABLE IF NOT EXISTS Monster (
    id    INT     PRIMARY KEY  AUTO_INCREMENT,
    name  VARCHAR(255) NOT NULL UNIQUE,
    hp    FLOAT   NOT NULL,
    atk   FLOAT   NOT NULL,
    def   FLOAT   NOT NULL,
    speed FLOAT   NOT NULL
);

CREATE TABLE IF NOT EXISTS BossMonster (
    id    INT      PRIMARY KEY AUTO_INCREMENT,
    name  VARCHAR(255)  NOT NULL UNIQUE,
    hp    FLOAT    NOT NULL,
    atk   FLOAT    NOT NULL,
    def   FLOAT    NOT NULL,
    speed FLOAT    NOT NULL
);

CREATE TABLE IF NOT EXISTS dungeon (
    id        INT     PRIMARY KEY  AUTO_INCREMENT,
    maxStage  INT,
    name      VARCHAR(255) NOT NULL UNIQUE,
    clearGold INT     NOT NULL,
    clearExp  INT     NOT NULL,
    size      INT DEFAULT 50
);

CREATE TABLE IF NOT EXISTS Skill (
    id          INT    PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL UNIQUE,
    job         INT NOT NULL,
    cooldown    FLOAT DEFAULT 0,
    cost        FLOAT DEFAULT 0,
    castingTime FLOAT DEFAULT 0, 
    effect      INT NOT NULL
);

-- 2. 제약 조건 추가 (Foreign Keys)
-- ALTER TABLE Inventory
-- ADD CONSTRAINT FK_Character_TO_Inventory_1 FOREIGN KEY (charId) REFERENCES Characters(id);

-- ALTER TABLE Equiped
-- ADD CONSTRAINT FK_Character_TO_Equiped_1 FOREIGN KEY (charId) REFERENCES Characters(id);

-- ALTER TABLE Equiped
-- ADD CONSTRAINT FK_Inventory_TO_Equiped_1 FOREIGN KEY (invenId) REFERENCES Inventory (id);