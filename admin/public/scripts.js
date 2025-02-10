document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');

  // 사이드바 메뉴 클릭 시 동적으로 콘텐츠를 교체
  const menuItems = document.querySelectorAll('.sidebar nav ul li a');

  menuItems.forEach((item) => {
    item.addEventListener('click', async (event) => {
      event.preventDefault(); // 페이지 리로드 방지
      const contentType = event.target.getAttribute('data-content');

      try {
        // 로그인 페이지는 따로 처리
        if (contentType === 'login') {
          mainContent.innerHTML = getLoginForm();
          return;
        }

        // 서버로 요청 보내기 (클릭한 메뉴만 전송)
        const response = await sendSidebarClickRequest(contentType);

        // 컬럼 정보 받아서 표를 생성
        if (response.columns) {
          mainContent.innerHTML = createTable(response.columns, contentType, response.dataRows);

          // "No data available" 메시지 숨기기
          const noDataMessage = mainContent.querySelector('.no-data-message');
          if (noDataMessage) {
            noDataMessage.style.display = 'block';
          }

          
        } else {
          mainContent.innerHTML = `<p>No data available for ${contentType}.</p>`;
        }
      } catch (error) {
        mainContent.innerHTML = `<p>Error: ${error}</p>`;
      }
    });
  });

  // 서버로 사이드바 클릭 정보를 보내는 함수
  async function sendSidebarClickRequest(menu) {
    try {
      const response = await fetch('/api/sidebar-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu }), // 클릭한 메뉴 정보를 서버로 전송
      });

      if (!response.ok) throw new Error('Failed to get response from server');
      return await response.json(); // 서버 응답 받기
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  // 테이블을 생성하는 함수
function createTable(columns, type, dataRows = []) {
  const colspanValue = columns.length + 1; // 'Actions' 컬럼을 포함한 colspan 값 계산

  let tableRows = ''; // 데이터 로우를 저장할 변수
  if (dataRows.length > 0) {
    tableRows = dataRows.map((row) => {
      return `
        <tr>
          ${columns.map((col) => `<td>${row[col] || '-'}</td>`).join('')}
          <td>
            <button onclick="editItem(${row.id}, '${type}')">Edit</button>
            <button onclick="deleteItem(${row.id}, '${type}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tableRows = `
      <tr class="no-data-message">
        <td colspan="${colspanValue}">No data available</td>
      </tr>
    `;
  }

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
        ${tableRows}
      </tbody>
    </table>
  `;
}
  

  // 로그인 폼을 반환하는 함수
  function getLoginForm() {
    return `
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
  }

  // 첫 글자를 대문자로 변환하는 함수
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // 데이터 추가 함수 (임시 버튼용)
  window.addItem = (type) => {
    const tableBody = document.getElementById(`${type}-table-body`);
    if (!tableBody) return;
  
    const columns = Array.from(tableBody.parentElement.querySelector('thead tr').children).slice(
      0,
      -1,
    ); // 마지막 'Actions' 제외
  
    const newRow = document.createElement('tr');
    const rowData = {}; // 새로운 항목의 데이터를 저장할 객체
    
    columns.forEach((col) => {
      const columnName = col.textContent.trim();
      const value = prompt(`Enter value for ${columnName}:`);
      newRow.innerHTML += `<td>${value || '-'}</td>`;
      rowData[columnName] = value || '-'; // 서버로 보낼 데이터
    });
  
    newRow.innerHTML += `
      <td>
        <button onclick="editItem(this)">Edit</button>
        <button onclick="deleteItem(this)">Delete</button>
      </td>
    `;
  
    tableBody.appendChild(newRow);
  
    // 새로운 항목이 추가되었을 때 'No data available' 메시지 숨기기
    const noDataMessage = tableBody.querySelector('.no-data-message');
    if (noDataMessage && tableBody.children.length > 1) {
      noDataMessage.style.display = 'none';
    }

    // 서버로 데이터 전송
    sendDataToServer(type, rowData);
  };

  // 데이터를 서버로 전송하는 함수
async function sendDataToServer(type, data) {
  try {
    const response = await fetch(`/api/${type}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // 데이터를 JSON 형태로 전송
    });

    if (!response.ok) {
      throw new Error('Failed to send data to server');
    }

    const result = await response.json();
    console.log('Data successfully added:', result);
  } catch (error) {
    console.error('Error sending data:', error);
  }
}
  
  

  // 아이템 수정 (임시 기능)
  window.editItem = (id, type) => {
    const newValue = prompt(`Edit item ID ${id} in ${type}:`, 'New Value');
    if (newValue) alert(`Updated item ${id} in ${type} to ${newValue}`);
  };

  // 아이템 삭제 (임시 기능)
  window.deleteItem = (id, type) => {
    if (confirm(`Are you sure you want to delete item ${id} from ${type}?`)) {
      alert(`Deleted item ${id} from ${type}`);
    }
  };
});
