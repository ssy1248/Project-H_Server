document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const sidebar = document.querySelector('.sidebar'); // 사이드바 요소

  // 페이지 처음 로드 시 로그인 폼 표시 및 사이드바 클릭 비활성화
  mainContent.innerHTML = getLoginForm();
  sidebar.style.pointerEvents = 'none'; // 사이드바 클릭 비활성화
  sidebar.style.opacity = '0.5'; // 사이드바 반투명하게 표시 (선택적)

  // 로그인
  document.querySelector('.login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // 기본 폼 제출을 막음

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        // 로그인 성공 후 처리
        alert(result.message);
        // 로그인 성공 후 사이드 바 활성화.
        sidebar.style.pointerEvents = 'auto'; // 사이드바 클릭 가능하게 활성화
        sidebar.style.opacity = '1'; // opacity 원상복귀
        mainContent.innerHTML = ''; // 로그인 폼은 제거
      } else {
        alert(`Login failed: ${result.error}`);

        // 실패 시 유저네임과 비밀번호 필드를 비움
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred during login.');
    }
  });

  // 사이드바 메뉴 클릭 시 콘텐츠 변경
  document.querySelectorAll('.sidebar nav ul li a').forEach((item) => {
    item.addEventListener('click', async (event) => {
      event.preventDefault();
      const contentType = event.target.getAttribute('data-content');

      try {
        const response = await sendSidebarClickRequest(contentType);
        if (response.columns) {
          mainContent.innerHTML = createTable(response.columns, contentType, response.dataRows);
        } else {
          mainContent.innerHTML = `<p>No data available for ${contentType}.</p>`;
        }
      } catch (error) {
        mainContent.innerHTML = `<p>Error: ${error}</p>`;
      }
    });
  });

  // 사이드바 클릭 데이터 전송
  async function sendSidebarClickRequest(menu) {
    try {
      const response = await fetch('/api/sidebar-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu }),
      });
      if (!response.ok) throw new Error('Failed to get response from server');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  // 테이블 생성
  function createTable(columns, type, dataRows = []) {
    let tableRows = dataRows.length
      ? dataRows
          .map(
            (row) => `
          <tr data-id="${row.id}">
            ${columns.map((col) => `<td data-column="${col}">${row[col] || '-'}</td>`).join('')}
            <td>
              <button onclick="editItem(${row.id}, '${type}')">Edit</button>
              <button onclick="deleteItem(${row.id}, '${type}')">Delete</button>
            </td>
          </tr>`,
          )
          .join('')
      : `<tr class="no-data-message"><td colspan="${
          columns.length + 1
        }">No data available</td></tr>`;

    return `
      <h2>${capitalizeFirstLetter(type)} </h2>
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

  window.addItem = async (type) => {
    const tableBody = document.getElementById(`${type}-table-body`);
    if (!tableBody) return;

    const columns = Array.from(tableBody.parentElement.querySelector('thead tr').children)
      .slice(0, -1) // 마지막 컬럼 (버튼) 제외
      .map((col) => col.textContent.trim().toLowerCase()); // 소문자로 변환

    const rowData = {};
    let newRow = '<tr>';
    let idValue = 'x'; // id 값은 텍스트로만 표시

    // id 컬럼은 텍스트로 표시만 하고, 입력 필드는 추가하지 않음
    newRow += `<td data-column="id">${idValue}</td>`; // id는 텍스트로 표시만
    rowData['id'] = idValue; // id 값 저장

    // 나머지 컬럼에 대해서만 입력 필드를 추가
    columns.forEach((col, index) => {
      if (col !== 'id') {
        // 'id' 컬럼에 대해서는 입력 필드를 추가하지 않음
        const value = ''; // 빈 값으로 시작
        newRow += `<td data-column="${col}"><input type="text" value="${value}" data-column="${col}"></td>`;
        rowData[col] = value || '-';
      }
    });

    newRow += `
      <td>
        <button onclick="saveNewItem(this, '${type}')">Save</button>
        <button onclick="cancelAddItem(this)">Cancel</button>
      </td>
    </tr>`;

    tableBody.innerHTML += newRow;

    // Save 버튼 클릭 시 새 아이템을 저장
    window.saveNewItem = async (button, type) => {
      const row = button.closest('tr');
      const inputs = row.querySelectorAll('input');
      const updatedData = { id: Date.now() }; // 고유 id는 서버에서 생성해야 할 경우 다르게 처리

      inputs.forEach((input) => {
        updatedData[input.getAttribute('data-column')] = input.value;
      });

      try {
        const response = await fetch(`/api/${type}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        const result = await response.json();

        if (result.success) {
          // 새 아이템 추가 성공 후, 입력 필드를 일반 텍스트로 변경
          inputs.forEach((input) => {
            input.parentElement.textContent = input.value;
          });

          // 'id' 값을 업데이트
          row.querySelector('td[data-column="id"]').textContent = result.id;

          // Save 버튼을 Edit로 변경
          row.querySelector('td:last-child').innerHTML = `
            <button onclick="editItem(${updatedData.id}, '${type}')">Edit</button>
            <button onclick="deleteItem(${updatedData.id}, '${type}')">Delete</button>
          `;
        } else {
          alert('Failed to add item.');
        }
      } catch (error) {
        console.error('Error adding item:', error);
      }
    };

    // Cancel 버튼 클릭 시, 추가 중인 아이템을 취소
    window.cancelAddItem = (button) => {
      const row = button.closest('tr');
      row.remove(); // 새로 추가된 row를 제거
    };
  };

  // 아이템 수정
  window.editItem = (id, type) => {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return alert('Error: Row not found');

    const columns = Array.from(row.children).slice(0, -1); // 마지막 버튼 제외
    const originalData = {};
    const inputs = [];

    // 데이터 수정 부분
    columns.forEach((col) => {
      const columnName = col.getAttribute('data-column').toLowerCase(); // 소문자 변환
      const currentValue = col.textContent.trim();
      originalData[columnName] = currentValue;

      if (columnName !== 'id') {
        // 'id' 컬럼은 텍스트로만 표시
        col.innerHTML = `<input type="text" value="${currentValue}" data-column="${columnName}">`;
        inputs.push(col.querySelector('input'));
      } else {
        col.innerHTML = `<span>${currentValue}</span>`; // id는 수정 불가능하도록 텍스트로만 표시
      }
    });

    const actionCell = row.querySelector('td:last-child');
    const originalButtons = actionCell.innerHTML;

    // Save/Cancel 버튼 설정 (삭제 버튼 숨기기)
    actionCell.innerHTML = `
    <button onclick="saveEdit(${id}, '${type}', this)">Save</button>
    <button onclick="cancelEdit(${id}, '${type}', this)">Cancel</button>
  `;

    // 취소 버튼 함수
    window.cancelEdit = (id, type, button) => {
      columns.forEach((col) => {
        col.textContent = originalData[col.getAttribute('data-column')];
      });
      actionCell.innerHTML = originalButtons; // 원래 버튼으로 복원
    };

    // 수정된 행(row)만 업데이트
    window.saveEdit = async (id, type, button) => {
      const updatedData = { id };
      inputs.forEach((input) => {
        updatedData[input.getAttribute('data-column')] = input.value;
      });

      try {
        const response = await fetch(`/api/${type}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        const result = await response.json();

        if (result.success) {
          // 수정된 데이터로 테이블에서 해당 행만 갱신
          const row = document.querySelector(`tr[data-id="${id}"]`);
          const columns = Array.from(row.children).slice(0, -1); // 마지막 버튼 제외

          columns.forEach((col) => {
            const columnName = col.getAttribute('data-column').toLowerCase();
            if (columnName !== 'id') {
              col.textContent = updatedData[columnName];
            }
          });

          // 수정 후, Edit 버튼과 Delete 버튼 복원
          actionCell.innerHTML = `
          <button onclick="editItem(${id}, '${type}')">Edit</button>
          <button onclick="deleteItem(${id}, '${type}')">Delete</button> <!-- 수정된 Edit 버튼과 함께 Delete 버튼 복원 -->
        `;
        } else {
          alert(`Failed to update item: ${result.error}`);
        }
      } catch (error) {
        alert(`Error updating item: ${error.message}`);
      }
    };
  };

  // 아이템 삭제
  window.deleteItem = async (id, type) => {
    if (!confirm(`Are you sure you want to delete item ${id} from ${type}?`)) return;

    try {
      const response = await fetch(`/api/${type}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();

      if (result.success) {
        document.querySelector(`tr[data-id="${id}"]`).remove();
      } else {
        alert(`Failed to delete item: ${result.error}`);
      }
    } catch (error) {
      alert(`Error deleting item: ${error.message}`);
    }
  };

  // 로그인 폼
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

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});
