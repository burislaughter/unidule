import { Box, Button, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Switch, Typography } from "@mui/material";
import TextField from '@mui/material/TextField';
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Phaser from "phaser";
import "./Roulette.css";
import { PhaserGame } from "./game/PhaserGame";
import BreadcrumbsEx from "../../breadcrumbs";

function Roulette() {
  // The sprite can only be moved in the Roulette Scene
  const [rouletteRotate, setRouletteRotate] = useState(0);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef();
  const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0, angle:0 });

  const [rouletteItems, setRouletteItems] = useState("氷乃渚\n渚さん\nなぎぷぅ\nなぎてぃゃ\nなぎにゃん\nなぎぴょん");
  const [rouletteResultList, setRouletteResultList] = useState("");

  const [rouletteHit, setRouletteHit] = useState("");

  // 確定したルーレットの出目
  const [rouletteResult, setRouletteResult] = useState("");

  // 音声再生スイッチ
  const [playVoiceToggle, setPlayVoiceToggle] = useState(false);

  // ルーレット倍率
  const [magnification,setMagnification] = useState("1");
  
  
  const handleSelectMagnification = (event: SelectChangeEvent) => {
    setMagnification(event.target.value);
  };


  // ルーレット開始ボタンコールバック
  const rotateStartPushCb = () => {
    const scene = phaserRef.current.scene;

    // ルーレットのステータスを回転へ
    setRouletteRotate(1)

    // メインメニューの時だけルーレット回転開始を押せる
    if (scene && scene.scene.key === "Roulette") {
      scene.rouletteStart((sp:any) => {
        setSpritePosition(sp);
      });
    }
  };

  // 次のルーレットへ
  const rotateNextCB = () => {
    // 結果領域に追加
    setRouletteResultList((_x)=> {
      if(_x == ''){
        return rouletteResult;
      }else{
        return _x + '\n' + rouletteResult
      }
    })

    // アイテム領域から削除
    setRouletteItems((_x)=> {
      const s = _x.split('\n')
      const r = s.filter((y)=> y != rouletteResult ).join('\n')
      return r
    })

    // ルーレットのステータスを0に
    setRouletteRotate(0)
    const scene = phaserRef.current.scene;
    scene.rouletteReInit()
  }

  // シーン作成時のコールバック
  const currentScene = (scene:any) => {
    setRouletteRotate(0);
    // 初期値のアイテムをルーレットの側に渡す
    updateRouletteItem(rouletteItems,magnification,scene)
  };


  // ルーレット内からルーレット結果を受け取る
  const rouletteResultUpdate = (result:string) => {
    setRouletteResult(result)
    setRouletteRotate(2)
  }

  // 改行区切りの文字列からルーレットの更新
  const updateRouletteItem = (itemStr:string, magnification:string,scene:any)=>{
    const _items = itemStr.split('\n')
    const items = _items.map( x => {
      return {label:x}
    })

    scene.rouletteSet(items, Number(magnification) , rouletteResultUpdate);
  }

  // ルーレットの項目更新時
  useEffect(()=> {
    if(phaserRef.current != undefined && rouletteItems){
      const scene = (phaserRef.current as any).scene
      if(scene)
        updateRouletteItem(rouletteItems,magnification,scene)
    }
  },[rouletteItems,magnification,(phaserRef.current as any)?.scene] )


  // ルーレットの回転更新時
  useEffect(()=>{
    // console.log(spritePosition)

    // 出目の判定
    let rot = (spritePosition.angle + 180) + 90;
    if(rot > 360){
      rot-=360
    }
    if(rot < 0){
      rot+=360
    }

    const items = rouletteItems.split('\n')
    const itemNum = items.length
    if(itemNum != 0){
      const id = Math.floor(rot / (360/itemNum));
      setRouletteHit(items[id])
    }

  },[spritePosition.angle])



  return (
    <Box id="app" sx={{marginTop:"50px",marginLeft:"10px"}}>
      <Typography
        className="outline-roulette"
        component="span"
        
        sx={{
          marginY: 4,
          fontWeight: "bold",
          paddingTop: 0,
          paddingLeft: 0,
          fontSize: "40px",
          textAlign: "center",
          width: "100%",
        }}
      >
        回レ！氷乃渚！
      </Typography>

      <BreadcrumbsEx
        props={[
          { url: "/", label: "スケジューラー" },
          { url: "", label: "ルーレット" },
        ]}
      ></BreadcrumbsEx>


      <Stack direction="row" >
        <Box sx={{
          width:"70%",

          "@media screen and (max-height:360px)": {
            height:"360px",
            width:"50%",

          },
        }}>
          <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
        </Box>
        <Box sx={{
          width:"30%",
          height: "auto",
          "@media screen and (max-height:360px)": {
            
            width:"50%",

          },


        }}>
          <Stack direction="row" sx={{marginTop:"10px" }}>
            <Box sx={{marginLeft:"4px"}}>
              <Button variant="contained" disabled={rouletteRotate != 0} className="button" onClick={rotateStartPushCb}>
                ルーレット開始
              </Button>
            </Box>
            <Box sx={{marginLeft:"4px"}}>
              <Button variant="contained" disabled={rouletteRotate != 2} className="button" onClick={rotateNextCB}>
                次へ
              </Button>
            </Box>

            <FormGroup sx={{marginLeft:"16px"}}>
              <FormControlLabel control={
                <Switch
                color="warning"
                inputProps={{ "aria-label": "voice play" }}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setPlayVoiceToggle(event.target.checked);
                  
                  const scene = phaserRef.current.scene;
                  scene.setVoicePlayToggle(event.target.checked)

                }}
              />

              } label="音声" />
            </FormGroup>
          </Stack>
          <Box sx={{marginLeft:"4px"}}>
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="select-magnification-label">ルーレット倍率</InputLabel>
              <Select
                labelId="select-magnification-label"
                id="select-magnification"
                value={magnification}
                label="Age"
                onChange={handleSelectMagnification}
                disabled={rouletteRotate != 0}
              >
                <MenuItem value={1}>x1</MenuItem>
                <MenuItem value={2}>x2</MenuItem>
                <MenuItem value={3}>x3</MenuItem>
                <MenuItem value={4}>x4</MenuItem>
                <MenuItem value={5}>x5</MenuItem>
                <MenuItem value={6}>x6</MenuItem>
                <MenuItem value={7}>x7</MenuItem>
                <MenuItem value={8}>x8</MenuItem>
                <MenuItem value={9}>x9</MenuItem>
                <MenuItem value={10}>x10</MenuItem>
              </Select>
            </FormControl>
          </Box>
          

          <TextField
            id="input-area"
            label="ルーレットの項目"
            multiline
            sx={{marginTop:"10px",marginLeft:"10px", width:"90%"}}
            value={rouletteItems}
            onChange={(event) => {
              setRouletteItems(event?.target?.value ?? "");
            }}
          />
          <Typography sx={{textAlign:"center",color:"#333",fontSize:"0.8rem"}}>ルーレット項目は改行で増やせます</Typography>
          
          <TextField
            id="result-textarea"
            label="結果"
            multiline
            sx={{marginTop:"10px",marginLeft:"10px", width:"90%"}}
            value={rouletteResultList}
            InputProps={{
              readOnly: true,
            }}
            
          />

        </Box>
      </Stack>

      
      <Typography
        component="span"
        
        sx={{
          paddingTop: 0,
          paddingLeft: 0,
          fontSize: "14px",
          textAlign: "left",
        }}
      >
        PCブラウザ推奨(スマホは横でワンチャン使えるかも)
      </Typography>
      
    </Box>
  );
}

export default Roulette;
