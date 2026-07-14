# Content Grid para Notion — recreación independiente

Esta versión reproduce la estructura y las funciones públicas que aparecen en la web de referencia, sin copiar su código ni sus recursos.

## Qué incluye

- Grid de Instagram de 3 columnas y opción de 5 columnas.
- Pestañas **GRID** y **REELS**.
- **Refresh** manual.
- **Plan Grid**: arrastra dos posts para intercambiar sus fechas y guardarlas en Notion.
- **Content Map** con color por pilar.
- **Profile Preview** con foto, usuario, nombre, bio, enlace y highlights.
- **Post Preview** estilo Instagram con caption, hashtags, canción y likes.
- Carruseles, imágenes, videos/reels, posts fijados.
- Archivos adjuntos de Notion, enlaces externos y enlaces públicos de Canva.
- Modo claro/oscuro.

## Archivos a importar en Notion

1. `01_content_database.csv`
2. `02_info_bio.csv`
3. `03_highlights.csv`

Importa cada CSV como una base separada.

### Tipos recomendados: Content Database

| Propiedad | Tipo en Notion |
|---|---|
| Título | Título |
| Fecha de publicación | Fecha |
| Estado | Estado o Selección |
| Formato | Selección |
| Imagen | Selección |
| Archivos | Archivos y multimedia |
| Link | URL |
| Canva | URL |
| Pilar | Selección |
| Caption | Texto |
| Hashtags | Texto |
| Música | Texto |
| Likes | Número |
| Fijado | Casilla |
| Ocultar | Casilla |
| Orden | Número |

### INFO BIO

`Título` = Título; `Foto de perfil` = Archivos y multimedia; `Foto URL` y `Link` = URL; el resto = Texto.

### Highlights

`Título` = Título; cada `Highlight N Nombre` = Texto; cada `Highlight N Foto` = Archivos y multimedia; cada `Highlight N URL` = URL.

## Conexión

1. Crea una integración interna en Notion.
2. Dale permiso de lectura. Para Plan Grid, añade actualización de contenido.
3. Comparte las tres bases con la integración.
4. Copia el Data source ID de cada base.
5. Despliega esta carpeta en Vercel.
6. Añade en Vercel:

```text
NOTION_TOKEN=ntn_xxxxxxxxx
NOTION_CONTENT_SOURCE_ID=xxxxxxxx
NOTION_PROFILE_SOURCE_ID=xxxxxxxx
NOTION_HIGHLIGHTS_SOURCE_ID=xxxxxxxx
NOTION_DATE_PROPERTY=Fecha de publicación
```

7. Vuelve a desplegar.
8. En Notion escribe `/embed` y pega la URL pública de Vercel.

## Canva

El enlace debe ser público y permitir inserción. Cuando Canva bloquee el embed, utiliza una imagen exportada en `Archivos` o una URL directa en `Link`.

## Seguridad

El token solo debe guardarse como variable privada de Vercel. Nunca lo pegues en archivos públicos ni dentro de Notion.
