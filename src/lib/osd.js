const layersColorPalette = [
  "red",
  "green",
  "blue",
  "yellow",
  "purple",
  "pink",
  "red",
  "green",
  "blue",
  "yellow",
  "purple",
  "pink",
];

export class OpenSeadragonSlideViewer {
  constructor(options) {
    this._options = options;

    this.annLayers = {};
    this.imgLayers = [];

    // Initialize openseadragon
    this._osd = new OpenSeadragon.Viewer({
      id: this._options.id,
      showNavigationControl: false,
      defaultZoomLevel: 0.5,
      minZoomLevel: 0.5,
      visibilityRatio: 1,
      constrainDuringPan: false,
      minPixelRatio: 1,
      rotationIncrement: 0,
      preload: true,
    });

    this._osd.addHandler("animation-finish", () => {
      this._options.onCenterChange?.(this.getCurrentViewportPosition());
    });

    this._osd.addHandler("update-viewport", () => {
      this._drawDetections();
    });

    this._osd.addHandler("open", () => {
      var tiledImage = this._osd.world.getItemAt(0);
      tiledImage.addHandler("fully-loaded-change", () => {
        if (!this._ctx?.isLoaded) {
          this._options.onFullyLoaded?.();
          if (this._ctx !== null) this._ctx.isLoaded = true;
        }
      });

      this.updateLayers();

      if (this._ctx?.startingPos) this.moveTo(this._ctx?.startingPos);
    });

    this._osd.addHandler("tile-loaded", ({ tile, tiledImage, image }) => {
      // Ignore the main tiledImage (the slide image)
      if (tiledImage === this.tiledImage) return;

      // Create a new canvas to draw manually the tile.
      var canvas = window.document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      if (!context) return;
      if (tiledImage?.source?.layerInfo) {
        const layerInfo = tiledImage?.source.layerInfo;
        context.drawImage(image, 0, 0);
        context.globalAlpha = 0.5;
        context.globalCompositeOperation = "source-in";

        const color = layerInfo.color;
        context.fillStyle = color;

        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.globalAlpha = 1;
      }

      tile._renderedContext = context;
    });

    // Use the image we generated from tile-loaded
    this._osd.addHandler("tile-drawing", ({ tile, tiledImage, rendered }) => {
      if (tiledImage === this.tiledImage) return;

      const ctx = tile?._renderedContext;
      if (!ctx) return;

      const imgData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      rendered.putImageData(imgData, 0, 0);
    });

    // detections
    this._osd.addHandler("viewport-change", () => {
      // If we are moving too far away, schedule a new fetch
      this._fetchDetections();
    });
  }

  get tiledImage() {
    return this._osd?.world.getItemAt(0);
  }

  getCurrentViewportPosition() {
    const center = this._osd?.viewport.getCenter(false);
    const mpp = this._ctx?.info.mpp;
    const microns = this.tiledImage.viewportToImageCoordinates(center)?.times(mpp);
    const z = this._osd?.viewport.getZoom(false);
    return { ...microns, z };
  };

  moveTo(svp) {
    const viewport = this._osd.viewport
    if (!this._ctx)
      return false;

    const mpp = this._ctx.info.mpp;
    const center = this.tiledImage.imageToViewportCoordinates(svp.x / mpp, svp.y / mpp);
    viewport.zoomTo(svp.z, center, true);
    // The zoomTo is imprecise in keeping the center fixed.
    // For this reason we add a panTo.
    viewport.panTo(center, true);
    return true;
  }

  // Forces a redraw.
  updateLayers() {
    // If we have also to toggle the detection layer, we need to redraw.
    for (let i = 0; i < this._ctx.info.layers.length; ++i) {
      const layer = this._ctx.info.layers[i];
      if (layer.type === "segmentation") {
        const opacity = layer.enabled ? 1.0 : 0.0;
        this._osd.world.getItemAt(layer.idx).setOpacity(opacity);
      }
    }
    this._osd.forceRedraw();
  }

  async open(config) {
    let { url, startingPos } = config;
    // First fetch the slide info metadata.
    var info = await fetch(`${url}/info/metadata.json`).then((response) => response.json()).catch((error) => false);

    // If there's no info, we can't display the slide.
    if (!info) return false;

    // Use TiledImage object, store it in array of segmentation and detection layers.
    info.layers = info.layers ? info.layers : [];
    let detections = {
      abortController: new AbortController(),
    };
    let ctx = {
      url: url,
      startingPos: startingPos,
      isLoaded: false,
      info: info,
      detections: detections,
      detectionsLabelsToLayerId: {},
    };

    console.log(info);

    const slideSource = {
      height: ctx.info.height,
      width: ctx.info.width,
      tileSize: ctx.info.tileSize,
      crossOriginPolicy: "Anonymous",
      getTileUrl: (level, x, y) => {
        return `${ctx.url}/tiles/${level}/${x}_${y}.jpeg`;
      },
    };
    this.imgLayers = [slideSource];
    var osdLayers = [slideSource];

    // Load the annotation layers
    this.annLayers = {};
    for (let idx = 0; idx < info.layers.length; ++idx) {
      const layer = info.layers[idx];

      if (layer.type !== "segmentation") {
        ctx.detectionsLabelsToLayerId[layer.label] = idx;
        continue;
      }

      layer.enabled = false;
      layer.color = layersColorPalette[idx];

      layer.idx = osdLayers.length;
      const newSource = {
        height: ctx.info.height,
        width: ctx.info.width,
        tileSize: ctx.info.tileSize,
        getTileUrl: (level, x, y) => {
          return `${ctx.url}/layers/${idx}/tiles/${level}/${x}_${y}.png`;
        },
        crossOriginPolicy: "Anonymous",
        layerInfo: layer,
      };
      this.annLayers[layer.idx] = newSource;
      osdLayers.push(newSource);
    }

    this._osd.open(osdLayers);
    this._ctx = ctx;
    return true;
  }

