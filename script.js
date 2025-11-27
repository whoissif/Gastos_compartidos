// Estado de la aplicación
let currentGroup = null;
let participants = [];
let expenses = [];
let editingExpenseIndex = -1;

// DOM Elements
const groupNameInput = document.getElementById('groupName');
const createGroupBtn = document.getElementById('createGroup');
const deleteGroupBtn = document.getElementById('deleteGroup');
const currentGroupEl = document.getElementById('currentGroup');
const participantNameInput = document.getElementById('participantName');
const addParticipantBtn = document.getElementById('addParticipant');
const participantsList = document.getElementById('participantsList');
const expenseDescriptionInput = document.getElementById('expenseDescription');
const expenseAmountInput = document.getElementById('expenseAmount');
const expensePayerSelect = document.getElementById('expensePayer');
const addExpenseBtn = document.getElementById('addExpense');
const expensesList = document.getElementById('expensesList');
const calculateBtn = document.getElementById('calculate');
const resultsEl = document.getElementById('results');

// Elementos del resumen
const totalAmountEl = document.getElementById('totalAmount');
const participantCountEl = document.getElementById('participantCount');
const membersSpendingEl = document.getElementById('membersSpending');

// Elementos del modal
const editExpenseModal = document.getElementById('editExpenseModal');
const editExpenseDescriptionInput = document.getElementById('editExpenseDescription');
const editExpenseAmountInput = document.getElementById('editExpenseAmount');
const editExpensePayerSelect = document.getElementById('editExpensePayer');
const saveExpenseEditBtn = document.getElementById('saveExpenseEdit');
const cancelExpenseEditBtn = document.getElementById('cancelExpenseEdit');
const closeBtn = document.querySelector('.close');

// Inicializar la aplicación
function init() {
    // Cargar datos guardados si existen
    loadSavedData();
    
    // Vincular eventos
    createGroupBtn.addEventListener('click', createOrEnterGroup);
    deleteGroupBtn.addEventListener('click', deleteCurrentGroup);
    addParticipantBtn.addEventListener('click', addParticipant);
    addExpenseBtn.addEventListener('click', addExpense);
    calculateBtn.addEventListener('click', calculateDebts);
    
    // Eventos del modal
    saveExpenseEditBtn.addEventListener('click', saveExpenseEdit);
    cancelExpenseEditBtn.addEventListener('click', closeEditModal);
    closeBtn.addEventListener('click', closeEditModal);
    
    // Eventos con tecla Enter
    groupNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createOrEnterGroup();
    });
    
    participantNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addParticipant();
    });
    
    expenseDescriptionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
    
    expenseAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === editExpenseModal) {
            closeEditModal();
        }
    });
    
    // Actualizar la interfaz
    updateCurrentGroup();
    updateSummary();
    renderParticipants();
    updatePayerSelect();
    renderExpenses();
}

// Cargar datos guardados del localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('expenseSplitterData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            currentGroup = data.currentGroup;
            participants = data.participants || [];
            expenses = data.expenses || [];
        } catch (e) {
            console.error('Error loading saved ', e);
            resetData();
        }
    }
}

// Guardar datos en localStorage
function saveData() {
    const data = {
        currentGroup,
        participants,
        expenses
    };
    localStorage.setItem('expenseSplitterData', JSON.stringify(data));
}

// Reiniciar datos
function resetData() {
    currentGroup = null;
    participants = [];
    expenses = [];
    saveData();
    updateCurrentGroup();
    updateSummary();
    renderParticipants();
    renderExpenses();
    resultsEl.innerHTML = '<div class="no-results">Crea un grupo y añade participantes para empezar</div>';
}

// Crear o entrar a un grupo
function createOrEnterGroup() {
    const groupName = groupNameInput.value.trim();
    
    if (!groupName) {
        alert('Por favor, ingresa un nombre para el grupo');
        return;
    }
    
    currentGroup = groupName;
    saveData();
    updateCurrentGroup();
    updateSummary();
    alert(`¡Bienvenido al grupo "${groupName}"!`);
}

