/**
 * Zoom Controller
 * Manages zoom functionality for the table
 */

export function createZoomController(elements) {
  const { tableContainer, zoomOutBtn, zoomInBtn, zoomLabel } =
    elements;

  let zoom = 1;

  function applyZoom() {
    const zoomTarget = tableContainer
      ? tableContainer.querySelector("#tableZoomTarget")
      : null;
    if (!zoomTarget) return;
    zoomTarget.style.transform = `scale(${zoom})`;
    if (zoomLabel)
      zoomLabel.textContent = Math.round(zoom * 100) + "%";
  }

  function reset() {
    zoom = 1;
    applyZoom();
  }

  function init() {
    zoomInBtn?.addEventListener("click", () => {
      zoom = Math.min(2, zoom + 0.1);
      applyZoom();
    });

    zoomOutBtn?.addEventListener("click", () => {
      zoom = Math.max(0.5, zoom - 0.1);
      applyZoom();
    });
  }

  return {
    init,
    reset,
    apply: applyZoom,
  };
}
