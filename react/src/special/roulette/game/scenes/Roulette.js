import { EventBus } from "../EventBus";
import { Scene, Math as PhaserMath, Time as PhaserTime } from "phaser";

function toRad(deg) {
  return (deg * Math.PI) / 180.0;
}

const colors = [
  0xFFFF90,
  0xFF90FF,
  0x90FFFF,
  0xFF9090,
  0x9090FF,
  0x90FF90,

  0xFFFFC0,
  0xFFC0FF,
  0xC0FFFF,
  0xFFC0C0,
  0xC0C0FF,
  0xC0FFC0,

  0xFFFF60,
  0xFF60FF,
  0x60FFFF,
  0xFF6060,
  0x6060FF,
  0x60FF60
]


export class Roulette extends Scene {
  logoTween = null;
  rouletteTween = null;

  // フレーム完の時間保持
  lastExecTime = 0;

  // 前のフレームの角度
  frameRotateBk = 0;

  // 終点までの回転力
  finishRotateSpeed = 0;

  // ルーレットの状態
  ROULETTE_STATE_NONE = 0;    // 初期化
  ROULETTE_STATE_START = 10;    // 初期化
  ROULETTE_STATE_RUN_UP = 20;   // 助走のため下がる
  ROULETTE_STATE_RUN_UP_DELAY = 21;   // 開始までのディレイ

  ROULETTE_STATE_CONSTANT = 30; // 定速で回る
  ROULETTE_STATE_DAMPING  = 40; // 減衰
  ROULETTE_STATE_FINISH_INIT  = 50;  // 完了初期化
  ROULETTE_STATE_FINISH  = 51;  // 完了

  // ルーレットステート
  rouletteState = this.ROULETTE_STATE_NONE;

  // 回転速度係数
  speedRatio = 4.0;

  // スプライトステータス返却
  spriteStateCB = null

  // フレームカウンタ
  fct = 0;

  // タイトルテキスト
  titleText = null;
  pieGrph = null
  pieTitles = []

  resultText = null

  // 音声再生のトグルスイッチ
  voicePlayToggle = false

  constructor() {
    super("Roulette");
  }

  bgCenterX = 1024/2;
  bgCenterY = 1024/2;

  updateResult = ()=>{}

