document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('inventory-table-body');

    let inventory = [];

    const renderTableRow = (item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nickname}</td>
            <td>${item.charStatId}</td>
            <td>${item.level}</td>
            <td>
                <button class="remove-button" data-id="${item.id}">제거</button>
            </td>
        `;
        return row;
    };

    const fetchInventory = async () => {
        const response = await fetch(`/api/inventory/:${charId}`);
        inventory = await response.json();
        tableBody.innerHTML = '';
        inventory.forEach(item => {
            const row = renderTableRow(item);
            tableBody.appendChild(row);
        });

        document.querySelectorAll('.remove-button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const itemId = event.target.getAttribute('data-id');
                const response = await fetch(`/api/inventory/${itemId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await fetchInventory();
                } else {
                    console.error('Failed to remove item');
                }
            });
        });
    };

    await fetchInventory();
});