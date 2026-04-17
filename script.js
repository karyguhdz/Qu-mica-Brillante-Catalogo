const PRODUCT_SOURCE = "products.json";
const PLACEHOLDER_IMAGE = "images/placeholder-product.svg";
const WHATSAPP_NUMBER = "528129053409";

const productGrid = document.getElementById("productGrid");
const filterBar = document.getElementById("filterBar");
const statusMessage = document.getElementById("statusMessage");
const quoteCart = document.getElementById("quoteCart");
const quoteCartList = document.getElementById("quoteCartList");
const quoteCartEmpty = document.getElementById("quoteCartEmpty");
const quoteCartSend = document.getElementById("quoteCartSend");
const quoteCartClear = document.getElementById("quoteCartClear");
const quoteCartExcel = document.getElementById("quoteCartExcel");
const quoteCartToggle = document.getElementById("quoteCartToggle");
const quoteBubble = document.getElementById("quoteBubble");
const quoteBubbleCount = document.getElementById("quoteBubbleCount");
const imageLightbox = document.getElementById("imageLightbox");
const imageLightboxBackdrop = document.getElementById("imageLightboxBackdrop");
const imageLightboxClose = document.getElementById("imageLightboxClose");
const imageLightboxPrev = document.getElementById("imageLightboxPrev");
const imageLightboxNext = document.getElementById("imageLightboxNext");
const imageLightboxImage = document.getElementById("imageLightboxImage");
const imageLightboxTitle = document.getElementById("imageLightboxTitle");
const imageLightboxDots = document.getElementById("imageLightboxDots");

let allProducts = [];
let currentFilter = "todos";
let quoteItems = loadQuoteItems();
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let currentLightboxTitle = "";

document.addEventListener("DOMContentLoaded", async () => {
  bindFilterEvents();
  bindQuoteCartEvents();
  bindImageLightboxEvents();

  try {
    allProducts = await loadProducts(PRODUCT_SOURCE);
    renderFilterButtons(allProducts);
    renderProducts(allProducts);
    renderQuoteCart();
  } catch (error) {
    console.error("No fue posible cargar los productos:", error);
    showStatus(
      "No se pudo leer products.json. Revisa que el archivo exista y tenga formato JSON válido."
    );
  }
});

