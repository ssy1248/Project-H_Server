document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('items-table-body');
    const createItemForm = document.getElementById('item-form');
    const createItemFormContainer = document.querySelector('.form-container');
    const editItemForm = document.getElementById('edit-item-form');
    const editFormContainer = document.getElementById('edit-form-container');
    let items = [];

    // 테이블 생성
    const renderTableRow = (item) => {
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
        return row;
    };

    // 서버에서 아이템 DB를 받아옴
    const fetchItems = async () => {
        const response = await fetch('/api/items');
        items = await response.json();
        tableBody.innerHTML = '';
        items.forEach(item => {
            const row = renderTableRow(item);
            tableBody.appendChild(row);
        });
    };


    // 아이템 생성 폼에 클릭 이벤트 콜백 추가
    createItemForm.addEventListener('click', async (event) => {
        const formData = new FormData(createItemForm);
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
            await fetchItems();
            createItemForm.reset();
        } else {
            console.error('Failed to add item');
        }
    });

    // 아이템 테이블 버튼에 클릭 콜백 추가
    tableBody.addEventListener('click', async (event) => {
        // 아이템 삭제 버튼
        if (event.target.classList.contains('delete-button')) {
            const itemId = event.target.getAttribute('data-id');
            const response = await fetch(`/api/items/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchItems();
            } else {
                console.error('Failed to delete item');
            }
        }
        // 아이템 수정 버튼
        if (event.target.classList.contains('edit-button')) {
            const itemId = event.target.getAttribute('data-id');
            const item = items.find(item => item.id == itemId);

            document.getElementById('edit-item-id').value = item.id;
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-itemType').value = item.itemType;
            document.getElementById('edit-stat').value = item.stat;
            document.getElementById('edit-price').value = item.price;

            createItemFormContainer.style.display = 'none';
            editFormContainer.style.display = 'block';
        }
    });

    // 아이템 수정 폼에 클릭 이벤트 콜백 추가
    editItemForm.addEventListener('click', async (event) => {
        // 확인 버튼
        if (event.target.classList.contains('submit-button')) {
            const formData = new FormData(editItemForm);
            const data = {
                name: formData.get('name'),
                itemType: formData.get('itemType'),
                stat: formData.get('stat'),
                price: formData.get('price')
            };
            const itemId = formData.get('itemId');

            const response = await fetch(`/api/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                await fetchItems();
                editFormContainer.style.display = 'none';
                formContainer.style.display = 'block';
            } else {
                console.error('Failed to update item');
            }
        }
        // 취소 버튼
        if (event.target.classList.contains('cancel-button')) {
            editFormContainer.style.display = 'none';
            createItemFormContainer.style.display = 'block';
        }
    });

    await fetchItems();
});