  create() {
    this.add.image(512, 512, "background");

    this.titleText = this.add
      .text(512, 40, "回すボタンを押してね", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setDepth(200)
      .setOrigin(0.5,0.0);

    this.resultText = this.add
    .text(512, 512, "", {
      fontFamily: "Arial Black",
      fontSize: 80,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      align: "center",
    })
    .setDepth(501)
    .setOrigin(0.5,0.5)
    .setAlpha(0);

    EventBus.emit("current-scene-ready", this);
    // ルーレットコンテナ ///////////////////////////////////////////////////////////////////////////////////////
    this.updateContainer('nagisa')

  }

  updateContainer(selectMain){
    if(this.rouletteMainContainer){
      this.rouletteMainContainer.destroy()
    }
    
    if(this.finishSp){
      this.finishSp.destroy()
    }

    // ルーレットコンテナ ///////////////////////////////////////////////////////////////////////////////////////
    this.rouletteMainContainer = this.add.container(this.bgCenterX, this.bgCenterY).setDepth(101);

    if(selectMain == 'nagisa'){
      // 渚さん
      this.rouletteMainContainer.add(this.add.image(0, 0, "nagisa01").setDepth(0).setOrigin(0.5, 0.5))

      // カーソル▽ ゲームオブジェクトを保持
      this.rouletteMainContainer.add(this.add.triangle(0, -460,-20,-50, 20,-50,0,50,0xFFFF00,1).setOrigin(0, 0))

      // 決定時演出
      this.finishSp = this.add.image(0, 0, "nagisa02k").setDepth(0).setOrigin(0.5, 0.5);
      this.finishSp.setAlpha(0).setVisible(false).setOrigin(0.5, 0.310);

      this.initVoice = [
        'init_n_0',
        'init_n_1',
        'init_n_2',
        'init_n_3',
        'init_n_4',
        'init_n_5',
      ];
  
      this.finishVoice = [
        'finish_n_0',
        'finish_n_1',
        'finish_n_2',
        'finish_n_3',
        'finish_n_4',
        'finish_n_5',
        'finish_n_6',
      ];
  

    } else if(selectMain == 'unorabi'){
      // うのらび
      this.rouletteMainContainer.add(this.add.image(0, 0, "unorabi01").setDepth(0).setOrigin(0.5, 0.5))

      // カーソル▽ ゲームオブジェクトを保持
      this.rouletteMainContainer.add(this.add.triangle(0, -460,-20,-50, 20,-50,0,50,0xFFFF00,1).setOrigin(0, 0))

      // 決定時演出
      this.finishSp = this.add.image(0, 0, "unorabi02").setDepth(0).setOrigin(0.5, 0.5);
      this.finishSp.setAlpha(0).setVisible(false).setOrigin(0.5, 0.5).setScale(0.8);

      this.initVoice = [
        'init_u_0',
        'init_u_1',
        'init_u_2',
        'init_u_3'      ];
  
      this.finishVoice = [
        'finish_u_0',
        'finish_u_1',
        'finish_u_2',
        'finish_u_3',
        'finish_u_4'
      ];
    }

    // アニメーション等を停止
    this.rouletteState = this.ROULETTE_STATE_NONE;

    

  }


  changeScene() {
    this.scene.start("Game");
  }

  // ルーレット開始ボタン押下
  rouletteStart(reactCallback) {
    // ステートを初期化
    this.rouletteState = this.ROULETTE_STATE_START;

    this.spriteStateCB = reactCallback
  }

  // ルーレットの内容を外部より設定
  // ルーレットのアイテム、倍率、確定自コールバック
  rouletteSet(items, magnification ,setRouletteResultFunc) {
    // ルーレットの円を描画
    this.drawRoulette(this.bgCenterX, this.bgCenterY, items,magnification)
    this.updateResult = setRouletteResultFunc
  }


  update() {
    switch(this.rouletteState){
      case this.ROULETTE_STATE_START:
        this.rouletteInit();

        break
      case this.ROULETTE_STATE_RUN_UP:
        this.rouletteRunUp();
        break

      case this.ROULETTE_STATE_RUN_UP_DELAY:
        this.rouletteRunUpDelay();
        break;

      case this.ROULETTE_STATE_CONSTANT:
        this.rouletteConstant()
        break
      case this.ROULETTE_STATE_DAMPING:
        this.rouletteDamping()
        break
      case this.ROULETTE_STATE_FINISH_INIT:
        this.rouletteFinishInit()
        break
      case this.ROULETTE_STATE_FINISH:
        this.rouletteFinish()
        break        
    }

    if(this.spriteStateCB != null){
      this.spriteStateCB({ x: this.rouletteMainContainer.x, y: this.rouletteMainContainer.y, angle: this.rouletteMainContainer.angle })
    }

    // 出目の計算
    this.getRouletteHit()


  }

  // 出目の判定
  getRouletteHit(){
    let rot = (this.rouletteMainContainer.angle + 180) + 90;
    if(rot >= 360){
      rot-=360
    }
    if(rot < 0){
      rot+=360
    }

    const itemNum = this.pieTitles.length
    if(itemNum != 0){
      const id = Math.floor(rot / (360/itemNum));
      // console.log("getRouletteHit : "+id + " :rot= " + rot)
      if(this.pieTitles.length == id ){
        return
      }

      this.titleText.text = this.pieTitles[id].text
      this.resultText.text = this.pieTitles[id].text
    }
    
  }
  

  /*********************************************
   * ルーレット開始初期化
   * ROULETTE_STATE_START = 1;
  ******************************************/
  rouletteInit(){
    this.rouletteMainContainer.rotation = 0;
    this.frameRotateBk = 0;
    this.finishRotateSpeed = 4;

    this.rouletteInitBackRot = this.randomRange(70)

    this.rouletteState = this.ROULETTE_STATE_RUN_UP;

  }

  // 外部から呼ばれる再初期化
  rouletteReInit(){
    this.rouletteMainContainer.angle = 0

  }




  // ROULETTE_STATE_RUN_UP = 2;   // 助走のため下がる
  rouletteRunUp(){
    let backRotOffcet = -(135 + this.rouletteInitBackRot ); // 　　最初に戻る角度

    this.rouletteMainContainer.angle -= 2
    if( this.rouletteMainContainer.angle < backRotOffcet){
      this.rouletteState = this.ROULETTE_STATE_RUN_UP_DELAY;
      this.fct = 0;
    }

  }

  /***********************************************
   * ROULETTE_STATE_RUN_UP_DELAY
   * 反回転した後のタメ
  ************************************************/
  rouletteRunUpDelay() {
    if( this.fct === 0){
      this.rouletteTween = this.tweens.add({
        targets: this.rouletteMainContainer,
          angle: (this.rouletteMainContainer.angle-(30+this.randomRange(10))),
          duration: 2000,
          repeat: 0,
          ease: PhaserMath.Easing.Cubic.Out,
          onComplete:()=>{
            this.rouletteState = this.ROULETTE_STATE_CONSTANT;
            this.fct = 0;
      
            this.constantRotateAddFrame = Math.floor(30 + this.randomRange(120))
      
      
            const vo = this.initVoice;
        
            if(this.voicePlayToggle){
              const idx = Math.round(Math.random() * vo.length) % vo.length
              let sfx = this.sound.add(vo[idx],{
                volume:0.35
              });
              sfx.play();
            }
          }
      })
    }


    this.fct++;
  }


  /***********************************************
   * ROULETTE_STATE_CONSTANT = 3; // 定速で回る
  ************************************************/
  rouletteConstant() {
    this.rouletteMainContainer.angle +=  this.finishRotateSpeed * this.speedRatio

    if(this.fct === (300 + this.constantRotateAddFrame) ){
      this.rouletteState = this.ROULETTE_STATE_DAMPING;
      this.fct = 0;

      // 減衰率
       this.highDamping = 0.025 + this.randomRange(0.03)
      // this.highDamping = 0.04
      // this.highDamping = 0.01

      this.lowDamping = 15 + Math.floor(this.randomRange(10))



    }

    this.fct++;
  }


  // ROULETTE_STATE_DAMPING  = 4; // 減衰
  rouletteDamping() {
    // 一旦 1000 ms で 360度とする
    this.rouletteMainContainer.angle +=  this.finishRotateSpeed * this.speedRatio

    // 高速の場合は早く減衰して、低速の場合はゆっくり減衰する
    // 閾値0.3
    if (this.finishRotateSpeed > 0.3) {
      this.finishRotateSpeed -= this.highDamping / (this.speedRatio / 2);
    } else {
      this.finishRotateSpeed -= this.lowDamping / 25000.0;
    }

    if (this.finishRotateSpeed < 0) {
      this.finishRotateSpeed = 0;

      this.rouletteState = this.ROULETTE_STATE_FINISH_INIT;
      this.fct = 0;
    }
  }

  // ROULETTE_STATE_FINISH_INIT  = 50;  // 完了
  rouletteFinishInit() {
    this.finishSp.setDepth(500).setVisible(true).setAlpha(0).setScale(1).setPosition(512,512)
    this.showKissTween = this.tweens.chain({
        targets: this.finishSp,
        persist: true,
        tweens:[
          {
            alpha: 1,
            duration: 2000,
            scaleX:2.0,
            scaleY:2.0,
            ease: PhaserMath.Easing.Cubic.Out,
          },          {
            alpha: 0,
            duration: 1000,
            scaleX:3.0,
            scaleY:3.0,
            ease: PhaserMath.Easing.Cubic.In,
          }
        ]
      }
    )


    this.resultText.setScale(3.0).setAlpha(0)
    this.showKissTween = this.tweens.chain({
        targets: this.resultText,
        persist: true,
        tweens:[
          {
            alpha: 1,
            duration: 2000,
            scaleX:1.0,
            scaleY:1.0,
            ease: PhaserMath.Easing.Cubic.Out,
          },          {
            alpha: 0,
            duration: 500,
            scaleX:0.8,
            scaleY:0.8,
            ease: PhaserMath.Easing.Cubic.In,
          }
        ]
      }
    )

    // 結果を更新
    this.updateResult(this.resultText.text)



    this.fct = 0;
    // 次のステータスへ
    this.rouletteState = this.ROULETTE_STATE_FINISH;
  }

  // 終了待機ループ
  rouletteFinish() {

    const vo = this.finishVoice
    const num = this.finishVoice.length

    if(this.voicePlayToggle){
      if(this.fct == 30){
        const idx = Math.round(Math.random() * num) % num
        let sfx = this.sound.add(vo[idx],{
          volume:0.4
        });
        sfx.play();
      }
    }
    

    this.fct++
  }


  // 外部から音声の再生状態を変更する 
  setVoicePlayToggle(checked ) {
    this.voicePlayToggle = checked
  }


  // ルーレットの描画
  drawRoulette(centerX, centerY, items, magnification){
    const LINE_WIDTH = 1; // ラインの太さ

    if(this.pieGrph !== null) {
      this.pieGrph.destroy()
    }

    this.pieGrph = this.add.graphics({
      lineStyle: { width: LINE_WIDTH, color: 0xE00000, alpha: 1 },
      fillStyle: { color: 0xFFFFFF, alpha: 1 }
    });

    // 倍率の分アイテムを増やす
    if(magnification-1 > 0) {
      const _copy = JSON.parse(JSON.stringify(items))
      for(let i=0; i<magnification-1; ++i) {
        items = items.concat(_copy)
      }
  
    }



    // パイを生成
    if(this.pieTitles.length != 0 ){
        this.pieTitles.forEach((x)=>{
          x.destroy()
        }
      )
      this.pieTitles.length = 0
    }


    items.forEach((x,i)=> {
      const color_idx =  i % colors.length 
      const item_max = items.length

      this.pieTitles.push(this.createPie(this.pieGrph,centerX, centerY, i, item_max, 0,x.label,colors[color_idx]))
    })

  }

  //　一つのパイを作成
  createPie(grph, sx,sy,index,max,ofsRot,title,color){
    const LINE_WIDTH = 1; // ラインの太さ
    const RADIUS = 400;    // 角の円の半径

    const arc = 360.0 / max;
    const s_rot = index * arc;
    const e_rot = (index+1) * arc;


    // 線と塗り
    grph.lineStyle(LINE_WIDTH, 0x603030, 1).fillStyle(color, 1);
    const pie = grph.slice(sx, sy, RADIUS, toRad(s_rot+ofsRot), toRad(e_rot+ofsRot) , false).fill().stroke().setAngle();
    // pie.setAngle()
    const titleText = this.add
    .text(sx + Math.cos(toRad(e_rot-(arc/2))) * RADIUS, sy + Math.sin(toRad(e_rot-(arc/2))) * RADIUS, title, {
      fontFamily: "Arial Black",
      fontSize: 30,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
      align: "center"
    })
    .setAngle(e_rot-(arc/2))
    .setOrigin(1.0,0.5);

    return titleText;
  }

  // 乱数を範囲指定で生成
  // 20なら -10～10
  randomRange(range) {
    return (-range/2) + Math.random() * range
  }
}
