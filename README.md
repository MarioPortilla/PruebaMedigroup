# Prueba Tecnica Medigroup

Este es un sistema de gestion de inventario para medicamentos

## 🚀 Tecnologías

Este proyecto está construido principalmente con tecnologías web estándar.

* **HTML5:** Estructura y semántica de la aplicación.
* **CSS3:** Estilos y diseño (Bootstrap).
* **JavaScript (Vanilla JS / ES6+):** Lógica, manipulación del DOM y funcionalidades dinámicas.
* **Jquery :** Lógica, manipulación del DOM y funcionalidades dinámicas.

## 🌟 Características Principales

Lista de las funcionalidades más importantes de la aplicación.

* Muestra todos los registros de la base de datos con la información basica de medicamentos
* Mantiene información local de los registros y hace cambios a la base de datos por medio de llamadas api
* Cuenta con filtrado por nombre, fecha de caducidad, y categoria.
* Permite editar la información de los registros, así como tambien eliminar en caso de ser necesario

## 💻 Instalación y Uso

Sigue estos sencillos pasos para tener una copia funcional del proyecto en tu máquina local.

### Prerrequisitos

No necesitas instalar ningún software o dependencia especial para ejecutar este proyecto, aparte de un navegador web moderno.

### Clonar el Repositorio

1.  Clona el repositorio en tu máquina local:
    ```bash
    git clone https://github.com/MarioPortilla/PruebaMedigroup (https://aws.amazon.com/es/what-is/repo/)
    ```
2.  Navega al directorio del proyecto:
    ```bash
    cd PruebaMedigroup
    ```

### Ejecutar la Aplicación

Simplemente abre el archivo `index.html` con tu navegador web preferido.

> `Abrir con > [Navegador de tu elección]`

## ⚙️ Estructura del Proyecto

El proyecto está organizado para mantener una clara separación de responsabilidades (Separation of Concerns):

    ☼  index.html: Se encarga exclusivamente de la presentación de la información y la estructura de la interfaz.

    ☼  js/main.js: Contiene todo el código JavaScript, gestionando la interacción del usuario y la lógica funcional del sistema de manera independiente del HTML.

Aqui una representacion visual de como esta organizado el proyecto

pruebamedigroup/
├── assets/
├── css/
    └── styles.css
├── js/
    └── main.js
└── index.html