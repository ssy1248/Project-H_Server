document.addEventListener('DOMContentLoaded', async () => {
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const itemsTableBody = document.getElementById('items-table-body');
    const characterInfo = document.getElementById('character-info');

    const urlParams = new URLSearchParams(window.location.search);
    const charId = urlParams.get('id');
    const nickname = urlParams.get('nickname');

    // 페이지 상단에 캐릭터 정보 표시
    characterInfo.textContent = `Character ID: ${charId}, Nickname: ${nickname}`;

    let inventory = [];
    let items = [];

    // 인벤토리 테이블 표시
    const renderInventoryTableRow = (item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${nickname}</td>
            <td>${item.name}</td>
            <td>${item.rarity}</td>
            <td>${item.equiped ? 'O' : 'X'}</td>
            <td>
                <button class="remove-button" data-id="${item.id}">제거</button>
            </td>
        `;
        return row;
    };

    // 아이템 테이블 표시
    const renderItemTableRow = (item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.itemType}</td>
            <td>${item.stat}</td>
            <td>${item.price}</td>
            <td>
                <button class="add-button" data-id="${item.id}">추가</button>
            </td>
        `;
        return row;
    };

    // 서버에서 인벤토리 DB를 받아옴
    const fetchInventory = async () => {
        const response = await fetch(`/api/inventory/${charId}`);
        try {
            inventory = await response.json();
        } catch (error) {
            console.error('Cannot parse response');
            return;
        }
        inventoryTableBody.innerHTML = '';
        if(inventory.length === 0){
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5">인벤토리가 비어 있습니다.</td>
            `;
            inventoryTableBody.appendChild(emptyRow);
            return;
        }
        inventory.forEach(item => {
            const row = renderInventoryTableRow(item);
            inventoryTableBody.appendChild(row);
        });
    };

    // 서버에서 아이템 DB를 받아옴
    const fetchItems = async () => {
        const response = await fetch('/api/items');
        items = await response.json();
        itemsTableBody.innerHTML = '';
        items.forEach(item => {
            const row = renderItemTableRow(item);
            itemsTableBody.appendChild(row);
        });
    };

    // 인벤토리 테이블 버튼에 클릭 콜백 추가
    inventoryTableBody.addEventListener('click', async (event) => {
        // 인벤토리 아이템 제거 버튼
        if (event.target.classList.contains('remove-button')) {
            const itemId = event.target.getAttribute('data-id');
            const response = await fetch(`/api/inventory/${charId}/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchInventory();
            } else {
                console.error('Failed to remove item');
            }
        }
    });

    // 아이템 테이블 버튼에 클릭 콜백 추가
    itemsTableBody.addEventListener('click', async (event) => {
        // 아이템 추가 버튼
        if (event.target.classList.contains('add-button')) {
            const itemId = event.target.getAttribute('data-id');
            const response = await fetch(`/api/inventory/${charId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId: itemId, rarity: 0 })
            });

            if (response.ok) {
                await fetchInventory();
            } else {
                console.error('Failed to add item');
            }
        }
    });

    await fetchInventory();
    await fetchItems();
});