# design.md

## Propósito

Este documento define las reglas y criterios que deben respetarse al diseñar o rediseñar páginas de la app de gimnasio. Su objetivo es mantener coherencia visual, consistencia funcional y una experiencia de usuario sólida a medida que se agregan o mejoran pantallas.

La app ya existe y funciona. Por lo tanto, todo nuevo diseño debe entenderse como parte de un sistema en evolución, no como una pieza aislada.

---

## 1. Principio general del producto

La app es una app de gimnasio/fitness enfocada en:
- organizar rutinas,
- iniciar entrenamientos,
- registrar ejercicios, sets, peso y repeticiones,
- ver historial,
- analizar métricas,
- acceder a configuraciones y opciones complementarias.

### Objetivo del diseño
La app debe sentirse:
- premium,
- moderna,
- oscura,
- deportiva,
- minimalista,
- clara,
- rápida de usar,
- visualmente atractiva,
- funcional durante un entrenamiento real.

### Regla principal
Antes de diseñar cualquier página nueva, preguntarse:

1. ¿Qué necesita hacer el usuario en esta pantalla?
2. ¿Cuál es la acción principal?
3. ¿Qué información debe entender en menos de 3 segundos?
4. ¿Cómo se integra esta pantalla con el resto del sistema?

---

## 2. Filosofía del rediseño

Como la app ya existe, no se debe diseñar “como si fuera una app nueva”.  
El criterio correcto es:

- respetar la lógica del producto,
- mejorar la claridad,
- mejorar la jerarquía visual,
- simplificar interacciones,
- modernizar la apariencia,
- unificar componentes,
- mantener consistencia con las pantallas ya definidas.

### Esto significa:
- no cambiar patrones por capricho,
- no inventar estructuras totalmente distintas si el flujo actual ya funciona,
- no romper la navegación mental del usuario,
- no sacrificar usabilidad por estética.

---

## 3. Referencias visuales base

La app mezcla dos referencias:

### Referencia 1 (principal)
Se toma como base para:
- look general oscuro,
- tarjetas,
- estructura de pantallas de entrenamiento,
- módulos de rutinas,
- historial,
- inputs de sets, peso y reps,
- estilo deportivo serio y profesional.

### Referencia 2 (secundaria)
Se toma como referencia para:
- barra de navegación inferior,
- gráficos,
- métricas visuales,
- home superior con días de la semana,
- sensación más moderna y suave.

### Regla
Si hay duda entre dos estilos, priorizar la referencia 1 para estructura general y la referencia 2 para navegación y módulos visuales de progreso.

---

## 4. Identidad visual

### Colores
- Fondo principal: negro profundo o gris muy oscuro.
- Superficies secundarias: gris oscuro.
- Color primario: naranja intenso.
- Texto principal: blanco suave.
- Texto secundario: gris claro.
- Bordes: muy sutiles, oscuros o apenas contrastados.

### Uso del naranja
El naranja se usa para:
- botones principales,
- elemento activo,
- ítem seleccionado,
- CTA principal,
- gráficos y progreso,
- métricas destacadas,
- iconografía activa,
- detalles de énfasis.

### Lo que no hay que hacer
- no usar demasiados colores secundarios,
- no volver la app “colorida”,
- no usar azules, verdes o violetas de forma dominante,
- no romper la identidad oscura + naranja.

---

## 5. Tono y personalidad del producto

La app debe transmitir:
- disciplina,
- progreso,
- energía,
- control,
- claridad,
- constancia.

No debe sentirse:
- infantil,
- gamer exagerada,
- recargada,
- confusa,
- decorativa sin función.

---

## 6. Estructura global de navegación

La navegación principal tiene 4 secciones:
1. Inicio
2. Rutinas
3. Historial
4. Más

### Reglas de navegación
- La barra inferior debe permanecer consistente en todas las páginas principales.
- El ítem activo debe estar claramente marcado.
- El botón central flotante debe tener una acción rápida relacionada al entrenamiento.
- La sección “Más” agrupa pantallas secundarias como Métricas, Respaldo, Perfil, Configuración, Objetivos y Ayuda.

### Antes de diseñar una nueva página
Definir primero:
- ¿es una página principal?
- ¿es una subpágina de “Más”?
- ¿qué jerarquía ocupa?
- ¿cómo llega el usuario?
- ¿cómo vuelve?

---

## 7. Jerarquía de información

Cada pantalla debe tener jerarquía clara.

### Orden recomendado
1. Acción principal
2. Información crítica
3. Información complementaria
4. Acciones secundarias

### Regla
Lo más importante de una pantalla debe ser visible sin esfuerzo.  
El usuario no debe “buscar” qué hacer.

### Ejemplos
- En Home: lo más importante es la rutina de hoy + botón iniciar rutina.
- En Rutinas: lo más importante es ver rápidamente las rutinas disponibles.
- En Historial: lo más importante es identificar entrenamientos pasados de forma rápida.
- En Métricas: lo más importante es entender progreso y tendencias.

---

## 8. Sistema de componentes

Antes de diseñar una nueva página, revisar si puede resolverse reutilizando componentes existentes.

### Componentes base
- header de página,
- tarjetas de resumen,
- tarjetas de rutina,
- tarjetas de historial,
- chips/filtros,
- botones principales,
- botones secundarios,
- inputs numéricos,
- tablas de sets,
- módulos de métricas,
- bloques de gráficos,
- filas de opciones,
- barra de navegación inferior.

### Regla
Si un componente ya existe, se reutiliza o se adapta.  
No diseñar componentes nuevos innecesariamente.

### Preguntas previas
- ¿este contenido puede usar una tarjeta existente?
- ¿este CTA ya tiene un patrón definido?
- ¿el estilo del módulo respeta el sistema?

