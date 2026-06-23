const API_AUTH = "/api/auth";

let currentUser = null;
let myDocsPage = 1;
let isLoginForm = true;
let uploadQueue = [];
let queueIndex = 0;
let currentPreviewUrl = null;
let loadedInvoices = [];

// Защита от XSS: экранирование HTML-символов
function escapeHtml(str) {
  if (str == null || str === "") return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function getAuthToken() {
  return localStorage.getItem("auth_token");
}

function setAuthToken(token) {
  localStorage.setItem("auth_token", token);
}

function clearAuthToken() {
  localStorage.removeItem("auth_token");
}

function updateAuthUI() {
  const token = getAuthToken();
  const btnLogin = document.getElementById("btn_login");
  const btnRegister = document.getElementById("btn_register");
  const btnLogout = document.getElementById("btn_logout");
  const btnMyDocs = document.getElementById("btn_my_docs");
  const userInfo = document.getElementById("user_info");
  const saveBtn = document.getElementById("save_btn");

  if (token) {
    if (btnLogin) btnLogin.style.display = "none";
    if (btnRegister) btnRegister.style.display = "none";
    if (btnLogout) btnLogout.style.display = "inline-block";
    if (btnMyDocs) btnMyDocs.style.display = "inline-block";
    if (userInfo) {
      userInfo.textContent = "👤 " + (currentUser?.email || "Авторизован");
      userInfo.style.display = "inline";
    }
    if (saveBtn) {
      saveBtn.style.display = "inline-block";
      saveBtn.disabled = false;
      saveBtn.classList.remove("btn-secondary");
      saveBtn.classList.add("btn-outline-success");
      saveBtn.title = "";
    }
  } else {
    if (btnLogin) btnLogin.style.display = "inline-block";
    if (btnRegister) btnRegister.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (btnMyDocs) btnMyDocs.style.display = "none";
    if (userInfo) userInfo.style.display = "none";
    if (saveBtn) {
      saveBtn.style.display = "inline-block";
      saveBtn.disabled = true;
      saveBtn.classList.remove("btn-outline-success");
      saveBtn.classList.add("btn-secondary");
      saveBtn.title = "Для сохранения необходимо войти в аккаунт";
    }
  }
}

const btnLogin = document.getElementById("btn_login");
const btnRegister = document.getElementById("btn_register");
const btnLogout = document.getElementById("btn_logout");
const btnMyDocsEl = document.getElementById("btn_my_docs");
const editorContainer = document.getElementById("postUploadBlock");

if (editorContainer) {
  editorContainer.style.display = "none";
}

updateAuthUI();
