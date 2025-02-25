import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    //  ブートシーンは通常、ゲームのロゴや背景など、プリローダーに必要なアセットを読み込むために使用されます。
    //  ブートシーン自体にはプリローダーがないため、アセットのファイル サイズが小さいほど良いです。
    this.load.image("background", "assets/bg.png");
  }

  create() {
    // Preloader シーンの開始
    this.scene.start("Preloader");
  }
}
