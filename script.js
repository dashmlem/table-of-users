//Константы для хранения DOM-элементов
const DOM_ELEMENTS = {
  tableBody: document.getElementById("table-body"),
  editForm: document.getElementById("edit-form"),
  userEditForm: document.getElementById("user-edit-form"),
  searchInput: document.getElementById("search-input"),
  searchBtn: document.getElementById("search-btn"),
  cancelBtn: document.querySelector(".cancel-btn"),
};

let userData = []; //Массив для хранения данных
let currentSort = { field: null, direction: "asc" }; //Сортировка по дефолту
let selectedUserId = 0; //ID выбранного пользователя

async function loadUserData() {
  try {
    const response = await fetch("data.json");
    userData = await response.json();
    renderTable(userData);
  } catch (error) {
    console.log("Ошибка загрузки", error);
  }
}

//Отображение таблицы
function renderTable(data) {
  DOM_ELEMENTS.tableBody.innerHTML = "";

  data.forEach((user) => {
    const row = createTableRow(user);
    DOM_ELEMENTS.tableBody.appendChild(row);
  });
}

//Создание строк таблицы
function createTableRow(user) {
  const row = document.createElement("tr");
  row.dataset.userId = user.id;

  row.innerHTML = `
        <td>${user.name.firstName}</td>
        <td>${user.name.lastName}</td>
        <td class="description">${user.about}</td>
        <td>${getEyeColorName(user.eyeColor)}</td>
    `;

  row.addEventListener("click", () => openEditForm(user));
  return row;
}
//Перевод цвета
function getEyeColorName(colorCode) {
  const colors = {
    blue: "blue",
    brown: "brown",
    green: "green",
    red: "red",
  };
  return colors[colorCode];
}

function sortData(field) {
  // Сортировка данных -> Переключение направления если поле то же
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.field = field;
    currentSort.direction = "asc";
  }

  const sortedData = [...userData].sort((a, b) => {
    const aValue = getFieldValue(a, field).toLowerCase();
    const bValue = getFieldValue(b, field).toLowerCase();

    if (aValue < bValue) return currentSort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return currentSort.direction === "asc" ? 1 : -1;
    return 0;
  });

  updateSortIndicators(field);
  renderTable(sortedData);
}

//Получение значения поля для сортировки
function getFieldValue(user, field) {
  if (field === "firstName" || field === "lastName") {
    return user.name[field];
  }
  return user[field] || "";
}

function updateSortIndicators(activeField) {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    const field = th.dataset.sort;
    const baseText = th.textContent.replace(/[↑↓⇅]/g, "").trim();

    if (field === activeField) {
      th.textContent = `${baseText} ${
        currentSort.direction === "asc" ? "↑" : "↓"
      }`;
    } else {
      th.textContent = `${baseText} ⇅`;
    }
  });
}

//Фильтрация по цвету глаз
function filterByEyeColor(color) {
  if (color === "all") {
    renderTable(userData);
  } else {
    const filteredData = userData.filter((user) => user.eyeColor === color);
    renderTable(filteredData);
  }
}

//Поиск пользователей
function searchUsers(query) {
  if (!query.trim()) {
    renderTable(userData);
    return;
  }

  const searchTerm = query.toLowerCase();
  const results = userData.filter(
    (user) =>
      user.name.firstName.toLowerCase().includes(searchTerm) ||
      user.name.lastName.toLowerCase().includes(searchTerm)
  );

  renderTable(results);
}

function openEditForm(user) {
  //Функция для открытия формы редактирования ячеек
  selectedUserId = user.id;

  document.getElementById("edit-firstName").value = user.name.firstName;
  document.getElementById("edit-lastName").value = user.name.lastName;
  document.getElementById("edit-about").value = user.about;
  document.getElementById("edit-eyeColor").value = user.eyeColor;

  DOM_ELEMENTS.editForm.classList.add("active");
}

function closeEditForm() {
  DOM_ELEMENTS.editForm.classList.remove("active");
  selectedUserId = 0;
}

function saveUserChanges(formData) {
  const userIndex = userData.findIndex((user) => user.id === selectedUserId);

  if (userIndex !== -1) {
    // Обновление данных
    userData[userIndex].name.firstName = formData.get("firstName");
    userData[userIndex].name.lastName = formData.get("lastName");
    userData[userIndex].about = formData.get("about");
    userData[userIndex].eyeColor = formData.get("eyeColor");

    renderTable(userData);
    closeEditForm();
    alert("Вы обновили данные в ячейке таблицы");
  }
}

function initializeApp() {
  //Инициализация приложения
  loadUserData();

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => sortData(th.dataset.sort));
  });

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
      this.classList.add("active");
      filterByEyeColor(this.dataset.filter);
    });
  });

  DOM_ELEMENTS.searchBtn.addEventListener("click", () => {
    searchUsers(DOM_ELEMENTS.searchInput.value);
  });

  DOM_ELEMENTS.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchUsers(DOM_ELEMENTS.searchInput.value);
    }
  });

  DOM_ELEMENTS.userEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveUserChanges(new FormData(DOM_ELEMENTS.userEditForm));
  });

  DOM_ELEMENTS.cancelBtn.addEventListener("click", closeEditForm);
}
//Запуск приложения, когда DOM загружен
document.addEventListener("DOMContentLoaded", initializeApp);