async function loadProducts(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Respuesta no válida: ${response.status}`);
    }

    const data = await response.json();
    return validateProducts(data);
  } catch (fetchError) {
    const iframeData = await loadProductsFromIframe(url);

    if (iframeData) {
      return validateProducts(iframeData);
    }

    throw fetchError;
  }
}

function loadProductsFromIframe(url) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.hidden = true;
    iframe.src = url;

    const cleanup = () => {
      iframe.remove();
    };

    iframe.onload = () => {
      try {
        const iframeDocument = iframe.contentDocument;
        const rawText = iframeDocument?.body?.innerText?.trim();

        cleanup();

        if (!rawText) {
          resolve(null);
          return;
        }

        resolve(JSON.parse(rawText));
      } catch (error) {
        cleanup();
        resolve(null);
      }
    };

    iframe.onerror = () => {
      cleanup();
      resolve(null);
    };

    document.body.appendChild(iframe);
  });
}

function validateProducts(data) {
  if (!Array.isArray(data)) {
    throw new Error("products.json debe contener un arreglo de productos.");
  }

  return data;
}

function bindFilterEvents() {
  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");

    if (!button) {
      return;
    }

    currentFilter = button.dataset.filter;
    updateActiveFilter(button);
    renderProducts(allProducts);
  });
}

function renderFilterButtons(products) {
  const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
  filterBar.innerHTML = `
    <button class="filter-chip is-active" data-filter="todos" type="button">Todos</button>
    ${categories
      .map(
        (category) =>
          `<button class="filter-chip" data-filter="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`
      )
      .join("")}
  `;
}

function updateActiveFilter(activeButton) {
  const buttons = filterBar.querySelectorAll("[data-filter]");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button === activeButton);
  });
}

function renderProducts(products) {
  const visibleProducts =
    currentFilter === "todos"
      ? products
      : products.filter((product) => product.categoria === currentFilter);

  productGrid.innerHTML = "";

  if (visibleProducts.length === 0) {
    showStatus("No hay productos en esta categoría por el momento.");
    return;
  }

  hideStatus();

  const fragment = document.createDocumentFragment();
  visibleProducts.forEach((product) => {
    fragment.appendChild(createProductCard(product));
  });

  productGrid.appendChild(fragment);
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";

  const presentationOptions = getPresentationOptions(product);
  const defaultPresentation = presentationOptions[0];
  const safeImageList = getProductImages(product);

  const image = document.createElement("img");
  image.src = safeImageList[0];
  image.alt = product.nombre;
  image.loading = "lazy";

  image.addEventListener("error", () => {
    image.onerror = null;
    image.src = PLACEHOLDER_IMAGE;
    image.alt = `Imagen no disponible de ${product.nombre}`;
  });

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "product-card__image";
  imageWrapper.role = "button";
  imageWrapper.tabIndex = 0;
  imageWrapper.setAttribute("aria-label", `Abrir galería de ${product.nombre}`);
  imageWrapper.appendChild(image);
  imageWrapper.addEventListener("click", () => {
    openImageLightbox(safeImageList, 0, product.nombre);
  });
  imageWrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImageLightbox(safeImageList, 0, product.nombre);
    }
  });

  if (safeImageList.length > 1) {
    let currentImageIndex = 0;
    const controls = document.createElement("div");
    controls.className = "product-card__gallery";

    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "product-card__arrow product-card__arrow--prev";
    prevButton.setAttribute("aria-label", `Ver imagen anterior de ${product.nombre}`);
    prevButton.innerHTML = "&#8249;";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "product-card__arrow product-card__arrow--next";
    nextButton.setAttribute("aria-label", `Ver imagen siguiente de ${product.nombre}`);
    nextButton.innerHTML = "&#8250;";

    const dots = document.createElement("div");
    dots.className = "product-card__dots";

    const dotButtons = safeImageList.map((imagePath, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `product-card__dot${index === 0 ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.nombre}`);

      dot.addEventListener("click", () => {
        currentImageIndex = index;
        updateGallery();
      });

      dots.appendChild(dot);
      return dot;
    });

    const updateGallery = () => {
      const imagePath = safeImageList[currentImageIndex] || PLACEHOLDER_IMAGE;
      image.src = imagePath;
      dotButtons.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === currentImageIndex);
      });
    };

    prevButton.addEventListener("click", (event) => {
      event.stopPropagation();
      currentImageIndex =
        (currentImageIndex - 1 + safeImageList.length) % safeImageList.length;
      updateGallery();
    });

    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      currentImageIndex = (currentImageIndex + 1) % safeImageList.length;
      updateGallery();
    });

    controls.appendChild(prevButton);
    controls.appendChild(dots);
    controls.appendChild(nextButton);
    imageWrapper.appendChild(controls);
  }

  const tagClass = product.etiqueta ? "product-card__tag" : "product-card__tag is-hidden";

  article.innerHTML = `
    <div class="product-card__body">
      <div class="${tagClass}">${product.etiqueta || "Disponible"}</div>
      <h3>${escapeHtml(product.nombre)}</h3>
      <p class="product-card__sku">SKU: ${getProductSku(product)}</p>
      <p class="product-card__description">${escapeHtml(product.descripcion)}</p>
      <div class="product-card__meta">
        <span><strong>Categoría:</strong> ${formatCategory(product.categoria)}</span>
        ${
          presentationOptions.length > 1
            ? `<label class="product-card__presentation">
                <strong>Presentación:</strong>
                <select class="product-card__select" data-presentation-select="${product.id}">
                  ${presentationOptions
                    .map(
                      (option) =>
                        `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
                    )
                    .join("")}
                </select>
              </label>`
            : `<span><strong>Presentación:</strong> ${escapeHtml(defaultPresentation)}</span>`
        }
      </div>
      <div class="product-card__footer">
        <div class="product-card__actions">
          <button class="button add-to-quote" type="button" data-product-id="${product.id}">
            Agregar al carrito
          </button>
          <a
            class="button direct-whatsapp"
            href="https://wa.me/${WHATSAPP_NUMBER}?text=${buildDirectProductMessage(product.nombre, defaultPresentation)}"
            data-product-id="${product.id}"
            target="_blank"
            rel="noreferrer"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;

  article.prepend(imageWrapper);
  return article;
}

function bindImageLightboxEvents() {
  imageLightboxBackdrop.addEventListener("click", closeImageLightbox);
  imageLightboxClose.addEventListener("click", closeImageLightbox);
  imageLightboxPrev.addEventListener("click", () => moveLightbox(-1));
  imageLightboxNext.addEventListener("click", () => moveLightbox(1));

  document.addEventListener("keydown", (event) => {
    if (imageLightbox.classList.contains("is-hidden-panel")) {
      return;
    }

    if (event.key === "Escape") {
      closeImageLightbox();
    }

    if (event.key === "ArrowLeft") {
      moveLightbox(-1);
    }

    if (event.key === "ArrowRight") {
      moveLightbox(1);
    }
  });
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.remove("is-hidden");
}

function hideStatus() {
  statusMessage.classList.add("is-hidden");
}

function bindQuoteCartEvents() {
  productGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".add-to-quote");

    if (!button) {
      return;
    }

    const productId = Number(button.dataset.productId);
    const presentation = getSelectedPresentation(productId);
    addProductToQuote(productId, presentation);
  });

  productGrid.addEventListener("change", (event) => {
    const select = event.target.closest("[data-presentation-select]");

    if (!select) {
      return;
    }

    const productId = Number(select.dataset.presentationSelect);
    syncDirectWhatsappLink(productId, select.value);
  });

  quoteCartList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-id]");
    const qtyButton = event.target.closest("[data-qty-action]");

    if (removeButton) {
      removeQuoteItem(Number(removeButton.dataset.removeId), removeButton.dataset.presentation);
      return;
    }

    if (!qtyButton) {
      return;
    }

    const productId = Number(qtyButton.dataset.productId);
    const action = qtyButton.dataset.qtyAction;
    updateQuoteQuantity(
      productId,
      qtyButton.dataset.presentation,
      action === "increase" ? 1 : -1
    );
  });

  quoteCartClear.addEventListener("click", () => {
    quoteItems = [];
    persistQuoteItems();
    renderQuoteCart();
  });

  quoteCartExcel.addEventListener("click", () => {
    downloadQuoteExcel();
  });

  quoteCartToggle.addEventListener("click", () => {
    toggleQuoteCart(false);
  });

  quoteBubble.addEventListener("click", () => {
    toggleQuoteCart(true);
  });
}

function addProductToQuote(productId, presentation) {
  const product = allProducts.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  const selectedPresentation = presentation || getPresentationOptions(product)[0];
  const existingItem = quoteItems.find(
    (item) => item.id === productId && item.presentacion === selectedPresentation
  );

  if (existingItem) {
    existingItem.cantidad += 1;
  } else {
    quoteItems.push({
      id: product.id,
      presentacion: selectedPresentation,
      cantidad: 1
    });
  }

  persistQuoteItems();
  renderQuoteCart();
  toggleQuoteCart(true);
}

function removeQuoteItem(productId, presentation) {
  quoteItems = quoteItems.filter(
    (item) => !(item.id === productId && item.presentacion === presentation)
  );
  persistQuoteItems();
  renderQuoteCart();
}

function updateQuoteQuantity(productId, presentation, change) {
  const item = quoteItems.find(
    (entry) => entry.id === productId && entry.presentacion === presentation
  );

  if (!item) {
    return;
  }

  item.cantidad += change;

  if (item.cantidad <= 0) {
    removeQuoteItem(productId, presentation);
    return;
  }

  persistQuoteItems();
  renderQuoteCart();
}

function renderQuoteCart() {
  quoteCartList.innerHTML = "";
  const totalItems = quoteItems.reduce((sum, item) => sum + item.cantidad, 0);
  quoteBubbleCount.textContent = String(totalItems);

  if (quoteItems.length === 0) {
    quoteCartEmpty.hidden = false;
    quoteCartSend.setAttribute("aria-disabled", "true");
    quoteCartSend.href = "#";
    quoteCartExcel.disabled = true;
    return;
  }

  quoteCartEmpty.hidden = true;
  const fragment = document.createDocumentFragment();

  quoteItems.forEach((item) => {
    const product = allProducts.find((entry) => entry.id === item.id);

    if (!product) {
      return;
    }

    fragment.appendChild(
      createQuoteCartItem(
        product,
        item.presentacion || getPresentationOptions(product)[0],
        item.cantidad
      )
    );
  });

  quoteCartList.appendChild(fragment);
  quoteCartSend.removeAttribute("aria-disabled");
  quoteCartSend.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildQuoteMessage()}`;
  quoteCartExcel.disabled = false;
}

