// Recipe Management
let recipes = [];

// Fetch data from JSON file
async function fetchRecipes() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    recipes = data.recipes;
    displayRecipes();
  } catch (error) {
    console.error("Error fetching data:", error);
    showNotification("Error fetching data", "error");
  }
}

// Save data to JSON file
async function saveRecipes() {
  try {
    const response = await fetch("data.json", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipes }),
    });
    if (!response.ok) throw new Error("Error saving data");
  } catch (error) {
    console.error("Error saving data:", error);
    showNotification("Error saving data", "error");
  }
}

// Add New Recipe Form
const recipeForm = document.getElementById("recipe-form");
recipeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const recipe = {
    id: recipeForm.dataset.editingId || Date.now().toString(),
    name: document.getElementById("recipe-name").value,
    image: document.getElementById("recipe-image").value,
    ingredients: document.getElementById("recipe-ingredients").value,
    instructions: document.getElementById("recipe-instructions").value,
  };

  // If editing, remove old recipe
  if (recipeForm.dataset.editingId) {
    recipes = recipes.filter((r) => r.id !== recipeForm.dataset.editingId);
    delete recipeForm.dataset.editingId;
  }

  recipes.push(recipe);
  await saveRecipes();
  displayRecipes();
  recipeForm.reset();

  // Reset form button text
  const submitButton = recipeForm.querySelector('button[type="submit"]');
  submitButton.textContent = "Add Recipe";

  showNotification(
    recipe.id ? "Recipe updated successfully" : "Recipe added successfully",
    "success"
  );
});

// Delete recipe
async function deleteRecipe(recipeId) {
  console.log("Deleting recipe:", recipeId);
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    console.error("Recipe not found:", recipeId);
    return;
  }

  if (confirm("آیا مطمئن هستید که می‌خواهید این دستور پخت را حذف کنید؟")) {
    recipes = recipes.filter((recipe) => recipe.id !== recipeId);
    await saveRecipes();
    displayRecipes();
    showNotification("دستور پخت با موفقیت حذف شد", "success");
  }
}

// Edit recipe
async function editRecipe(recipeId) {
  console.log("Editing recipe:", recipeId);
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    console.error("Recipe not found:", recipeId);
    return;
  }

  // Show add recipe section if hidden
  const addRecipeSection = document.getElementById("add-recipe-section");
  if (!addRecipeSection) {
    console.error("Add recipe section not found");
    return;
  }
  addRecipeSection.style.display = "block";

  // Fill form with recipe data
  document.getElementById("recipe-name").value = recipe.name;
  document.getElementById("recipe-image").value = recipe.image;
  document.getElementById("recipe-ingredients").value = recipe.ingredients;
  document.getElementById("recipe-instructions").value = recipe.instructions;

  // Change form button to edit
  const submitButton = recipeForm.querySelector('button[type="submit"]');
  submitButton.textContent = "Update Recipe";

  // Add temporary data attribute to form
  recipeForm.dataset.editingId = recipeId;

  // Scroll to form
  addRecipeSection.scrollIntoView({ behavior: "smooth" });

  // Close modal if open
  closeModal();
}

