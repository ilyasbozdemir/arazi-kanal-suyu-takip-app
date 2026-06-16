const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
const png2icons = require('png2icons');

const sourceImg = 'C:/Users/ilyas/.gemini/antigravity/brain/300081a4-0071-41f0-a308-178697107850/app_icon_1781600424098.png';
const resPng = path.join(__dirname, '../resources/icon.png');
const buildPng = path.join(__dirname, '../build/icon.png');
const buildIco = path.join(__dirname, '../build/icon.ico');
const buildIcns = path.join(__dirname, '../build/icon.icns');

async function main() {
  try {
    // Create folders if they don't exist
    fs.mkdirSync(path.dirname(resPng), { recursive: true });
    fs.mkdirSync(path.dirname(buildPng), { recursive: true });

    console.log('Reading source image (JPEG under the hood) via Jimp...');
    const image = await Jimp.read(sourceImg);

    console.log('Writing clean standard PNG files...');
    // Jimp automatically converts format based on target extension when writing
    await image.write(resPng);
    await image.write(buildPng);
    console.log('Successfully wrote standard PNG to resources/icon.png and build/icon.png');

    console.log('Reading standard PNG buffer...');
    const pngBuffer = fs.readFileSync(buildPng);

    console.log('Converting standard PNG to ICO...');
    const ico = png2icons.createICO(pngBuffer, png2icons.BICUBIC, 0, false);
    if (ico) {
      fs.writeFileSync(buildIco, ico);
      console.log('Successfully created build/icon.ico');
    } else {
      console.error('Failed to create ICO data');
    }

    console.log('Converting standard PNG to ICNS...');
    const icns = png2icons.createICNS(pngBuffer, png2icons.BICUBIC, 0, false);
    if (icns) {
      fs.writeFileSync(buildIcns, icns);
      console.log('Successfully created build/icon.icns');
    } else {
      console.error('Failed to create ICNS data');
    }

    console.log('Icon processing completed successfully!');
  } catch (e) {
    console.error('An error occurred during icon build:', e);
    process.exit(1);
  }
}

main();
