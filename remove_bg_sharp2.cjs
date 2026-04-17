const sharp = require('sharp');

async function removeBg() {
  const imagePath = 'e:\\Antigravity\\public\\player_animated.png';
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    // Remove if close to 22 22 30
    if (Math.abs(r - 22) < 10 && Math.abs(g - 22) < 10 && Math.abs(b - 30) < 10) {
      data[i+3] = 0; // Set alpha to 0
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toFile('e:\\Antigravity\\public\\player2_nobg.png');
  console.log("Done");
}

removeBg();
