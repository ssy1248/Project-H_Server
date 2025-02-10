document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/items');
    const items = await response.json();
    const tableBody = document.getElementById('items-table-body');

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.itemType}</td>
            <td>${item.stat}</td>
            <td>${item.price}</td>
            <td>
                <button class="edit-button" data-id="${item.id}">수정</button>
                <button class="delete-button" data-id="${item.id}">제거</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    const form = document.getElementById('item-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            itemType: formData.get('itemType'),
            stat: formData.get('stat'),
            price: formData.get('price')
        };

        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const newItem = await response.json();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${newItem.id}</td>
                <td>${newItem.name}</td>
                <td>${newItem.itemType}</td>
                <td>${newItem.stat}</td>
                <td>${newItem.price}</td>
                <td>
                    <button class="edit-button" data-id="${newItem.id}">수정</button>
                    <button class="delete-button" data-id="${newItem.id}">제거</button>
                </td>
            `;
            tableBody.appendChild(row);
            form.reset();
        } else {
            console.error('Failed to add item');
        }
    });

    tableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-button')) {
            const itemId = event.target.getAttribute('data-id');
            const response = await fetch(`/api/items/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                event.target.closest('tr').remove();
            } else {
                console.error('Failed to delete item');
            }
        }

        if (event.target.classList.contains('edit-button')) {
            const itemId = event.target.getAttribute('data-id');
            // 아이템 수정 로직을 여기에 추가합니다.
            // 예를 들어, 수정 폼을 표시하고, 수정된 데이터를 서버로 전송하는 로직을 작성할 수 있습니다.
        }
    });
});