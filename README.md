# Catalogo web de productos de limpieza

Este catalogo funciona con archivos estaticos:

- `index.html`
- `styles.css`
- `script.js`
- `products.json`
- `images/`

## Como editar textos principales

- Cambia nombre del negocio, eslogan, botones y datos de contacto dentro de `index.html`.
- Cambia el numero de WhatsApp general y el numero usado en cada tarjeta dentro de `script.js`.
- Ajusta colores, espacios y estilos visuales desde `styles.css`.

## Como subir nuevas imagenes

1. Copia tus imagenes dentro de la carpeta `images/`.
2. Usa nombres simples, por ejemplo: `images/desinfectante-2.jpg`.
3. En `products.json`, cambia el valor del campo `"imagen"` por la ruta correcta.
4. Si una imagen no existe o esta mal escrita, la pagina mostrara automaticamente un placeholder elegante.

## Como agregar o editar productos

Cada producto se define como un objeto dentro del arreglo de `products.json`.

Ejemplo:

```json
{
  "id": 11,
  "nombre": "Jabon liquido antibacterial",
  "categoria": "desinfectantes",
  "descripcion": "Ideal para lavado frecuente de manos.",
  "presentacion": "500 ml",
  "precio": "$44",
  "imagen": "images/jabon-antibacterial.jpg",
  "etiqueta": "Promocion"
}
```

## Categorias disponibles

Usa exactamente una de estas categorias para que los filtros funcionen:

- `detergentes`
- `desinfectantes`
- `cocina`
- `baño`
- `artículos de limpieza`

## Recomendaciones

- Mantiene los `id` sin repetir.
- Si cambias el nombre de `products.json`, actualiza `PRODUCT_SOURCE` en `script.js`.
- Si algun navegador bloquea la lectura de `products.json` al abrir `index.html` directamente con `file://`, prueba abrir el mismo archivo en otro navegador moderno o levantar un servidor local simple. El catalogo ya incluye un intento extra de lectura para esos casos.
