import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import pools from '../../db/database.js';
import { testAllConnections } from '../db/testConnection.js';
import { createItem, deleteItem, getAllItems, findItemById, updateItem } from '../../db/inventory/item.db.js';
import { addItemToInventory, getCharacterTable, getInventoryFromCharId, removeItemFromInventory } from '../../db/inventory/inventory.db.js';

const app = express();
const PORT = 3000;

// CORS 설정 추가
app.use(cors());

// Express 서버 설정
app.use(bodyParser.json());

// 정적 파일 제공 설정
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'src/utils/web')));

//#region Items API
// 아이템 조회
app.get('/api/items', async (req, res) => {
    try {
        const result = await getAllItems();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// 아이템 추가
app.post('/api/items', async (req, res) => {
    const { itemId, name, itemType, stat, price, stackable } = req.body;
    try {
        console.log('post');
        const result = await createItem(itemId, name, itemType, stat, price, stackable);
        const newItem = await findItemById(result);
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// 아이템 수정
app.put('/api/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { name, itemType, stat, price } = req.body;
    try {
        console.log('update');
        await updateItem(itemId, name, itemType, stat, price);
        res.status(200).send('Item updated');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// 아이템 삭제
app.delete('/api/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
        console.log(`delete:${itemId}`);
        await deleteItem(itemId);
        res.status(200).send('Item deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
//#endregion

//#region Characters API
// 캐릭터 조회
app.get('/api/characters', async (req, res) => {
    try {
        const result = await getCharacterTable();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// 캐릭터 인벤토리 조회
app.get('/api/inventory/:charId', async (req, res) => {
    const { charId } = req.params;
    try {
        const result = await getInventoryFromCharId(charId);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// 캐릭터 인벤토리에 아이템 추가
app.post('/api/inventory/:charId', async (req, res) => {
    const { charId } = req.params;
    const { itemId, rarity } = req.body;
    try{
        await addItemToInventory(charId, itemId, rarity, 0);
        res.status(201).send('Item added');
    }catch(error){
        console.error(error);
        res.status(500).send('Server Error');
    }
})

// 캐릭터 인벤토리에서 아이템 제거
app.delete('/api/inventory/:charId', async (req, res) => {
    const { charId } = req.params;
    const { id } = req.body;
    try {
        await removeItemFromInventory(charId, id);
        res.status(200).send('Item removed');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
//#endregion

// 서버 시작
app.listen(PORT, () => {
    testAllConnections(pools);
    console.log(`Server is running on port ${PORT}`);
});