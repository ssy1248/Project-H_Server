import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import pools from '../../db/database.js';
import { SQL_QUERIES } from '../../db/inventory/item.queries.js';

const app = express();
const PORT = 3000;

// CORS 설정 추가
app.use(cors());

// Express 서버 설정
app.use(bodyParser.json());

// 정적 파일 제공 설정
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'src/utils/web')));

app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_ALL_ITEMS);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.post('/api/items', async (req, res) => {
    const { name, itemType, stat, price } = req.body;
    try {
        console.log('post');
        const [result] = await pools.USER_DB.query(SQL_QUERIES.CREATE_ITEM, [name, itemType, stat, price]);
        const [newItem] = await pools.USER_DB.query(SQL_QUERIES.FIND_ITEM_BY_ID, [result.insertId]);
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});