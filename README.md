# Redes en movimiento · Conmutación de paquetes

Página académica en español, preparada para GitHub Pages. Material complementario de la exposición de Fundamentos de Redes I, Universidad Nacional Jorge Basadre Grohmann.

## Verla en tu computadora

Abre `index.html` con Chrome, Edge, Firefox o Safari. Las simulaciones y el cuestionario también funcionan al abrir el archivo directamente, sin instalar programas ni ejecutar comandos. Conserva las carpetas `assets` y `material` junto al archivo.

## Publicarla en GitHub Pages

1. Descomprime `conmutacion-paquetes-github.zip` en tu computadora.
2. En GitHub, abre tu repositorio o crea uno público, por ejemplo `conmutacion-paquetes`. Con GitHub Free, Pages está disponible para repositorios públicos.
3. En la pestaña **Code**, elige **Add file → Upload files**. Arrastra el contenido descomprimido: `index.html`, `README.md`, la carpeta `assets` y la carpeta `material`. Confirma con **Commit changes**. Si acabas de crear el repositorio vacío, puedes usar el enlace **uploading an existing file**.
4. Comprueba que **index.html esté en la raíz del repositorio**, al mismo nivel que `README.md`. No subas solo el ZIP ni dejes todos los archivos dentro de otra carpeta. `.nojekyll` y `.gitignore` están incluidos para quienes suban con Git; su ausencia al arrastrar archivos ocultos no impide publicar esta página.
5. Abre **Settings → Pages**. En **Build and deployment → Source**, selecciona **Deploy from a branch**.
6. En **Branch**, selecciona la rama donde subiste los archivos (normalmente `main`) y la carpeta **/(root)**. Haz clic en **Save**.
7. Espera a que termine la publicación. En **Settings → Pages** aparecerá la URL. La pestaña **Actions** muestra el estado del despliegue.
8. Abre la URL en tu celular o en una ventana privada. Comprueba las simulaciones y el botón de la exposición; luego comparte ese enlace con tu profesora.

Para un repositorio de proyecto, la dirección suele tener esta forma:

```text
https://TU-USUARIO.github.io/conmutacion-paquetes/
```

Es un **ejemplo de formato**, no una URL ya publicada. GitHub mostrará tu dirección real. Si el repositorio se llama exactamente `TU-USUARIO.github.io`, la página se publica en la raíz de ese dominio, sin el nombre del repositorio al final.

Las actualizaciones se publican al subir cambios a la misma rama. Si aparece un error 404, revisa que `index.html` esté en la raíz, que elegiste la rama correcta y que el despliegue terminó.

Guías oficiales de GitHub:

- [Configurar la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Crear un sitio de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

## Archivos

```text
index.html                 Contenido y estructura de la página
assets/styles.css          Diseño adaptable a celular y computadora
assets/app.js              Simulaciones, capas, navegación y cuestionario
assets/network-core.js     Grafo y algoritmos de mínimo coste
assets/favicon.svg         Icono de la página
material/exposicion.pdf    PDF original de las 29 diapositivas del equipo
README.md                  Esta guía
.nojekyll                  Desactiva Jekyll cuando se incluye en Git
.gitignore                 Excluye archivos del sistema operativo
```

No necesita Node.js, dependencias externas, claves, base de datos, formularios de registro ni servicios de pago. Todos los enlaces internos son relativos, por lo que funciona también bajo la subcarpeta de un repositorio de GitHub Pages. No envía las respuestas del cuestionario ni utiliza analítica.

## Contenido y fuentes

- Principios: cabecera y datos, almacenamiento y reenvío, comparación de circuitos, datagramas y circuitos virtuales; funcionamiento externo e interno.
- Laboratorio: recorrido conceptual de tres paquetes, control manual y reproducción; experimento sobre tamaño de paquete.
- Encaminamiento: estrategias estática, inundaciones, aleatoria y adaptable; evolución del caso ARPANET.
- Dijkstra y Bellman-Ford: cálculos ejecutados en el navegador, origen seleccionable y rutas por paso sobre los costes dirigidos de la figura 10.6.
- X.25: capas, llamada virtual, multiplexación, flujo, errores, bits D/M y recuperación.
- Ocho preguntas con explicación, glosario, referencias y equipo expositor.

Texto base: William Stallings, *Comunicaciones y redes de computadores*, capítulo 10, «Conmutación de paquetes», pp. 285–325 del extracto facilitado como `cap10stalling.pdf`. En particular: figura 10.2 (tamaño), figura 10.6 (grafo), tabla 10.1 (comparación), tabla 10.4 y apéndice 10A (algoritmos). El extracto no permite confirmar la edición, por lo que no se ha inventado ese dato.

La secuencia temática y los nombres proceden de `Conmutacion_de_paquetes.pptx.pdf`. Se incluye una copia sin modificar como `material/exposicion.pdf`. No se incluye el PDF del libro. Los diagramas del sitio están redibujados y el texto está sintetizado.

Se precisan dos simplificaciones de la exposición: el circuito virtual es una ruta lógica sin enlace físico exclusivo; la congestión también puede provocar pérdidas. Las referencias históricas del capítulo se presentan como tales, sin generalizarlas a todas las redes actuales.

## Supuestos de los modelos

El recorrido de paquetes es una animación por estados, sin escala temporal ni implementación de un protocolo. El ejemplo de datagramas ilustra una posible llegada P2, P3, P1; no predice ese orden en una red real.

Para el experimento de tamaño: mensaje de 40 octetos, cabecera de 3 octetos por paquete, 3 enlaces de igual velocidad, paquetes iguales y reenvío al recibir cada paquete completo. Se ignoran propagación, procesamiento y tráfico ajeno. El tiempo en unidades de transmisión de un octeto es `(40/k + 3) × (3 + k − 1)`: 129, 92, 77 y 84 para 1, 2, 5 y 10 paquetes.

El grafo es dirigido: una etiqueta `ida / vuelta` indica el coste del nodo menor al mayor y en sentido inverso. Dijkstra desempata por número de nodo. Bellman-Ford usa rondas síncronas con los valores de la ronda anterior y conserva cada camino de esa ronda. Los costes son positivos y estáticos. La columna **Sig.** muestra el primer salto de la ruta conocida, que solo debe considerarse final al terminar el cálculo. La versión distribuida real puede intercambiar estimaciones con sus vecinos de forma asíncrona.

## Personalizar

Edita `index.html` para cambiar textos, nombres o referencias. Los colores y tamaños están en `assets/styles.css`. Las preguntas están en el arreglo `questions` de `assets/app.js`. Si reemplazas el PDF, conserva su ruta o actualiza el enlace. Los cambios se reflejan al volver a abrir o recargar la página.
