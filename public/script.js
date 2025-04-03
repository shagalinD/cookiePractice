document.addEventListener("DOMContentLoaded", () => {
    // Элементы DOM
    const authSection = document.getElementById("auth-section")
    const profileSection = document.getElementById("profile-section")
    const loginBtn = document.getElementById("login-btn")
    const registerBtn = document.getElementById("register-btn")
    const logoutBtn = document.getElementById("logout-btn")
    const errorMessage = document.getElementById("error-message")
    const tabBtns = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")
    const themeToggle = document.getElementById("theme-toggle")
    const lightIcon = document.querySelector(".light-icon")
    const darkIcon = document.querySelector(".dark-icon")
    const refreshDataBtn = document.getElementById("refresh-data-btn")
    const dataContent = document.getElementById("data-content")
    const dataTimestamp = document.getElementById("data-timestamp")
  
    // Инициализация темы
    initTheme()
  
    // Проверяем авторизацию при загрузке
    checkAuth()
  
    // Переключение вкладок
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab")
  
        // Активируем кнопку
        tabBtns.forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
  
        // Показываем содержимое вкладки
        tabContents.forEach((content) => content.classList.remove("active"))
        document.getElementById(`${tabId}-tab`).classList.add("active")
      })
    })
  
    // Обработчик входа
    loginBtn.addEventListener("click", async () => {
      const username = document.getElementById("login-username").value
      const password = document.getElementById("login-password").value
  
      if (!username || !password) {
        showError("Введите логин и пароль")
        return
      }
  
      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (data.success) {
          checkAuth()
        } else {
          showError("Неверные учетные данные")
        }
      } catch (err) {
        showError("Ошибка соединения")
      }
    })
  
    // Обработчик регистрации
    registerBtn.addEventListener("click", async () => {
      const username = document.getElementById("register-username").value
      const password = document.getElementById("register-password").value
  
      if (!username || !password) {
        showError("Введите логин и пароль")
        return
      }
  
      if (password.length < 5) {
        showError("Пароль должен содержать минимум 5 символов")
        return
      }
  
      try {
        const response = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (data.success) {
          checkAuth()
        } else {
          showError(data.error || "Ошибка регистрации")
        }
      } catch (err) {
        showError("Ошибка соединения")
      }
    })
  
    // Обработчик выхода
    logoutBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("/logout", {
          method: "POST",
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (data.success) {
          authSection.classList.remove("hidden")
          profileSection.classList.add("hidden")
        }
      } catch (err) {
        showError("Ошибка при выходе")
      }
    })
  
    // Переключение темы
    themeToggle.addEventListener("click", () => {
      const isDarkTheme = document.body.classList.toggle("dark-theme")
  
      // Сохраняем выбор в localStorage
      localStorage.setItem("theme", isDarkTheme ? "dark" : "light")
  
      // Обновляем иконку
      updateThemeIcon(isDarkTheme)
    })
  
    // Обновление данных
    refreshDataBtn.addEventListener("click", fetchData)
  
    // Проверка авторизации
    async function checkAuth() {
      try {
        const response = await fetch("/check-auth", {
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (data.authenticated) {
          document.getElementById("username-display").textContent = data.user.username
          authSection.classList.add("hidden")
          profileSection.classList.remove("hidden")
  
          // Загружаем данные при входе
          fetchData()
        }
      } catch (err) {
        console.error("Ошибка проверки авторизации:", err)
      }
    }
  
    // Получение данных с кэшированием
    async function fetchData() {
      try {
        dataContent.textContent = "Загрузка данных..."
        dataTimestamp.textContent = ""
  
        const response = await fetch("/data", {
          credentials: "include",
        })
  
        const data = await response.json()
  
        if (data.success) {
          dataContent.textContent = data.data
          dataTimestamp.textContent = `Обновлено: ${data.timestamp}`
        } else {
          dataContent.textContent = "Ошибка загрузки данных"
        }
      } catch (err) {
        dataContent.textContent = "Ошибка соединения"
      }
    }
  
    // Инициализация темы
    function initTheme() {
      const savedTheme = localStorage.getItem("theme")
      const isDarkTheme = savedTheme === "dark"
  
      if (isDarkTheme) {
        document.body.classList.add("dark-theme")
      }
  
      updateThemeIcon(isDarkTheme)
    }
  
    // Обновление иконки темы
    function updateThemeIcon(isDarkTheme) {
      if (isDarkTheme) {
        lightIcon.classList.add("hidden")
        darkIcon.classList.remove("hidden")
      } else {
        lightIcon.classList.remove("hidden")
        darkIcon.classList.add("hidden")
      }
    }
  
    // Показать ошибку
    function showError(message) {
      errorMessage.textContent = message
      errorMessage.classList.remove("hidden")
      setTimeout(() => {
        errorMessage.classList.add("hidden")
      }, 3000)
    }
  })
  
  