---

## 9. Reglas de layout

### Espaciado
- Usar espaciados consistentes.
- No saturar pantallas.
- Mantener aire visual entre tarjetas y secciones.
- Evitar bloques demasiado pegados.

### Bordes y radios
- Todas las tarjetas y botones deben tener un lenguaje de bordes consistente.
- No mezclar muchos estilos de esquinas.

### Densidad
- La interfaz debe ser clara, pero compacta en lo necesario.
- Recordar que es una app para usar incluso durante un entrenamiento.

### Regla
La pantalla debe sentirse ordenada aunque tenga bastante información.

---

## 10. Reglas de copywriting UI

### Estilo del texto
- Corto
- Claro
- Directo
- Funcional

### Evitar
- textos largos innecesarios,
- párrafos explicativos en pantallas operativas,
- etiquetas ambiguas.

### Ejemplos buenos
- Iniciar rutina
- Ver detalle
- Agregar set
- Agregar ejercicio
- Este mes
- Último entrenamiento
- Volumen semanal

---

## 11. Reglas para nuevas páginas

Antes de diseñar una página nueva, completar mentalmente este checklist:

### Checklist funcional
- ¿Cuál es el objetivo de la página?
- ¿Qué tarea principal cumple?
- ¿Qué información necesita mostrar?
- ¿Qué CTA principal tiene?
- ¿Qué acciones secundarias tiene?
- ¿Qué estados posibles existen?

### Checklist de consistencia
- ¿Respeta la paleta visual?
- ¿Respeta el sistema de tarjetas?
- ¿Respeta la tipografía?
- ¿Respeta la barra de navegación si corresponde?
- ¿Respeta la jerarquía general de la app?
- ¿Parece parte del mismo producto?

### Checklist de UX
- ¿Se entiende en menos de 3 segundos?
- ¿La acción principal está clara?
- ¿Hay demasiada información?
- ¿La pantalla puede usarse con una mano?
- ¿La lectura visual fluye bien de arriba hacia abajo?

---

## 12. Estados que siempre hay que contemplar

Toda página nueva debería considerar estos estados si aplican:

- estado normal,
- estado vacío,
- estado cargando,
- estado con error,
- estado sin conexión,
- estado con mucho contenido,
- estado con poco contenido,
- estado inicial para usuarios nuevos.

### Ejemplo
Si se diseña una página de historial:
- historial con datos,
- historial vacío,
- filtros activos,
- sin resultados para el filtro,
- error al cargar.

---

## 13. Métricas y gráficos

Los gráficos son importantes, pero no deben romper la limpieza del diseño.

### Reglas
- usar gráficos simples y modernos,
- pocos ejes visibles,
- prioridad en legibilidad,
- color primario naranja,
- mostrar tendencias de forma clara,
- evitar decoración innecesaria.

### Tipos sugeridos
- línea,
- barras,
- anillos de progreso,
- mini charts.

### Regla
Los gráficos deben complementar la app, no competir visualmente con la acción principal.

---

## 14. Home: criterio rector

La Home es la pantalla guía del producto.

### Debe responder rápido:
- qué día es,
- qué rutina toca hoy,
- qué hacer ahora,
- cómo vengo entrenando.

### Siempre priorizar en Home
1. rutina actual,
2. CTA iniciar rutina,
3. actividad semanal,
4. resumen útil,
5. métricas rápidas.

Si se agrega algo nuevo a Home, debe justificar por qué merece ocupar espacio.

---

## 15. Rutinas: criterio rector

La pantalla de Rutinas debe enfocarse en:
- listar,
- entender,
- entrar,
- iniciar.

### No debe convertirse en
- una pantalla de configuración compleja,
- una pantalla sobrecargada,
- una mezcla confusa de rutinas, métricas y ajustes.

---

## 16. Historial: criterio rector

La pantalla de Historial debe enfocarse en:
- escaneo rápido,
- comparación,
- revisión de entrenamientos pasados.

### Regla
Los datos deben leerse fácilmente.  
No esconder la información importante.

---

## 17. Más: criterio rector

La sección “Más” agrupa módulos secundarios.

### Debe sentirse como:
- un centro de control,
- limpio,
- ordenado,
- consistente.

### Debe incluir de forma clara
- Métricas,
- Respaldo,
- Configuración,
- Perfil,
- Objetivos,
- Ayuda.

---

## 18. Accesibilidad y usabilidad

Aunque el foco sea estético, toda pantalla debe considerar:

- contraste suficiente,
- tamaño legible de textos,
- botones tocables cómodamente,
- iconos entendibles,
- estados activos claros,
- buena separación entre elementos interactivos.

### Regla
Nunca sacrificar claridad por estilo.

---

## 19. Qué hacer antes de aprobar una nueva pantalla

Antes de dar una pantalla por buena, revisar:

1. ¿Se ve como parte del mismo sistema?
2. ¿Respeta la identidad dark + naranja?
3. ¿La acción principal está clara?
4. ¿Tiene una jerarquía visual fuerte?
5. ¿Usa componentes consistentes?
6. ¿Se siente premium?
7. ¿Es usable durante una situación real de entrenamiento?
8. ¿Mantiene continuidad con las otras páginas?

Si alguna de estas respuestas es “no”, la pantalla no está lista.

---

## 20. Regla final

Toda nueva página, módulo o componente debe diseñarse como parte de un sistema vivo, coherente y escalable.

La prioridad siempre es:
1. claridad,
2. consistencia,
3. utilidad,
4. estética.

La app tiene que verse muy bien, pero sobre todo tiene que sentirse clara, natural y sólida.