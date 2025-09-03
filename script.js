//Получение DOM-элементов, это сделано с помощью объекта для того чтобы проще было получить к ним доступ
const DOM_ELEMENTS = {
  tableBody: document.getElementById("table-body"),
  editForm: document.getElementById("edit-form"),
  userEditForm: document.getElementById("user-edit-form"),
  searchInput: document.getElementById("search-input"),
  searchBtn: document.getElementById("search-btn"),
  cancelBtn: document.querySelector(".cancel-btn"),
  pagination: document.getElementById("pagination"),
  prevPage: document.getElementById("prev-page"),
  nextPage: document.getElementById("next-page"),
  pageInfo: document.getElementById("page-info"),
  columnCheckboxes: document.querySelectorAll(
    '.column-controls input[type="checkbox"]'
  ),
};

//Проверка наличия DOM-элементов
//entries преобразует объект в массив пар. Цикл Проверяет каждый DOM-элемент на существование
Object.entries(DOM_ELEMENTS).forEach(([key, element]) => {
  if (!element) console.log(`DOM element with ${key} is not found!`);
});

let userData = []; // Массив данных пользователей
const currentSort = { field: null, direction: "asc" };
let selectedUserId = 0; // ID выбранного пользователя

// Настройки пагинации
const PAGINATION = {
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
  currentData: [], // Данные для текущей страницы
};

// Видимость колонок
const columnVisibility = {
  firstName: true,
  lastName: true,
  about: true,
  eyeColor: true,
};

// Цвета для преобразования кодов в названия
const COLOR_MAP = {
  red: "red",
  blue: "blue",
  green: "green",
  brown: "brown",
};

// Загрузка данных
//async объявляет асинхронную функцию, await ждет завершения операции
async function loadUserData() {
  try {
    const response = await fetch("data.json");
    userData = await response.json();
    PAGINATION.totalPages = Math.ceil(
      userData.length / PAGINATION.itemsPerPage
    );
    updatePagination();
    renderTable();
  } catch (error) {
    console.log("Ошибка загрузки", error);
  }
}

//Загрузка настроек колонок
function loadColumnSettings() {
  const savedSettings = localStorage.getItem("columnVisibility");
  if (savedSettings) {
    Object.assign(columnVisibility, JSON.parse(savedSettings));

    DOM_ELEMENTS.columnCheckboxes.forEach((checkbox) => {
      const column = checkbox.dataset.column;
      checkbox.checked = columnVisibility[column];
    });
  }
}

//Обновление видимости колонок
function updateColumnVisibility() {
  const columns = {
    firstName: 0,
    lastName: 1,
    about: 2,
    eyeColor: 3,
  };

  document.querySelectorAll("th[data-sort]").forEach((th, index) => {
    const columnName = th.dataset.sort;
    th.style.display = columnVisibility[columnName] ? "" : "none";
  });

  document.querySelectorAll("#table-body tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    cells.forEach((cell, index) => {
      const columnName = Object.keys(columns).find(
        (key) => columns[key] === index
      );
      cell.style.display = columnVisibility[columnName] ? "" : "none";
    });
  });

  localStorage.setItem("columnVisibility", JSON.stringify(columnVisibility));
}

//Получение данных для текущей страницы
function getCurrentPageData() {
  const startIndex = (PAGINATION.currentPage - 1) * PAGINATION.itemsPerPage;
  const endIndex = startIndex + PAGINATION.itemsPerPage;
  return userData.slice(startIndex, endIndex);
}

//Обновление пагинации
function updatePagination() {
  PAGINATION.totalPages = Math.ceil(userData.length / PAGINATION.itemsPerPage);

  DOM_ELEMENTS.pageInfo.textContent = `Страница ${PAGINATION.currentPage} из ${PAGINATION.totalPages}`;

  DOM_ELEMENTS.prevPage.disabled = PAGINATION.currentPage === 1;
  DOM_ELEMENTS.nextPage.disabled =
    PAGINATION.currentPage === PAGINATION.totalPages;
}

//Переход на страницу
function goToPage(page) {
  if (page < 1 || page > PAGINATION.totalPages) return;

  PAGINATION.currentPage = page;
  updatePagination();
  renderTable();
}

//переход на следующую страницу
function nextPage() {
  if (PAGINATION.currentPage < PAGINATION.totalPages) {
    goToPage(PAGINATION.currentPage + 1);
  }
}

//Переход на предыдущую страницу
function prevPage() {
  if (PAGINATION.currentPage > 1) {
    goToPage(PAGINATION.currentPage - 1);
  }
}

//Функция создания ячейки с цветом
function createColorCell(colorCode) {
  const cell = document.createElement("td");
  cell.style.textAlign = "center";
  cell.style.verticalAlign = "middle";

  const container = document.createElement("div");
  container.className = "color-container";

  const colorCircle = document.createElement("div");
  colorCircle.className = "color-circle";

  const colorMap = {
    blue: "#0000FF",
    brown: "#452409ff",
    green: "#008000",
    red: "#FF0000",
  };

  colorCircle.style.backgroundColor = colorMap[colorCode] || "#CCCCCC";

  const colorText = document.createElement("span");
  colorText.className = "sort-value";
  colorText.textContent = colorCode;

  container.appendChild(colorCircle);
  container.appendChild(colorText);
  cell.appendChild(container);

  cell.dataset.sortValue = colorCode;

  return cell;
}

