const basePath = process.cwd();
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const fs = require("fs");

const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;

const format = {
  width: 1024,
  height: 1024,
};

const layerConfiguration = {
  growEditionSizeTo: 5,
  layersOrder: [
    //{ name: "Background" },
    { name: "Back" },
    { name: "Body" },
    { name: "Bristle" },
    { name: "Clothing" },
    { name: "Accessories" },
    { name: "Eyes" },
    { name: "Glasses" },
    { name: "Head" },
    { name: "Face accessories" },
  ],
};

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

const loadLayerImg = async (_layer) => {
  try {
    return new Promise(async (resolve) => {
      console.log(_layer);
      const image = await loadImage(`${_layer.selectedElement.path}`);
      resolve({ layer: _layer, loadedImage: image });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const drawElement = (_renderObject, _index) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;

  ctx.drawImage(_renderObject.loadedImage, 0, 0, format.width, format.height);
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const rarityDelimiter = "#";
const cleanName = (_str) => {
  const nameWithoutExtension = _str.slice(0, -4);
  const nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getRarityWeight = (_str) => {
  const nameWithoutExtension = _str.slice(0, -4);
  const weight = Number(nameWithoutExtension.split(rarityDelimiter).pop());
  return isNaN(weight) ? 1 : weight;
};

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layer, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layer.name}/`),
    name: layer.name,
    blend: "source-over",
    opacity: 1,
    bypassDNA: false,
  }));

  return layers;
};

const constructLayersFromMetadata = (metadata, layers = []) => {
  return layers.map((layer) => {
    const selectedElement = layer.elements.find(
      (e) => e.name === metadata[layer.name]
    );

    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
};

const layers = layersSetup(layerConfiguration.layersOrder);
const createImageFromMetaData = async (mint, metadata) => {
  ctx.clearRect(0, 0, format.width, format.height);

  const layersWithSelectedElements = constructLayersFromMetadata(
    metadata,
    layers
  );

  const loadedElements = [];
  layersWithSelectedElements.forEach((layer) => {
    loadedElements.push(loadLayerImg(layer));
  });

  const renderObjectArray = await Promise.all(loadedElements);
  renderObjectArray.forEach((renderObject, index) => {
    drawElement(renderObject, index);
  });

  saveImage(mint);
};

module.exports = { createImageFromMetaData };
