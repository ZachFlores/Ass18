const getFormData = () => {
    const formData = new FormData(document.getElementById("addItemForm"));
    const craftData = {
        itemName: formData.get("itemName"),
        itemDescription: formData.get("itemDescription"),
        supply: formData.getAll("supply[]"),
    };
    return craftData;
};

const getCrafts = async () => {
    try {
        const response = await fetch("/api/crafts");
        return response.json();
    } catch (error) {
        console.log("Error retrieving data:", error);
        return [];
    }
};

const showModal = (craft, index) => {
    const modal = document.getElementById("myModal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    modalTitle.textContent = craft.name;
    modalBody.innerHTML = `
        <img src="images/${craft.image}" alt="${craft.name}" style="width:50%">
        <p>${craft.description}</p>
        <h3>Supplies:</h3>
        <ul>${craft.supplies.map(item => `<li>${item}</li>`).join("")}</ul>
    `;

    if (modal.style.display !== "block") {
      modal.style.display = "block";

      modal.dataset.index = index;

      const deleteButton = document.getElementById("deleteCraftButton");
      deleteButton.addEventListener("click", () => deleteCraft(modal.dataset.index));
    }
};


const closeModal = () => {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
};

const populateGallery = async () => {
    try {
      const response = await fetch("/api/crafts");
      const crafts = await response.json();
      const gallery = document.querySelector(".gallery");
      gallery.innerHTML = "";
      crafts.forEach((craft, index) => {
        const img = document.createElement("img");
        img.src = `images/${craft.image}`;
        img.alt = craft.name;
        img.onclick = () => showModal(craft, index);
        gallery.appendChild(img);
      });
    } catch (error) {
      console.error("Error populating gallery:", error);
    }
};

populateGallery();

document.querySelector(".w3-button").addEventListener("click", closeModal);

window.onclick = (event) => {
    const modal = document.getElementById("myModal");
    if (event.target == modal) {
        closeModal();
    }
};

const showAddItemModal = () => {
    closeModal();
    document.getElementById("addItemModal").style.display = "block";
};

const hideAddItemModal = () => {
    const addItemForm = document.getElementById("addItemForm");
    addItemForm.reset();

    const suppliesContainer = document.getElementById("supplies");
    while (suppliesContainer.children.length > 1) {
        suppliesContainer.removeChild(suppliesContainer.lastChild);
    }

    document.getElementById("addItemModal").style.display = "none"; 
};

document.getElementById("cancelButton").onclick = hideAddItemModal;


document.getElementById("addItemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById("addItemForm"));
    const itemName = document.getElementById("modal-title").textContent;
    const index = document.getElementById("myModal").dataset.index;

    if (index !== undefined) { // Editing an existing item
        try {
            // Check if a new image file is selected
            const imageFile = document.getElementById('itemImage').files[0];
            let imageUrl = null;
            if (imageFile) {
                // Upload the new image file
                const imageFormData = new FormData();
                imageFormData.append('itemImage', imageFile);
                const imageResponse = await fetch("/api/uploadImage", {
                    method: "POST",
                    body: imageFormData,
                });
                if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    imageUrl = imageData.imageUrl;
                } else {
                    console.error("Failed to upload image:", imageResponse.statusText);
                }
            }

            const craftData = getFormData();
            if (imageUrl) {
                // Update the craft data with the new image URL
                craftData.image = imageUrl;
            }

            const response = await fetch(`/api/crafts/${itemName}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(craftData)
            });
            if (response.ok) {
                console.log("Item updated successfully");
                hideAddItemModal();
                populateGallery();
                closeModal(); // Hide the modal after saving edits
            } else {
                console.error("Failed to update item:", response.statusText);
                console.log("Response:", response);
            }
        } catch (error) {
            console.error("Error updating item:", error);
        }
    } else { // Adding a new item
        // Remain unchanged
    }
});



document.getElementById("addCraftButton").addEventListener("click", showAddItemModal);

document.getElementById("pencilIcon").addEventListener("click", async () => {
    const modalTitle = document.getElementById("modal-title");
    const response = await fetch("/api/crafts");
    const crafts = await response.json();

    const selectedCraftIndex = crafts.findIndex(craft => craft.name === modalTitle.textContent);
    const selectedCraft = crafts[selectedCraftIndex];

    document.getElementById("itemName").value = selectedCraft.name;
    document.getElementById("itemDescription").value = selectedCraft.description;
    selectedCraft.supplies.forEach((supply, index) => {
        if (index === 0) {
            document.querySelector("input[name='supply[]']").value = supply;
        } else {
            const supplyInput = document.createElement("input");
            supplyInput.type = "text";
            supplyInput.name = "supply[]";
            supplyInput.required = true;
            supplyInput.value = supply;
            document.getElementById("supplies").appendChild(supplyInput);
        }
    });

    const previewImage = document.getElementById("previewImage");
    previewImage.src = `images/${selectedCraft.image}`;

    showAddItemModal();
});

const showSelectedImage = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        document.getElementById("previewImage").src = imageSrc;
    };
    reader.readAsDataURL(file);
};

document.getElementById("itemImage").addEventListener("change", showSelectedImage);

const addSupply = () => {
    const suppliesContainer = document.getElementById("supplies");

    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.name = "supply[]";
    newInput.required = true;

    const lineBreak = document.createElement("br"); 
    suppliesContainer.appendChild(newInput);
    suppliesContainer.appendChild(lineBreak); 
};

const deleteCraft = async (index) => {
    const confirmation = confirm("Are you sure you want to delete this craft?");
    if (confirmation) {
        const itemName = document.getElementById("modal-title").textContent;
        try {
            const response = await fetch(`/api/crafts/${itemName}`, {
                method: "DELETE",
            });
            if (response.ok) {
                console.log("Craft deleted successfully");
                closeModal(); 
                populateGallery(); 
            } else {
                console.error("Failed to delete craft:", response.statusText);
            }
        } catch (error) {
            console.error("Error deleting craft:", error);
        }
    }
};

document.getElementById("addSupplyButton").addEventListener("click", addSupply);
