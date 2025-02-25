import { VolumeDown, VolumeUp } from "@mui/icons-material";
import { Box, Slider, Stack } from "@mui/material";
import { useState } from "react";

export type SoundCtrlProp = {
  setVolume: any;
  allStop: any;
};

export const SoundCtrl = ({ setVolume, allStop }: SoundCtrlProp) => {
  const [vol, setVol] = useState(60);

  const handleChange = (event: React.SyntheticEvent | Event, value: number | number[]) => {
    setVol(value as number);
  };
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, value: number | number[]) => {
    setVolume(value as number);
  };

  return (
    <Box sx={{ width: 260, marginTop: "10px", marginBottom: "20px", marginLeft: "20px" }}>
      <Stack spacing={2} direction="row" sx={{ alignItems: "center", marginTop: "auto", marginBottom: "auto", height: "100%", marginX: "10px", filter: "drop-shadow(10px 10px 4px rgb(0 0 0 / 0.8))" }}>
        <VolumeDown />
        <Slider aria-label="Volume" value={vol} onChange={handleChange} onChangeCommitted={handleChangeCommitted} />
        <VolumeUp />
      </Stack>
    </Box>
  );
};