// Eliminar el grupo actual
function deleteCurrentGroup() {
    if (!currentGroup) {
        alert('No hay ningún grupo seleccionado para eliminar');
        return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el grupo "${currentGroup}"?\n\nEsta acción eliminará todos los participantes y gastos de este grupo.`)) {
        return;
    }
    
    // Eliminar todos los datos del grupo actual
    currentGroup = null;
    participants = [];
    expenses = [];
    
    // Guardar los cambios
    saveData();
    
    // Actualizar la interfaz
    updateCurrentGroup();
    updateSummary();
    renderParticipants();
    renderExpenses();
    resultsEl.innerHTML = '<div class="no-results">Grupo eliminado. Crea un nuevo grupo para empezar.</div>';
    
    // Limpiar el input de nombre de grupo
    groupNameInput.value = '';
    
    // Mostrar mensaje de confirmación
    alert('Grupo eliminado correctamente');
}

// Actualizar el nombre del grupo actual
function updateCurrentGroup() {
    if (currentGroup) {
        currentGroupEl.textContent = `Grupo actual: ${currentGroup}`;
        currentGroupEl.classList.remove('empty');
    } else {
        currentGroupEl.classList.add('empty');
    }
}

// Actualizar el resumen de gastos
function updateSummary() {
    // Calcular gasto total
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalAmountEl.textContent = `€${totalAmount.toFixed(2)}`;
    
    // Mostrar número de participantes
    participantCountEl.textContent = participants.length;
    
    // Mostrar gasto por miembro
    renderMembersSpending();
}

// Renderizar el gasto por miembro
function renderMembersSpending() {
    membersSpendingEl.innerHTML = '';
    
    if (participants.length === 0) {
        membersSpendingEl.innerHTML = '<div class="no-results">No hay participantes</div>';
        return;
    }
    
    // Calcular gasto por participante
    const spending = {};
    participants.forEach(name => spending[name] = 0);
    
    expenses.forEach(expense => {
        spending[expense.payer] += expense.amount;
    });
    
    // Renderizar cada miembro
    let html = '';
    participants.forEach(name => {
        const amount = spending[name];
        html += `
            <div class="member-item">
                <span class="member-name">${name}</span>
                <span class="member-amount">€${amount.toFixed(2)}</span>
            </div>
        `;
    });
    
    membersSpendingEl.innerHTML = html;
}

// Añadir participante
function addParticipant() {
    if (!currentGroup) {
        alert('Primero debes crear o entrar a un grupo');
        return;
    }
    
    const name = participantNameInput.value.trim();
    
    if (!name) {
        alert('Por favor, ingresa un nombre válido');
        return;
    }
    
    if (participants.some(p => p.toLowerCase() === name.toLowerCase())) {
        alert('Este participante ya existe');
        return;
    }
    
    participants.push(name);
    participantNameInput.value = '';
    renderParticipants();
    updatePayerSelect();
    updateSummary();
    saveData();
}

// Añadir gasto
function addExpense() {
    if (!currentGroup) {
        alert('Primero debes crear o entrar a un grupo');
        return;
    }
    
    const description = expenseDescriptionInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const payer = expensePayerSelect.value;
    
    if (!description) {
        alert('Por favor, ingresa una descripción');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Por favor, ingresa una cantidad válida mayor que cero');
        return;
    }
    
    if (!payer) {
        alert('Por favor, selecciona quién pagó');
        return;
    }
    
    if (participants.length === 0) {
        alert('Añade participantes antes de registrar gastos');
        return;
    }
    
    expenses.push({
        description,
        amount,
        payer
    });
    
    expenseDescriptionInput.value = '';
    expenseAmountInput.value = '';
    renderExpenses();
    updateSummary();
    saveData();
}

// Renderizar participantes
function renderParticipants() {
    participantsList.innerHTML = '';
    
    if (participants.length === 0) {
        participantsList.innerHTML = '<div class="no-results">No hay participantes</div>';
        return;
    }
    
    participants.forEach((name, index) => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-item';
        participantDiv.innerHTML = `
            <span>${name}</span>
            <button class="delete-btn" data-index="${index}">Eliminar</button>
        `;
        participantsList.appendChild(participantDiv);
    });
    
    // Añadir eventos para eliminar participantes
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            
            // Verificar si este participante tiene gastos
            const hasExpenses = expenses.some(exp => exp.payer === participants[index]);
            if (hasExpenses) {
                if (!confirm('Este participante tiene gastos registrados. ¿Estás seguro de que quieres eliminarlo?')) {
                    return;
                }
            }
            
            participants.splice(index, 1);
            // Eliminar gastos asociados a este participante
            expenses = expenses.filter(exp => exp.payer !== participants[index]);
            renderParticipants();
            updatePayerSelect();
            renderExpenses();
            updateSummary();
            saveData();
        });
    });
}

// Actualizar el select de quién pagó
function updatePayerSelect() {
    expensePayerSelect.innerHTML = '<option value="">¿Quién pagó?</option>';
    
    if (participants.length === 0) {
        expensePayerSelect.disabled = true;
        return;
    }
    
    expensePayerSelect.disabled = false;
    
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        expensePayerSelect.appendChild(option);
    });
    
    // Actualizar también el select del modal
    updateEditPayerSelect();
}

// Actualizar el select de quién pagó en el modal
function updateEditPayerSelect() {
    editExpensePayerSelect.innerHTML = '<option value="">¿Quién pagó?</option>';
    
    if (participants.length === 0) {
        editExpensePayerSelect.disabled = true;
        return;
    }
    
    editExpensePayerSelect.disabled = false;
    
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        editExpensePayerSelect.appendChild(option);
    });
}

// Renderizar gastos
function renderExpenses() {
    expensesList.innerHTML = '';
    
    if (expenses.length === 0) {
        expensesList.innerHTML = '<div class="no-results">No hay gastos registrados</div>';
        return;
    }
    
    expenses.forEach((expense, index) => {
        const expenseDiv = document.createElement('div');
        expenseDiv.className = 'expense-item';
        expenseDiv.innerHTML = `
            <div>
                <strong>${expense.description}</strong><br>
                ${expense.payer} pagó €${expense.amount.toFixed(2)}
            </div>
            <button class="edit-btn" data-index="${index}">Editar</button>
        `;
        expensesList.appendChild(expenseDiv);
    });
    
    // Añadir eventos para editar gastos
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            openEditModal(index);
        });
    });
}

// Abrir modal de edición
function openEditModal(index) {
    const expense = expenses[index];
    editingExpenseIndex = index;
    
    editExpenseDescriptionInput.value = expense.description;
    editExpenseAmountInput.value = expense.amount;
    editExpensePayerSelect.value = expense.payer;
    
    editExpenseModal.style.display = 'block';
}

// Cerrar modal de edición
function closeEditModal() {
    editExpenseModal.style.display = 'none';
    editingExpenseIndex = -1;
}

// Guardar cambios en el gasto
function saveExpenseEdit() {
    if (editingExpenseIndex === -1) {
        closeEditModal();
        return;
    }
    
    const description = editExpenseDescriptionInput.value.trim();
    const amount = parseFloat(editExpenseAmountInput.value);
    const payer = editExpensePayerSelect.value;
    
    if (!description) {
        alert('Por favor, ingresa una descripción');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Por favor, ingresa una cantidad válida mayor que cero');
        return;
    }
    
    if (!payer) {
        alert('Por favor, selecciona quién pagó');
        return;
    }
    
    // Actualizar el gasto
    expenses[editingExpenseIndex] = {
        description,
        amount,
        payer
    };
    
    // Guardar y actualizar
    saveData();
    renderExpenses();
    updateSummary();
    closeEditModal();
    
    alert('Gasto actualizado correctamente');
}

// Calcular deudas
function calculateDebts() {
    if (!currentGroup) {
        resultsEl.innerHTML = '<div class="no-results">Primero debes crear o entrar a un grupo</div>';
        return;
    }
    
    if (participants.length === 0) {
        resultsEl.innerHTML = '<div class="no-results">No hay participantes en el grupo</div>';
        return;
    }
    
    if (expenses.length === 0) {
        resultsEl.innerHTML = '<div class="no-results">No hay gastos registrados</div>';
        return;
    }
    
    // Calcular total gastado por cada participante
    const paid = {};
    participants.forEach(name => paid[name] = 0);
    
    expenses.forEach(expense => {
        paid[expense.payer] += expense.amount;
    });
    
    // Calcular total a repartir y cuota individual
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const share = total / participants.length;
    
    // Calcular balance de cada participante (lo que pagó - lo que le corresponde)
    const balance = {};
    participants.forEach(name => {
        balance[name] = paid[name] - share;
    });
    
    // Algoritmo para determinar quién debe a quién
    const creditors = participants.filter(p => balance[p] > 0.01).map(p => ({name: p, amount: balance[p]}));
    const debtors = participants.filter(p => balance[p] < -0.01).map(p => ({name: p, amount: -balance[p]}));
    
    // Ordenar de mayor a menor para optimizar
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    const transactions = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
        const amount = Math.min(creditor.amount, debtor.amount);
        
        transactions.push({
            from: debtor.name,
            to: creditor.name,
            amount: parseFloat(amount.toFixed(2))
        });
        
        creditor.amount -= amount;
        debtor.amount -= amount;
        
        if (creditor.amount < 0.01) i++;
        if (debtor.amount < 0.01) j++;
    }
    
    // Mostrar resultados
    if (transactions.length === 0) {
        resultsEl.innerHTML = '<div class="no-results">¡Todos están en paz! No hay deudas pendientes.</div>';
        return;
    }
    
    let resultsHTML = '';
    transactions.forEach(transaction => {
        resultsHTML += `
            <div class="result-item">
                <span class="owes">${transaction.from} debe a</span>
                <span class="is-owed">${transaction.to} €${transaction.amount.toFixed(2)}</span>
            </div>
        `;
    });
    
    resultsEl.innerHTML = resultsHTML;
}

// Inicializar la aplicación cuando cargue la página
document.addEventListener('DOMContentLoaded', init);