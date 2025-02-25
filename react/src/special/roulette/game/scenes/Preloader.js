import { Scene } from "phaser";


const URL_RES = "https://unidule.jp/res/";
const voiceList_finish = [
  'voice/finish/KoKSCNd_gD0-0001-isiki.mp3', // 意識して
  'voice/finish/01dai.mp3',  // 大感謝
  'voice/finish/20241111-01-chuu.mp3',  // Chu
  'voice/finish/20241105-01-oshioki.mp3', // お仕置きが必要そうだね
  'voice/finish/EUU2Hjdma58-2af2c906-a029-442f-b1fb-88779db1732e.mp3',
  'voice/finish/LQisGmtUCtg-8ef71b86-cd75-42d0-8cbd-f148be20b360.mp3',
  'voice/finish/yLl2Hof3rgI-4d9ac7ae-4213-4998-b726-a01f2e2061ba.mp3',
]

const voiceList_init = [
  // 開始時
  'voice/init/LQisGmtUCtg-860c477d-e05f-4826-b134-bc39fa170ddb.mp3',
  'voice/init/Lh3YZAQJJ6M-08-uoo.mp3',
  'voice/init/Lh3YZAQJJ6M-02-atete.mp3',
  'voice/init/20241104_03_jinsei.mp3',
  'voice/init/EUU2Hjdma58-163d14df-d579-4afc-88ef-8557217f57a6.mp3',
  'voice/init/DvTVkKy2D_E-a36a5038-f9a4-41b6-97e3-e8374f975927.mp3'
]


export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    // この画像をブートシーンにロードしたので、ここに表示できます。
    this.add.image(512, 512, "background");

    //  シンプルなプログレスバー。これがバーのアウトラインです。
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  これは進行状況バーそのものです。進行状況の % に基づいて、左からサイズが大きくなります。
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  LoaderPlugin によって発行される「progress」イベントを使用して、読み込みバーを更新します。
    this.load.on("progress", (progress) => {
      //  進捗バーを更新します（バーの幅は 464px なので、100% = 464px です）
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // ゲームのアセットをロードする - 独自のアセットに置き換える
    // assetsフォルダから読み込む設定にします
    this.load.setPath("assets");

    // logo と 星の画像を読み込む
    this.load.image("logo", "logo.png");
    this.load.image("star", "star.png");

    // 渚さん
    this.load.image("nagisa01", "nagisa01.png");

    this.load.image("nagisa02k", "nagisa02k.png");


    // サウンド  //////////////////////////////
    // ルーレット開始時
    this.load.audio('init_0', voiceList_init[0]);
    this.load.audio('init_1', voiceList_init[1]);
    this.load.audio('init_2', voiceList_init[2]);
    this.load.audio('init_3', voiceList_init[3]);
    this.load.audio('init_4', voiceList_init[4]);
    this.load.audio('init_5', voiceList_init[5]);

    // 決定時
    this.load.audio('finish_0', voiceList_finish[0]);
    this.load.audio('finish_1', voiceList_finish[1]);
    this.load.audio('finish_2', voiceList_finish[2]);
    this.load.audio('finish_3', voiceList_finish[3]);
    this.load.audio('finish_4', voiceList_finish[4]);
    this.load.audio('finish_5', voiceList_finish[5]);
    this.load.audio('finish_6', voiceList_finish[6]);
    
  }

  create() {
    //  すべてのアセットがロードされたら、ゲームの残りの部分で使用できるグローバル オブジェクトをここで作成する価値があります。
    //  たとえば、ここでグローバル アニメーションを定義して、他のシーンで使用できるようにします。

    // メインメニューに移動します。これを、カメラフェードなどのシーン遷移に変更することもできます。
    this.scene.start("Roulette");
  }
}