  _canDisplayDetections() {
    if (!this._ctx) return false;
    const imageViewportZoom = this.tiledImage.viewportToImageZoom(
      this._osd.viewport.getZoom()
    );
    return this._ctx.info.mpp / imageViewportZoom < 1.2;
  }

  // Event that fires whenever we change the viewport center.
  // Used to update the url location as well as to fetch proper
  // annotations.
  _fetchDetections(force = false) {
    if (!this._canDisplayDetections() || !this._ctx) return false;

    let detections = this._ctx.detections;
    const viewer = this._osd;

    const mpp = this._ctx.info.mpp;
    const viewportBounds = viewer.viewport.getBounds();
    const imageViewportBounds1 = this.tiledImage.viewportToImageCoordinates(
      viewportBounds.x,
      viewportBounds.y
    );
    const imageViewportBounds2 = this.tiledImage.viewportToImageCoordinates(
      viewportBounds.x + viewportBounds.width,
      viewportBounds.y + viewportBounds.height
    );
    const extraMicrons = 50;
    const updateThreshold = extraMicrons / 2;

    const x1 = imageViewportBounds1.x * mpp - extraMicrons;
    const y1 = imageViewportBounds1.y * mpp - extraMicrons;
    const x2 = imageViewportBounds2.x * mpp + extraMicrons;
    const y2 = imageViewportBounds2.y * mpp + extraMicrons;

    const new_extent = { x1, y1, x2, y2 };

    if (detections.extent && !force) {
      const updateDetections =
        Math.abs(new_extent.x1 - detections.extent.x1) > updateThreshold ||
        Math.abs(new_extent.y1 - detections.extent.y1) > updateThreshold ||
        Math.abs(new_extent.x2 - detections.extent.x2) > updateThreshold ||
        Math.abs(new_extent.y2 - detections.extent.y2) > updateThreshold;
      if (!updateDetections) return false;
    }
    detections.extent = new_extent;

    if (
      detections.abortController &&
      !detections.abortController.signal.aborted
    )
      detections.abortController.abort();

    let abortController = new AbortController();
    // Fetch all the shapes.
    const promise = fetch(
      `${this._ctx.url}/layers/all/shapes/@${x1},${x2},${y1},${y2}`,
      { signal: abortController.signal }
    )
      .then((response) => response.json())
      .catch(() => { })
      .then((data) => {
        if (!this._ctx) return false;
        if (data) {
          this._ctx.detections.boxes = data;
          window.requestAnimationFrame(() => this._drawDetections());
        }
      });

    detections.abortController = abortController;
    return promise;
  }

  // Draw fetched detections on the overlay.
  _drawDetections() {
    const detections = this._ctx?.detections;
    const canvas = this._osd.drawer.canvas;
    const ctx2d = canvas.getContext("2d");
    if (ctx2d === null) return false;
    // If there are no detections or low zoom level,
    // skip drawing.
    if (!this._canDisplayDetections() || !detections) return false;

    const viewer = this._osd;
    const viewportZoom = viewer.viewport.getZoom(true);
    const imageViewportZoom = this.tiledImage.viewportToImageZoom(viewportZoom);
    const viewportBounds = viewer.viewport.getBounds(true);
    const viewportImageRectangle =
      this.tiledImage.viewportToImageRectangle(viewportBounds);
    const mpp = this._ctx?.info.mpp;

    // We define the linewidth resolution in pixels at the
    // highest resolution level.
    const lineWidthBaseLevelPixels = 5;
    ctx2d.lineWidth = lineWidthBaseLevelPixels * imageViewportZoom;

    const getLayerFromLabel = (label) => {
      const idx = this._ctx?.detectionsLabelsToLayerId[label];
      return this._ctx?.info.layers[idx];
    };

    // Iterate over the detection boxes.
    detections.boxes?.forEach((item, _) => {
      // First convert from microns to level 0 pixels (divide by mpp).
      const p1 = new OpenSeadragon.Point(
        item.bbox[0] / mpp,
        item.bbox[2] / mpp
      );
      const p2 = new OpenSeadragon.Point(
        item.bbox[1] / mpp,
        item.bbox[3] / mpp
      );

      // Remap the viewport image coordinates to the actual viewport pixel coordinates.
      const px = new OpenSeadragon.Point(
        p1.x - viewportImageRectangle.x,
        p2.x - viewportImageRectangle.x
      ).times(canvas.width / viewportImageRectangle.width);
      const py = new OpenSeadragon.Point(
        p1.y - viewportImageRectangle.y,
        p2.y - viewportImageRectangle.y
      ).times(canvas.height / viewportImageRectangle.height);

      const layer = getLayerFromLabel(item.type);
      if (!layer.enabled) return;

      // Draw on raw viewport pixel coordinates.
      ctx2d.beginPath();
      ctx2d.strokeStyle = "red";
      const width = px.y - px.x;
      const height = py.y - py.x;
      ctx2d.rect(px.x, py.x, width, height);
      ctx2d.stroke();
    });
  }
}
