const Jimp = require('jimp');

async function removeWhiteBackground() {
  const imagePath = 'e:\\Antigravity\\public\\player.png';
  
  try {
    const image = await Jimp.read(imagePath);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If color is very close to white
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // Set alpha to 0
      }
    });

    await image.writeAsync(imagePath);
    console.log('Background removed successfully.');
  } catch (err) {
    console.error('Error removing background:', err);
  }
}

removeWhiteBackground();