//Вспомогательная функция создания ячейки
function createCell(content, className = "") {
  const cell = document.createElement("td");
  if (className) cell.classList.add(className);
  cell.textContent = content;
  return cell;
}

//Создание строки таблицы
function createTableRow(user) {
  const row = document.createElement("tr");
  row.dataset.userId = user.id;

  const firstNameCell = createCell(user.name.firstName);
  const lastNameCell = createCell(user.name.lastName);
  const aboutCell = createCell(user.about, "description");
  const eyeColorCell = createColorCell(user.eyeColor);

  row.appendChild(firstNameCell);
  row.appendChild(lastNameCell);
  row.appendChild(aboutCell);
  row.appendChild(eyeColorCell);

  row.addEventListener("click", () => openEditForm(user));

  return row;
}

//Отображение таблицы
function renderTable() {
  DOM_ELEMENTS.tableBody.innerHTML = "";

  const currentData = getCurrentPageData();

  currentData.forEach((user) => {
    DOM_ELEMENTS.tableBody.appendChild(createTableRow(user));
  });

  updateColumnVisibility();
}

//Получение значения поля для сортировки
function getFieldValue(user, field) {
  if (field === "firstName" || field === "lastName") {
    return user.name[field];
  }
  if (field === "eyeColor") {
    return user.eyeColor;
  }
  return user[field] || "";
}

//Сортировка данных
function sortData(field) {
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.field = field;
    currentSort.direction = "asc";
  }

  const sortedData = [...userData].sort((a, b) => {
    const aValue = getFieldValue(a, field).toLowerCase();
    const bValue = getFieldValue(b, field).toLowerCase();

    return currentSort.direction === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  userData = sortedData;
  PAGINATION.currentPage = 1;
  updateSortIndicators(field);
  updatePagination();
  renderTable();
}

//Обновление индикаторов сортировки
function updateSortIndicators(activeField) {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    const field = th.dataset.sort;
    const baseText = th.textContent.replace(/[↑↓⇅]/g, "").trim();
    const indicator = currentSort.direction === "asc" ? "↑" : "↓";

    th.textContent =
      field === activeField ? `${baseText} ${indicator}` : `${baseText} ⇅`;
  });
}

//Фильтрация по цвету глаз
function filterByEyeColor(color) {
  if (color === "all") {
    userData = [...userData];
  } else {
    userData = userData.filter((user) => user.eyeColor === color);
  }

  PAGINATION.currentPage = 1;
  PAGINATION.totalPages = Math.ceil(userData.length / PAGINATION.itemsPerPage); //ceil округляет число вверх до ближайшего целого
  updatePagination();
  renderTable();
}

//Поиск пользователей
function searchUsers(query) {
  const searchTerm = query.trim().toLowerCase();

  if (!searchTerm) {
    userData = [...userData];
  } else {
    userData = userData.filter(
      (user) =>
        user.name.firstName.toLowerCase().includes(searchTerm) ||
        user.name.lastName.toLowerCase().includes(searchTerm)
    );
  }

  PAGINATION.currentPage = 1;
  PAGINATION.totalPages = Math.ceil(userData.length / PAGINATION.itemsPerPage);
  updatePagination();
  renderTable();
}

// Открытие формы редактирования
function openEditForm(user) {
  selectedUserId = user.id;

  document.getElementById("edit-firstName").value = user.name.firstName;
  document.getElementById("edit-lastName").value = user.name.lastName;
  document.getElementById("edit-about").value = user.about;
  document.getElementById("edit-eyeColor").value = user.eyeColor;

  DOM_ELEMENTS.editForm.classList.add("active");
}

//Закрытие формы редактирования
function closeEditForm() {
  DOM_ELEMENTS.editForm.classList.remove("active");
  selectedUserId = 0;
}

//Сохранение изменений
function saveUserChanges(formData) {
  const userIndex = userData.findIndex((user) => user.id === selectedUserId);

  if (userIndex !== -1) {
    Object.assign(userData[userIndex], {
      name: {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
      },
      about: formData.get("about"),
      eyeColor: formData.get("eyeColor"),
    });

    updatePagination();
    renderTable();
    closeEditForm();
    alert("Вы обновили данные в ячейке таблицы");
  }
}

//Инициализация приложения
function initializeApp() {
  loadUserData();
  loadColumnSettings();

  DOM_ELEMENTS.columnCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const column = this.dataset.column;
      columnVisibility[column] = this.checked;
      updateColumnVisibility();
    });
  });

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

  const performSearch = () => searchUsers(DOM_ELEMENTS.searchInput.value);
  DOM_ELEMENTS.searchBtn.addEventListener("click", performSearch);
  DOM_ELEMENTS.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });

  DOM_ELEMENTS.userEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveUserChanges(new FormData(DOM_ELEMENTS.userEditForm));
  });

  DOM_ELEMENTS.cancelBtn.addEventListener("click", closeEditForm);

  DOM_ELEMENTS.prevPage.addEventListener("click", prevPage);
  DOM_ELEMENTS.nextPage.addEventListener("click", nextPage);
}

document.addEventListener("DOMContentLoaded", initializeApp);