// Display Recipes
function displayRecipes() {
  const recipesGrid = document.getElementById("recipes-grid");
  recipesGrid.innerHTML = "";

  recipes.forEach((recipe) => {
    const recipeCard = document.createElement("div");
    recipeCard.className = "recipe-card";

    // Create recipe URL for QR code
    const recipeUrl = `${window.location.origin}${window.location.pathname}?recipe=${recipe.id}`;

    // Get first 3 ingredients for preview
    const previewIngredients = recipe.ingredients
      .split("\n")
      .slice(0, 3)
      .join("\n");

    // Add admin actions only if user is authenticated
    const adminActions = isAuthenticated
      ? `
      <div class="recipe-actions">
        <button onclick="editRecipe('${recipe.id}')" class="edit-btn">
          <i class="fas fa-edit"></i> ویرایش
        </button>
        <button onclick="deleteRecipe('${recipe.id}')" class="delete-btn">
          <i class="fas fa-trash"></i> حذف
        </button>
      </div>
    `
      : "";

    recipeCard.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" />
      <h3>${recipe.name}</h3>
      <div class="ingredients-preview">
        ${previewIngredients}
      </div>
      <div class="qr-container">
        <div id="qr-${recipe.id}"></div>
        <p class="qr-label">اسکن کنید تا دستور پخت را ببینید</p>
      </div>
      <button onclick="showRecipeDetails('${recipe.id}')" class="read-more-btn">
        بیشتر بخوانید
      </button>
      ${adminActions}
    `;

    recipesGrid.appendChild(recipeCard);

    // Generate QR code if QRCode is available
    if (typeof QRCode !== "undefined") {
      new QRCode(document.getElementById(`qr-${recipe.id}`), {
        text: recipeUrl,
        width: 128,
        height: 128,
        colorDark: "#e63946",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
        quietZone: 10,
        quietZoneColor: "transparent",
      });
    }
  });
}

// Show Recipe Details
function showRecipeDetails(recipeId) {
  console.log("Opening modal for recipe:", recipeId);
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    console.error("Recipe not found:", recipeId);
    return;
  }

  const modal = document.getElementById("recipe-modal");
  if (!modal) {
    console.error("Modal element not found");
    return;
  }

  const modalTitle = document.getElementById("modal-title");
  const modalIngredients = document.getElementById("modal-ingredients");
  const modalInstructions = document.getElementById("modal-instructions");

  // Add recipe image to modal
  const modalContent = modal.querySelector(".modal-content");
  const existingImage = modalContent.querySelector(".recipe-image");
  if (existingImage) {
    existingImage.remove();
  }
  const imageElement = document.createElement("img");
  imageElement.src = recipe.image;
  imageElement.alt = recipe.name;
  imageElement.className = "recipe-image";
  modalContent.insertBefore(imageElement, modalTitle);

  modalTitle.textContent = recipe.name;

  // Convert ingredients to list
  modalIngredients.innerHTML = `
    <h3>مواد اولیه:</h3>
    <ul class="ingredients-list">
      ${recipe.ingredients
        .split("\n")
        .map((ingredient) => `<li>${ingredient.trim()}</li>`)
        .join("")}
    </ul>
  `;

  // Convert instructions to numbered list
  modalInstructions.innerHTML = `
    <h3>دستور پخت:</h3>
    <ol class="instructions-list">
      ${recipe.instructions
        .split("\n")
        .map((instruction) => `<li>${instruction.trim()}</li>`)
        .join("")}
    </ol>
  `;

  // Add admin actions if user is authenticated
  const existingActions = modalContent.querySelector(".modal-actions");
  if (existingActions) {
    existingActions.remove();
  }

  if (isAuthenticated) {
    const adminActions = `
      <div class="modal-actions">
        <button onclick="editRecipe('${recipe.id}')" class="edit-btn">
          <i class="fas fa-edit"></i> ویرایش
        </button>
        <button onclick="deleteRecipe('${recipe.id}')" class="delete-btn">
          <i class="fas fa-trash"></i> حذف
        </button>
      </div>
    `;
    modalContent.insertAdjacentHTML("beforeend", adminActions);
  }

  // Show modal
  modal.style.display = "flex";
  modal.classList.add("show");
}

// Close modal function
function closeModal() {
  const modal = document.getElementById("recipe-modal");
  if (!modal) return;

  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Authentication Management
const AUTH_USERNAME = "";
const AUTH_PASSWORD = "";

let isAuthenticated = false;

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function checkAuth() {
  const authForm = document.getElementById("login-form");
  const userInfo = document.getElementById("user-info");
  const addRecipeSection = document.getElementById("add-recipe-section");

  if (isAuthenticated) {
    authForm.style.display = "none";
    userInfo.style.display = "flex";
    addRecipeSection.style.display = "block";
  } else {
    authForm.style.display = "flex";
    userInfo.style.display = "none";
    addRecipeSection.style.display = "none";
  }

  // Refresh recipe display to show/hide admin actions
  displayRecipes();
}

function login(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    isAuthenticated = true;
    document.getElementById("username-display").textContent = username;
    checkAuth();
    showNotification("Login successful!", "success");
  } else {
    showNotification("Invalid username or password", "error");
  }
}

function logout() {
  isAuthenticated = false;
  checkAuth();
  showNotification("Logout successful!", "success");
}

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Fetch data from JSON file
  fetchRecipes();

  // Add event listener for login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", login);
  }

  // Add event listener for logout button
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  // Add event listener for modal close buttons
  const closeModalBtn = document.getElementById("close-modal");
  const modalCloseBtn = document.querySelector(".modal-close-btn");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  // Close modal when clicking outside
  const modal = document.getElementById("recipe-modal");
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  // Check authentication status on page load
  checkAuth();
});
