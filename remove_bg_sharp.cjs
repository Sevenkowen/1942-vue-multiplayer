const sharp = require('sharp');

async function removeWhite() {
  const imagePath = 'e:\\Antigravity\\public\\player.png';
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    if (r > 240 && g > 240 && b > 240) {
      data[i+3] = 0; // Set alpha to 0
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toFile('e:\\Antigravity\\public\\player_nobg.png');
  console.log("Done");
}

removeWhite();
