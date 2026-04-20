Eres un auditor de seguridad senior. Revisa todo el codebase y crea un plan para implementar los siguientes fixes:

## 1. RATE LIMITING
- Añade rate limiting en todas las rutas de API, endpoints de autenticación y envíos de formularios
- Usa la librería adecuada para el stack
- Aplica límite por IP como base, y por usuario cuando esté autenticado

## 2. API KEYS EXPUESTAS
- Escanea todo el codebase en busca de secrets hardcodeados: API keys, tokens, contraseñas o connection strings
- Elimínalos y reemplázalos por `process.env.NOMBRE_VARIABLE`
- Añade cada variable a `.env.example` con un placeholder y descripción
- Asegúrate de que `.env` está en `.gitignore`
- Que ningún secret se exponga en `console.log` o mensajes de error

## 3. PROTECCIÓN CONTRA INYECCIONES
- Reemplaza cualquier concatenación de strings en queries SQL por consultas parametrizadas o métodos del ORM — nunca pases input del usuario a `.raw()` o equivalente
- Valida y sanitiza todos los inputs de formularios en el servidor con `zod`, `yup` o `joi`
- No uses `dangerouslySetInnerHTML` ni `innerHTML` con contenido sin sanitizar — usa DOMPurify si es necesario
- Añade los headers `Content-Security-Policy`, `X-Content-Type-Options` y `X-Frame-Options`