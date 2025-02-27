import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs/promises'; // 파일 시스템 모듈

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NavMesh 데이터를 로드하는 함수
export default async function loadNavMeshData(filePath) {
  try {
    const absolutePath = path.join(__dirname, "..", filePath); // 현재 파일 기준 절대 경로 변환

    // 파일 읽기를 비동기적으로 처리
    const data = await fs.readFile(absolutePath, "utf8");

    // JSON 데이터를 객체로 변환
    const navMeshData = JSON.parse(data);

    if (navMeshData?.vertices && navMeshData?.indices) {
      // 네비메시 데이터를 잘 읽어왔다면, 처리
      return { vertices: navMeshData.vertices, indices: navMeshData.indices };
    } else {
      throw new Error('NavMesh 데이터 포멧이 아님.');
    }
  } catch (err) {
    console.error('Error loading NavMesh data:', err);
    throw err; // 오류를 다시 던져서 호출한 곳에서 처리
  }
}

// 비동기적으로 파일을 읽는 함수
function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        // reject에 Error 객체를 사용
        reject(new Error('navMesh 파일을 읽기 실패: ' + err));
      } else {
        resolve(data);
      }
    });
  });
}

// NavMesh 데이터를 처리하는 함수
function processNavMeshData(navMeshData) {
  const vertices = navMeshData.vertices;
  const indices = navMeshData.indices;

  if (vertices && indices) {
    const grid = [];

    // 그리드 생성
    for (const vertex of vertices) {
      const {x, y, z} = vertex;
      const gridX = Math.floor(x);
      const gridZ = Math.floor(z);

      if (!grid[gridX]) {
        grid[gridX] = [];
      }
      grid[gridX][gridZ] = y;
    }

    //console.log('NavMesh Grid:', grid);
    return { vertices: grid, indices: indices };
  } else {
    console.error('NavMesh 데이터 포멧이 아님.');
    return null;
  }
}
