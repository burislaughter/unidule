import { Box } from "@mui/material";
import { VoiceButtonOne, VoiceButtonOneProps } from "./VoiceButtonOne";
import { useEffect, useRef, useState } from "react";
import { useDrag, DragSourceMonitor, DragPreviewImage } from "react-dnd";
import { useGetElementProperty } from "./useGetElementProperty";
import { getEmptyImage } from "react-dnd-html5-backend";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";

export type VoiceButtonOneDnDProps = VoiceButtonOneProps & {
  parentX: number;
  parentY: number;
};

export type VoiceButtonRect = {
  uid: string;
  title: string;
  posX: number;
  posY: number;
  height: number;
  width: number;
  timelineUid?: string | undefined;
};

export const VoiceButtonOneDnD = ({
  filename,
  title,
  channel,
  isDenoise,
  uid,
  reLoadFunc,
  isAdmin,
  selectVoice,
  archiveUrl,
  start,
  end,
  setYtPalyerShotState,
  timelineUid,
  // tlAddFunc,
  tag,
  parentX,
  parentY,
}: VoiceButtonOneDnDProps) => {
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const targetRef = useRef(null);
  const refListView = useRef<HTMLDivElement>(null);
  const { getElementProperty } = useGetElementProperty<HTMLDivElement>(targetRef);

  const [{ isDragging }, drag, dragPreview] = useDrag<VoiceButtonRect, any, any>(
    {
      type: "voice",
      item: { uid: uid, title: title, posX: posX, posY: posY, height: height, width: width, timelineUid: timelineUid },
      collect: (monitor: any) => ({
        isDragging: monitor.isDragging(),
      }),
    },
    [posX, posY, uid]
  );

  useEffect(() => {
    const x = getElementProperty("left") - parentX;
    const y = getElementProperty("top") - parentY;
    const h = getElementProperty("height");
    const w = getElementProperty("width");

    setPosX(Math.floor(x));
    setPosY(Math.floor(y));
    setHeight(Math.floor(h));
    setWidth(Math.floor(w));
  }, [parentX, parentY, targetRef]);

  useEffect(() => {
    // 画像を消す場合
    // dragPreview(<div>aaaa</div>, { captureDraggingState: true });
    // dragPreview(getEmptyImage()); // 画像を消す場合
    // dragPreview(<div></div>); // 画像を消す場合
    // dragPreview(targetRef.current); // コンポーネントの画像を利用
  }, [dragPreview]);

  // dragPreview(refListView);

  return (
    <Box ref={targetRef} sx={{ display: "inline-block" }}>
      <DragPreviewImage
        // ドラッグ中のプレビュー画像を設定
        connect={dragPreview}
        src={"https://yt3.ggpht.com/BR0IZ7xBvHgHxg_4ammo2EoviYG1wUNOdXX2vKj1QH_Jm3lYKOhHIf1iOCTUA3JdF5yxLAT--w=s88-c-k-c0x00ffffff-no-rj"}
      />

      <Box ref={drag} sx={{ display: "inline-block" }}>
        <VoiceButtonOne
          filename={filename}
          title={title}
          channel={channel}
          isDenoise={isDenoise}
          uid={uid}
          reLoadFunc={reLoadFunc}
          isAdmin={isAdmin}
          selectVoice={selectVoice}
          archiveUrl={archiveUrl}
          start={start}
          end={end}
          setYtPalyerShotState={setYtPalyerShotState}
          // tlAddFunc={tlAddFunc}
          tag={tag}
          timelineUid={timelineUid}
        />
      </Box>
    </Box>
  );
};
