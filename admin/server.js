import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { getTableStructure, createCharacterStats, findAllCharacterStats } from '../src/db/user/user.db.js';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정
app.use(cors());

// JSON 파싱 설정
app.use(bodyParser.json());

// 정적 파일 제공 (어드민 페이지 HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));



// 기본 경로에 접속하면 로그인 페이지로 리디렉션
app.get('/', (req, res) => {
  console.log('Redirecting to /login');
  res.redirect('/login'); // 로그인 페이지로 리디렉션
});

// 로그인 페이지 보여주기
app.get('/login', (req, res) => {
  // 경로 확인: admin/public/login.html
  const loginPath = path.join(__dirname, 'public', 'login.html'); // 경로 수정
  res.sendFile(loginPath); // loginPath 사용
});

// 메인 페이지 보여주기 (로그인 성공 후 이동)
// app.get('/index', (req, res) => {
//   const indexPath = path.join(__dirname, 'public', 'index.html'); // 경로 수정
//   res.sendFile(indexPath);
// });

// 로그인 요청 처리
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  // 여기서 실제 인증 로직을 추가하세요.
  if (username === 'admin' && password === 'admin123') {
    // 로그인 성공 시 메인 페이지로 리디렉션
    res.redirect('/index');
  } else {
    res.status(401).send({ message: 'Invalid credentials' });
  }
});

// 사이드바 클릭 요청 처리 (예시)
app.post('/api/sidebar-click', async (req, res) => {
  const { menu } = req.body;
  console.log(`Menu clicked: ${menu}`);

  // 서버에서 응답할 메시지 (메뉴에 따라 다르게 응답 가능)
  const responseMessage = `You clicked on ${menu} menu!`;

  let tableColumns;
  let dataRows; 
  switch (menu) {
    case "admin-list":
      tableColumns = ["id", "name", "role"];
      break;
    case "character-list":
      tableColumns = await getTableStructure();
      dataRows = await findAllCharacterStats();
      break;
    case "item-list":
      tableColumns = ["item_id", "name", "type", "rarity"];
      break;
    case "skill-list":
      tableColumns = ["skill_id", "name", "damage", "cooldown"];
      break;
    default:
      break;
  }


  console.log(dataRows);
  // 응답 보내기
  res.json({ columns: tableColumns, dataRows: dataRows });
});

// 데이터 추가 메세지 
app.post('/api/:type/add', async(req, res) => {
  const { type } = req.params;  // URL 파라미터에서 type을 추출
  const data = req.body;  // 클라이언트에서 보낸 데이터

  // type에 따라 다르게 처리할 수 있음
  let tableData; 
  switch (type) {
    case "admin-list":
      tableData = data;
      break;
    case "character-list":
      tableData = data;
      await createCharacterStats(data.Id, data.Hp,data.Mp,data.Atk,data.Def,data.Speed);
      break;
    case "item-list":
      tableData = data;
      break;
    case "skill-list":
      tableData = data;
      break;
    default:
      break;
  }

  console.log(tableData);
});


// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});
