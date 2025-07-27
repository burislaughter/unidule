import { Scene } from "phaser";


const URL_RES = "https://unidule.jp/res/";
const voiceList_finish_nagisa = [
  'voice/nagisa/finish/KoKSCNd_gD0-0001-isiki.mp3', // 意識して
  'voice/nagisa/finish/01dai.mp3',  // 大感謝
  'voice/nagisa/finish/20241111-01-chuu.mp3',  // Chu
  'voice/nagisa/finish/20241105-01-oshioki.mp3', // お仕置きが必要そうだね
  'voice/nagisa/finish/EUU2Hjdma58-2af2c906-a029-442f-b1fb-88779db1732e.mp3',
  'voice/nagisa/finish/LQisGmtUCtg-8ef71b86-cd75-42d0-8cbd-f148be20b360.mp3',
  'voice/nagisa/finish/yLl2Hof3rgI-4d9ac7ae-4213-4998-b726-a01f2e2061ba.mp3',
]
const voiceList_finish_unorabi = [
  "voice/unorabi/finish/oYxgnu0GKBc-42c17dab-e12b-4e49-a64e-2a71f4ebd488.mp3",
  "voice/unorabi/finish/tiTLPXxHWOM-249fb641-76ac-4e0c-8200-4c96047bc924.mp3",
  "voice/unorabi/finish/ePp3IO-N1fE-6d139eb9-c2d2-4f65-9a52-3df843cb1797.mp3",
  "voice/unorabi/finish/GVm9BFf8Qyk-0d88204f-3d63-4069-b49e-43a509ec85a4.mp3",
  "voice/unorabi/finish/nA3tRAhr4WY-e8ffa8db-7778-4ea3-b692-424befde9918.mp3",
]

// 開始時
const voiceList_init_nagisa = [
  'voice/nagisa/init/LQisGmtUCtg-860c477d-e05f-4826-b134-bc39fa170ddb.mp3',
  'voice/nagisa/init/Lh3YZAQJJ6M-08-uoo.mp3',
  'voice/nagisa/init/Lh3YZAQJJ6M-02-atete.mp3',
  'voice/nagisa/init/20241104_03_jinsei.mp3',
  'voice/nagisa/init/EUU2Hjdma58-163d14df-d579-4afc-88ef-8557217f57a6.mp3',
  'voice/nagisa/init/DvTVkKy2D_E-a36a5038-f9a4-41b6-97e3-e8374f975927.mp3'
]
const voiceList_init_unorabi = [
  "voice/unorabi/init/d5QXpjfhsQ4-20a40b1a-d731-47c8-b3bf-37d8cedf73f8.mp3",
  "voice/unorabi/init/nGHV9L6_MK8-ec9f823d-0262-46e4-87e3-515a123ed230.mp3",
  "voice/unorabi/init/TwHpuiS6hjg-d21af8c6-dbdf-43f8-8db6-ac7705a07d69.mp3",
  "voice/unorabi/init/yeQtahBccxA-cc971345-2d08-4062-bfa1-1a9249698c63.mp3",
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
    // うのらび
    this.load.image("unorabi01", "unorabi01.png");
    this.load.image("unorabi02", "unorabi02.png");


    // サウンド  //////////////////////////////
    // ルーレット開始時
    this.load.audio('init_n_0', voiceList_init_nagisa[0]);
    this.load.audio('init_n_1', voiceList_init_nagisa[1]);
    this.load.audio('init_n_2', voiceList_init_nagisa[2]);
    this.load.audio('init_n_3', voiceList_init_nagisa[3]);
    this.load.audio('init_n_4', voiceList_init_nagisa[4]);
    this.load.audio('init_n_5', voiceList_init_nagisa[5]);

    // ルーレット開始時
    this.load.audio('init_u_0', voiceList_init_unorabi[0]);
    this.load.audio('init_u_1', voiceList_init_unorabi[1]);
    this.load.audio('init_u_2', voiceList_init_unorabi[2]);
    this.load.audio('init_u_3', voiceList_init_unorabi[3]);

    // 決定時
    this.load.audio('finish_n_0', voiceList_finish_nagisa[0]);
    this.load.audio('finish_n_1', voiceList_finish_nagisa[1]);
    this.load.audio('finish_n_2', voiceList_finish_nagisa[2]);
    this.load.audio('finish_n_3', voiceList_finish_nagisa[3]);
    this.load.audio('finish_n_4', voiceList_finish_nagisa[4]);
    this.load.audio('finish_n_5', voiceList_finish_nagisa[5]);
    this.load.audio('finish_n_6', voiceList_finish_nagisa[6]);

    // 決定時
    this.load.audio('finish_u_0', voiceList_finish_unorabi[0]);
    this.load.audio('finish_u_1', voiceList_finish_unorabi[1]);
    this.load.audio('finish_u_2', voiceList_finish_unorabi[2]);
    this.load.audio('finish_u_3', voiceList_finish_unorabi[3]);
    this.load.audio('finish_u_4', voiceList_finish_unorabi[4]);
    
  }

  create() {
    //  すべてのアセットがロードされたら、ゲームの残りの部分で使用できるグローバル オブジェクトをここで作成する価値があります。
    //  たとえば、ここでグローバル アニメーションを定義して、他のシーンで使用できるようにします。

    // メインメニューに移動します。これを、カメラフェードなどのシーン遷移に変更することもできます。
    this.scene.start("Roulette");
  }
}
