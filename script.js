const PRODUCT_SOURCE = "products.json";
const PLACEHOLDER_IMAGE = "images/placeholder-product.svg";
const WHATSAPP_NUMBER = "528129053409";

const productGrid = document.getElementById("productGrid");
const filterBar = document.getElementById("filterBar");
const statusMessage = document.getElementById("statusMessage");

let allProducts = [];
let currentFilter = "todos";

document.addEventListener("DOMContentLoaded", async () => {
  bindFilterEvents();

  try {
    allProducts = await loadProducts(PRODUCT_SOURCE);
    renderProducts(allProducts);
  } catch (error) {
    console.error("No fue posible cargar los productos:", error);
    showStatus(
      "No se pudo leer products.json. Revisa que el archivo exista y tenga formato JSON valido."
    );
  }
});

async function loadProducts(url) {
  // Cambia el nombre del archivo aqui solo si renombraste products.json.
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Respuesta no valida: ${response.status}`);
    }

    const data = await response.json();
    return validateProducts(data);
  } catch (fetchError) {
    // Algunos navegadores limitan fetch cuando index.html se abre desde file://.
    // Este fallback intenta leer el JSON desde un iframe oculto en la misma carpeta.
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
    showStatus("No hay productos en esta categoria por el momento.");
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

  const imageList = Array.isArray(product.imagenes)
    ? product.imagenes.filter(Boolean)
    : product.imagen
      ? [product.imagen]
      : [];
  const safeImageList = imageList.length > 0 ? imageList : [PLACEHOLDER_IMAGE];

  const image = document.createElement("img");
  image.src = safeImageList[0];
  image.alt = product.nombre;
  image.loading = "lazy";

  image.addEventListener("error", () => {
    // Si falta la imagen original, se reemplaza por un placeholder elegante.
    image.onerror = null;
    image.src = PLACEHOLDER_IMAGE;
    image.alt = `Imagen no disponible de ${product.nombre}`;
  });

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "product-card__image";
  imageWrapper.appendChild(image);

  if (safeImageList.length > 1) {
    const gallery = document.createElement("div");
    gallery.className = "product-card__thumbs";

    safeImageList.forEach((imagePath, index) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = `product-card__thumb${index === 0 ? " is-active" : ""}`;
      thumb.setAttribute("aria-label", `Ver imagen ${index + 1} de ${product.nombre}`);

      const thumbImage = document.createElement("img");
      thumbImage.src = imagePath;
      thumbImage.alt = `${product.nombre} vista ${index + 1}`;
      thumbImage.loading = "lazy";
      thumbImage.addEventListener("error", () => {
        thumbImage.onerror = null;
        thumbImage.src = PLACEHOLDER_IMAGE;
      });

      thumb.addEventListener("click", () => {
        image.src = imagePath;
        const thumbs = gallery.querySelectorAll(".product-card__thumb");
        thumbs.forEach((item) => item.classList.remove("is-active"));
        thumb.classList.add("is-active");
      });

      thumb.appendChild(thumbImage);
      gallery.appendChild(thumb);
    });

    imageWrapper.appendChild(gallery);
  }

  const tagClass = product.etiqueta ? "product-card__tag" : "product-card__tag is-hidden";
  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa el producto "${product.nombre}" en presentacion ${product.presentacion}.`
  );

  article.innerHTML = `
    <div class="product-card__body">
      <div class="${tagClass}">${product.etiqueta || "Disponible"}</div>
      <h3>${product.nombre}</h3>
      <p class="product-card__description">${product.descripcion}</p>
      <div class="product-card__meta">
        <span><strong>Categoria:</strong> ${product.categoria}</span>
        <span><strong>Presentacion:</strong> ${product.presentacion}</span>
      </div>
      <div class="product-card__footer">
        <span class="product-card__price">${product.precio}</span>
        <a
          class="button"
          href="https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}"
          target="_blank"
          rel="noreferrer"
        >
          Solicitar
        </a>
      </div>
    </div>
  `;

  article.prepend(imageWrapper);
  return article;
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.remove("is-hidden");
}

function hideStatus() {
  statusMessage.classList.add("is-hidden");
}
