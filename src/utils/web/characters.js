document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('characters-table-body');

    let characters = [];

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

    const fetchCharacters = async () => {
        const response = await fetch('/api/characters');
        characters = await response.json();
        tableBody.innerHTML = '';
        characters.forEach(character => {
            const row = renderTableRow(character);
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.inventory-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = event.target.getAttribute('data-id');
                const nickname = event.target.getAttribute('data-nickname');
                window.location.href = `inventory.html?id=${id}&nickname=${nickname}`;
            });
        });
    };

    await fetchCharacters();
});