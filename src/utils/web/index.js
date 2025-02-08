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
            `;
            tableBody.appendChild(row);
            form.reset();
        } else {
            console.error('Failed to add item');
        }
    });
});