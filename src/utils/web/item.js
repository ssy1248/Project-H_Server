document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('items-table-body');
    const formContainer = document.querySelector('.form-container');
    const editFormContainer = document.getElementById('edit-form-container');
    const editItemForm = document.getElementById('edit-item-form');
    const cancelEditButton = document.getElementById('cancel-edit');
    let items = [];

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

    const fetchItems = async () => {
        const response = await fetch('/api/items');
        items = await response.json();
        tableBody.innerHTML = '';
        items.forEach(item => {
            const row = renderTableRow(item);
            tableBody.appendChild(row);
        });
    };

    await fetchItems();

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
            await fetchItems();
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
                await fetchItems();
            } else {
                console.error('Failed to delete item');
            }
        }

        if (event.target.classList.contains('edit-button')) {
            const itemId = event.target.getAttribute('data-id');
            const item = items.find(item => item.id == itemId);

            document.getElementById('edit-item-id').value = item.id;
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-itemType').value = item.itemType;
            document.getElementById('edit-stat').value = item.stat;
            document.getElementById('edit-price').value = item.price;

            formContainer.style.display = 'none';
            editFormContainer.style.display = 'block';
        }
    });

    editItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();

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
    });

    cancelEditButton.addEventListener('click', () => {
        editFormContainer.style.display = 'none';
        formContainer.style.display = 'block';
    });
});