const { createImageFromMetaData } = require("./createImageFromMetadata");
const fs = require("fs");
const basePath = process.cwd();

const buildDir = `${basePath}/build`;
const metadataDir = `${basePath}/metadata`;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/images`);
};

const getMetadataMap = () => {
  return fs
    .readdirSync(metadataDir)
    .filter((item) => item.includes(".json"))
    .reduce((_metadataMap, filename) => {
      const metadata = JSON.parse(
        fs.readFileSync(`${metadataDir}/${filename}`)
      );

      return {
        ..._metadataMap,
        [filename]: metadata.attributes.reduce(
          (_accumulator, { trait_type, value }) => {
            return {
              ..._accumulator,
              [trait_type]: value,
            };
          },
          {}
        ),
      };
    }, {});
};

(async () => {
  buildSetup();

  const metadataMap = getMetadataMap();

  console.log(`Generating ${Object.keys(metadataMap).length} images...`);

  for (const mint in metadataMap) {
    if (Object.hasOwnProperty.call(metadataMap, mint)) {
      const metadata = metadataMap[mint];

      await createImageFromMetaData(mint, metadata);
    }
  }

  console.log("DONE");
})();
