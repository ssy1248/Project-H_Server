import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import {
  getCharacterStatsTableStructure,
  createCharacterStats,
  findAllCharacterStats,
  updateCharacterStats,
  deleteCharacterStats,
  getSkillStatsTableStructure,
  createSkill,
  deleteSkill,
  updateSkill,
  findAllSkills,
} from '../src/db/user/user.db.js';

import {
  getItemsTableStructure,
  createItem2,
  deleteItem,
  updateItem,
  getAllItems,
} from '../src/db/inventory/item.db.js';

const app = express();
const PORT = 3000;

const USER_NAME = 'admin';
const PASS_WORD = 'admin123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정
app.use(cors());

// JSON 파싱 설정
app.use(bodyParser.json());

// 정적 파일 제공 (어드민 페이지 HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 로그인 요청 처리
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  // 유효성 검사
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, error: 'UserName, PassWord을 제대로 입력하세요.' });
  }

  try {
    if (username === USER_NAME && password === PASS_WORD) {
      return res.json({ success: true, message: '로그인 성공!' });
    }

    // 인증 실패
    return res.status(401).json({ success: false, error: 'UserName, PassWord 가 틀렸습니다.' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: '로그인 실패.' });
  }
});

// 사이드바 클릭 요청 처리 (예시)
app.post('/api/sidebar-click', async (req, res) => {
  const { menu } = req.body;
  console.log(`Menu clicked: ${menu}`);

  // type에 따라 다르게 처리할 수 있음
  let tableColumns;
  let dataRows;
  switch (menu) {
    case 'admin-list':
      tableColumns = ['id', 'name', 'role'];
      break;
    case 'character-list':
      tableColumns = await getCharacterStatsTableStructure();
      dataRows = await findAllCharacterStats();
      break;
    case 'item-list':
      tableColumns = await getItemsTableStructure();
      dataRows = await getAllItems();
      break;
    case 'skill-list':
      tableColumns = await getSkillStatsTableStructure();
      dataRows = await findAllSkills();
      break;
    default:
      break;
  }

  // 응답 보내기
  res.json({ columns: tableColumns, dataRows: dataRows });
});

// 데이터 추가 메세지
app.post('/api/:type/add', async (req, res) => {
  const { type } = req.params; // URL 파라미터에서 type을 추출
  const data = req.body; // 클라이언트에서 보낸 데이터

  // type에 따라 다르게 처리할 수 있음
  let result;
  switch (type) {
    case 'admin-list':
      break;
    case 'character-list':
      result = await createCharacterStats(data.hp, data.mp, data.atk, data.def, data.speed);
      break;
    case 'item-list':
      result = await createItem2(data.name, data.itemtype, data.stat, data.price);
      break;
    case 'skill-list':
      result = await createSkill(
        data.name,
        data.job,
        data.cooldown,
        data.cost,
        data.castingtime,
        data.effect,
      );
      break;
    default:
      break;
  }

  res.json({ success: result.success, id: result.id });
});

// 업데이트
app.post('/api/:type/update', async (req, res) => {
  const { type } = req.params; // URL 파라미터에서 type을 추출
  const data = req.body; // 클라이언트에서 보낸 데이터
  console.log(data);

  // type에 따라 다르게 처리할 수 있음
  try {
    switch (type) {
      case 'admin-list':
        break;
      case 'character-list':
        await updateCharacterStats(data.id, data.hp, data.mp, data.atk, data.def, data.speed);
        break;
      case 'item-list':
        await updateItem(data.id, data.name, data.itemtype, data.stat, data.price);
        break;
      case 'skill-list':
        await updateSkill(
          data.id,
          data.name,
          data.job,
          data.cooldown,
          data.cost,
          data.castingtime,
          data.effect,
        );
        break;
      default:
        break;
    }

    // 처리 성공 시 응답 보내기
    res.json({ success: true, message: '성공' });
  } catch (error) {
    // 처리 실패 시 응답 보내기
    console.error(error);
    res.status(500).json({ success: false, error: '실패' });
  }
});

// 삭제
app.post('/api/:type/delete', async (req, res) => {
  const { type } = req.params; // URL 파라미터에서 type을 추출
  const data = req.body; // 클라이언트에서 보낸 데이터
  console.log(data);

  // type에 따라 다르게 처리할 수 있음
  let result;
  try {
    switch (type) {
      case 'admin-list':
        break;
      case 'character-list':
        result = await deleteCharacterStats(data.id);
        break;
      case 'item-list':
        result = await deleteItem(data.id);
        break;
      case 'skill-list':
        result = await deleteSkill(data.id);
        break;
      default:
        break;
    }

    // 처리 성공 시 응답 보내기
    res.json({ success: result });
  } catch (error) {
    // 처리 실패 시 응답 보내기
    console.error(error);
    res.status(500).json({ success: false, error: '실패' });
  }
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});