function createQuoteCartItem(product, presentation, cantidad) {
  const item = document.createElement("li");
  item.className = "quote-cart__item";
  const imagePath = getProductImages(product)[0] || PLACEHOLDER_IMAGE;

  item.innerHTML = `
    <img class="quote-cart__item-image" src="${imagePath}" alt="${escapeHtml(product.nombre)}" />
    <div>
      <h4>${escapeHtml(product.nombre)}</h4>
      <p>${escapeHtml(presentation)}</p>
      <div class="quote-cart__qty">
        <button type="button" data-qty-action="decrease" data-product-id="${product.id}" data-presentation="${escapeHtml(presentation)}">-</button>
        <strong>${cantidad}</strong>
        <button type="button" data-qty-action="increase" data-product-id="${product.id}" data-presentation="${escapeHtml(presentation)}">+</button>
      </div>
    </div>
    <button class="quote-cart__remove" type="button" data-remove-id="${product.id}" data-presentation="${escapeHtml(presentation)}">
      Quitar
    </button>
  `;

  const image = item.querySelector(".quote-cart__item-image");
  image.addEventListener("error", () => {
    image.onerror = null;
    image.src = PLACEHOLDER_IMAGE;
  });

  return item;
}

function buildQuoteMessage() {
  const lines = [
    "Hola, quiero cotizar los siguientes productos:",
    ""
  ];

  quoteItems.forEach((item, index) => {
    const product = allProducts.find((entry) => entry.id === item.id);

    if (!product) {
      return;
    }

    const presentation = item.presentacion || getPresentationOptions(product)[0];
    lines.push(
      `${index + 1}. ${product.nombre} - SKU: ${getProductSku(product)} - Cantidad: ${item.cantidad} - ${presentation}`
    );
  });

  lines.push("");
  lines.push("Me comparten información, por favor.");

  return encodeURIComponent(lines.join("\n"));
}

