document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');

  let adminList = [
    { id: 1, name: 'John Doe', role: 'Super Admin' },
    { id: 2, name: 'Jane Smith', role: 'Admin' },
  ];

  // 사이드바 메뉴 클릭 시 동적으로 콘텐츠를 교체
  const menuItems = document.querySelectorAll('.sidebar nav ul li a');

  menuItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault(); // 페이지 리로드 방지
      const contentType = event.target.getAttribute('data-content');
      loadContent(contentType);

      // 사이드바 클릭 시 서버로 요청 보내기
      sendSidebarClickRequest(contentType)
        .then((response) => {
          // 서버로부터 응답 받은 후 메시지 출력
          mainContent.innerHTML = `<p>${response.message}</p>`;
        })
        .catch((error) => {
          mainContent.innerHTML = `<p>Error: ${error}</p>`;
        });
    });
  });

  // 서버로 사이드바 클릭 정보를 보내는 함수
  async function sendSidebarClickRequest(menu) {
    try {
      const response = await fetch('/api/sidebar-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menu }), // 메뉴 정보를 서버로 전송
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json(); // 서버 응답 받기
      return data; // 메시지를 반환
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  // 콘텐츠를 동적으로 로딩하는 함수
  function loadContent(contentType) {
    let contentHTML = '';

    switch (contentType) {
      case 'login':
        contentHTML = `
                <div class="login-container">
                    <h2>Login</h2>
                    <form action="/login" method="POST" class="login-form">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required />
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required />
                        <button type="submit">Login</button>
                    </form>
                </div>
            `;
        break;
      case 'admin-list':
        // 'admin-list'는 이제 loadData로 동적으로 콘텐츠를 로딩합니다.
        contentHTML = loadData('admin-list'); // 테이블 로딩을 여기서 처리
        break;
      case 'dashboard':
        contentHTML = `
            <h2>Dashboard</h2>
            <p>Dashboard content will be shown here.</p>
          `;
        break;
      case 'character-list':
        // 'admin-list'는 이제 loadData로 동적으로 콘텐츠를 로딩합니다.
        contentHTML = loadData('character-list'); // 테이블 로딩을 여기서 처리
        break;
      case 'item-list':
        // 'admin-list'는 이제 loadData로 동적으로 콘텐츠를 로딩합니다.
        contentHTML = loadData('item-list'); // 테이블 로딩을 여기서 처리
        break;
      case 'skill-list':
        // 'admin-list'는 이제 loadData로 동적으로 콘텐츠를 로딩합니다.
        contentHTML = loadData('skill-list'); // 테이블 로딩을 여기서 처리
        break;
      case 'logs':
        contentHTML = `
            <h2>Logs</h2>
            <p>Logs content goes here.</p>
          `;
        break;
      default:
        contentHTML = `<p>Content not found!</p>`;
    }

    // 메인 콘텐츠 영역에 동적으로 HTML 삽입
    mainContent.innerHTML = contentHTML;
  }

  // 데이터를 로딩하는 함수
  // 데이터를 로딩하는 함수 (데이터 없이 표만 생성)
  function loadData(type) {
    try {
      // 테이블 구조(컬럼명) 가져오기
      const columns = getTableStructure(); // 컬럼명을 가져오는 함수 호출

      // 테이블 HTML 생성 (데이터 없이)
      return `
        <h2>${capitalizeFirstLetter(type)} List</h2>
        <button onclick="addItem('${type}')">Add ${capitalizeFirstLetter(type)}</button>
        <table>
          <thead>
            <tr>
              ${columns.map((col) => `<th>${capitalizeFirstLetter(col)}</th>`).join('')}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="${type}-table-body">
            <tr>
              <td colspan="${
                columns.length + 1
              }">No data available</td> <!-- 데이터가 없을 때 메시지 -->
            </tr>
          </tbody>
        </table>
      `;
    } catch (error) {
      return `<p>Error loading ${type} list: ${error.message}</p>`;
    }
  }

  // Admin 추가 함수
  window.addAdmin = () => {
    const newAdmin = { id: adminList.length + 1, name: 'New Admin', role: 'Admin' };
    adminList.push(newAdmin);
    loadContent('admin-list'); // 업데이트된 리스트로 콘텐츠 다시 로드
  };

  // Admin 수정 함수
  window.editAdmin = (id) => {
    const admin = adminList.find((admin) => admin.id === id);
    if (admin) {
      const newName = prompt('Edit Admin Name:', admin.name);
      const newRole = prompt('Edit Role:', admin.role);
      admin.name = newName;
      admin.role = newRole;
      loadContent('admin-list'); // 업데이트된 리스트로 콘텐츠 다시 로드
    }
  };

  // Admin 삭제 함수
  window.deleteAdmin = (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this admin?');
    if (confirmDelete) {
      adminList = adminList.filter((admin) => admin.id !== id);
      loadContent('admin-list'); // 업데이트된 리스트로 콘텐츠 다시 로드
    }
  };
});
