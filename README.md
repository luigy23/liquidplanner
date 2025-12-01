# 💧 Liquid Planner

**Liquid Planner** es una aplicación web de planificación diaria dinámica y estética, diseñada para rutinas de alto rendimiento. No es solo una lista de tareas, es un sistema fluido que se adapta a tu día, permitiéndote gestionar bloques de tiempo, imprevistos y rutinas específicas (Gym vs Skillion) con una interfaz premium y moderna.

![Liquid Planner Preview](./public/preview.png)
*(Nota: Asegúrate de añadir una captura de pantalla en `public/preview.png` o elimina esta línea)*

## ✨ Características Principales

*   **📅 Planificación Líquida**: Los bloques de tiempo se ajustan automáticamente. Si una tarea se retrasa, todo el horario se empuja hacia adelante.
*   **🔄 Rutinas Predefinidas**:
    *   **Gym Day**: Enfocado en entrenamiento físico y deep work.
    *   **Skillion Day**: Enfocado en desarrollo de habilidades y gestión.
*   **⚠️ Gestión de Caos**: Botón de "Imprevisto" para insertar urgencias (15, 30, 45, 60 min) y recalcular el día instantáneamente.
*   **🌙 Modo Sueño**: Finaliza tu día con una pantalla de desconexión y prepara la plantilla para mañana.
*   **👀 Vista "Mañana"**: Planifica el día siguiente sin afectar tu flujo actual.
*   **🎨 UI Premium**: Diseño oscuro (Dark Mode), glassmorphism, animaciones fluidas y paleta de colores semántica.
*   **💾 Persistencia Local**: Tus datos se guardan automáticamente en el navegador.

## 🛠️ Tecnologías Utilizadas

Este proyecto ha sido construido con las últimas tecnologías para asegurar rendimiento y escalabilidad:

*   **[React](https://react.dev/)**: Librería principal para la UI.
*   **[TypeScript](https://www.typescriptlang.org/)**: Para un código robusto y tipado.
*   **[Vite](https://vitejs.dev/)**: Build tool ultrarrápido.
*   **[Tailwind CSS v4](https://tailwindcss.com/)**: Framework de utilidades para el diseño (configurado con `@tailwindcss/vite`).
*   **[Lucide React](https://lucide.dev/)**: Iconografía moderna y ligera.

## 🚀 Instalación y Uso Local

Sigue estos pasos para correr el proyecto en tu máquina:

1.  **Clonar el repositorio**:
    ```bash
    git clone <tu-repositorio-url>
    cd liquidplanner
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Correr el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    Abre `http://localhost:5173` en tu navegador.

## 📦 Construcción para Producción

Para generar los archivos estáticos optimizados para producción:

```bash
npm run build
```
Los archivos se generarán en la carpeta `dist/`.

## ☁️ Despliegue en Vercel

Este proyecto está optimizado para desplegarse en [Vercel](https://vercel.com/) con cero configuración:

1.  Sube tu código a GitHub/GitLab/Bitbucket.
2.  Importa el repositorio en Vercel.
3.  Vercel detectará automáticamente que es un proyecto **Vite**.
4.  La configuración de build por defecto es correcta:
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  Haz clic en **Deploy**.

## 📂 Estructura del Proyecto

```
liquidplanner/
├── src/
│   ├── components/
│   │   └── LiquidPlanner.tsx  # Componente principal con toda la lógica
│   ├── App.tsx                # Punto de entrada de la aplicación
│   ├── index.css              # Estilos globales y Tailwind
│   └── main.tsx               # Montaje de React
├── index.html                 # HTML base
├── vite.config.ts             # Configuración de Vite + Tailwind
└── package.json               # Dependencias y scripts
```

---

Hecho con 💙 para constructores de alto rendimiento.