function persistQuoteItems() {
  localStorage.setItem("quoteItems", JSON.stringify(quoteItems));
}

function loadQuoteItems() {
  try {
    const raw = localStorage.getItem("quoteItems");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function toggleQuoteCart(shouldOpen) {
  quoteCart.classList.toggle("is-hidden-panel", !shouldOpen);
  quoteBubble.classList.toggle("is-hidden", shouldOpen);
  quoteCartToggle.textContent = "Cerrar";
  quoteCartToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function formatCategory(category) {
  const normalized = String(category || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const categoryMap = {
    detergentes: "Detergentes",
    desinfectantes: "Desinfectantes",
    cocina: "Cocina",
    bano: "Baño",
    "articulos de limpieza": "Artículos de limpieza"
  };

  return categoryMap[normalized] || category;
}

function getPresentationOptions(product) {
  if (Array.isArray(product.presentaciones) && product.presentaciones.length > 0) {
    return product.presentaciones;
  }

  return [product.presentacion || "Presentación por confirmar"];
}

function getProductImages(product) {
  const normalizeImagePath = (path) => encodeURI(String(path));

  if (Array.isArray(product.imagenes) && product.imagenes.length > 0) {
    return product.imagenes.filter(Boolean).map(normalizeImagePath);
  }

  if (Array.isArray(product.imagen) && product.imagen.length > 0) {
    return product.imagen.filter(Boolean).map(normalizeImagePath);
  }

  if (typeof product.imagen === "string" && product.imagen.trim()) {
    return [normalizeImagePath(product.imagen)];
  }

  return [PLACEHOLDER_IMAGE];
}

function openImageLightbox(images, startIndex, title) {
  currentLightboxImages = images;
  currentLightboxIndex = startIndex;
  currentLightboxTitle = title;
  imageLightbox.classList.remove("is-hidden-panel");
  imageLightbox.setAttribute("aria-hidden", "false");
  renderImageLightbox();
}

function closeImageLightbox() {
  imageLightbox.classList.add("is-hidden-panel");
  imageLightbox.setAttribute("aria-hidden", "true");
}

function moveLightbox(direction) {
  if (currentLightboxImages.length <= 1) {
    return;
  }

  currentLightboxIndex =
    (currentLightboxIndex + direction + currentLightboxImages.length) %
    currentLightboxImages.length;
  renderImageLightbox();
}

function renderImageLightbox() {
  const imagePath = currentLightboxImages[currentLightboxIndex] || PLACEHOLDER_IMAGE;
  imageLightboxImage.src = imagePath;
  imageLightboxImage.alt = `${currentLightboxTitle} imagen ${currentLightboxIndex + 1}`;
  imageLightboxImage.onerror = () => {
    imageLightboxImage.onerror = null;
    imageLightboxImage.src = PLACEHOLDER_IMAGE;
  };
  imageLightboxTitle.textContent = currentLightboxTitle;
  imageLightboxDots.innerHTML = "";

  currentLightboxImages.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `image-lightbox__dot${index === currentLightboxIndex ? " is-active" : ""}`;
    dot.setAttribute("aria-label", `Ver imagen ${index + 1}`);
    dot.addEventListener("click", () => {
      currentLightboxIndex = index;
      renderImageLightbox();
    });
    imageLightboxDots.appendChild(dot);
  });
}

function getProductSku(product) {
  if (product.sku) {
    return product.sku;
  }

  const categoryCodeMap = {
    detergentes: "DET",
    desinfectantes: "DES",
    cocina: "COC",
    baño: "BAN",
    "artículos de limpieza": "ART"
  };

  const categoryCode = categoryCodeMap[product.categoria] || "QB";
  return `${categoryCode}-${String(product.id).padStart(3, "0")}`;
}

function getSelectedPresentation(productId) {
  const select = productGrid.querySelector(`[data-presentation-select="${productId}"]`);

  if (select) {
    return select.value;
  }

  const product = allProducts.find((item) => item.id === productId);
  return product ? getPresentationOptions(product)[0] : "Presentación por confirmar";
}

function syncDirectWhatsappLink(productId, presentation) {
  const link = productGrid.querySelector(`.direct-whatsapp[data-product-id="${productId}"]`);
  const product = allProducts.find((item) => item.id === productId);

  if (!link || !product) {
    return;
  }

  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildDirectProductMessage(product.nombre, presentation)}`;
}

function buildDirectProductMessage(productName, presentation) {
  return encodeURIComponent(
    `Hola, me interesa el producto "${productName}" en presentación ${presentation}.`
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function downloadQuoteExcel() {
  if (quoteItems.length === 0) {
    return;
  }

  const headers = ["SKU", "Producto", "Presentacion", "Cantidad"];
  const rows = quoteItems
    .map((item) => {
      const product = allProducts.find((entry) => entry.id === item.id);

      if (!product) {
        return null;
      }

      return [
        getProductSku(product),
        product.nombre,
        item.presentacion || getPresentationOptions(product)[0],
        String(item.cantidad)
      ];
    })
    .filter(Boolean);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `cotizacion-quimica-brillante-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
