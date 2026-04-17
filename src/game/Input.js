export class Input {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false
    };

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  handleKeyDown(e) {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.shoot = true;
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.shoot = false;
        break;
    }
  }

  destroy() {
    // Note: To properly remove listeners, we'd need to bind the handlers and store references.
    // For a simple single-page game that lives as long as the page, this is okay,
    // but a cleanup method is good practice if the component unmounts.
  }
}
