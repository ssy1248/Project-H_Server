document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('characters-table-body');

    let characters = [];

    // 테이블 생성
    const renderTableRow = (character) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${character.id}</td>
            <td>${character.nickname}</td>
            <td>${character.charStatId}</td>
            <td>${character.level}</td>
            <td>
                <button class="inventory-button" data-id="${character.id}" data-nickname="${character.nickname}">인벤토리</button>
            </td>
        `;
        return row;
    };

    // 캐릭터 정보 받아옴
    const fetchCharacters = async () => {
        const response = await fetch('/api/characters');
        characters = await response.json();
        tableBody.innerHTML = '';
        characters.forEach(character => {
            const row = renderTableRow(character);
            tableBody.appendChild(row);
        });
    };

    // 인벤토리 버튼에 클릭 이벤트 콜백 추가
    tableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('inventory-button')) {
            const id = event.target.getAttribute('data-id');
            const nickname = event.target.getAttribute('data-nickname');
            window.location.href = `inventory.html?id=${id}&nickname=${nickname}`;
        }
    });

    await fetchCharacters();
});