import { Box, IconButton, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { IoMdCheckboxOutline } from "react-icons/io";
import { voiceCategory } from "../const";

export type EditSelectProps = {
  uid: string;
  field: string;
  initValue: string;
  fixCallback: any;
};

export type FixCallbackParamas = {
  uid: string;
  field: string;
  value: string;
};

export const EditSelect = ({ uid, field, initValue, fixCallback }: EditSelectProps) => {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const handlerClick = () => {
    if (open == true) {
      fixCallback({
        uid: uid,
        field: field,
        value: value,
      });
    }
    setOpen((_x) => (_x ? false : true));
  };

  useEffect(() => {
    setValue(initValue);
  }, []);

  return (
    <Box>
      {open == false && (
        <Box>
          <Typography component="span">{value}</Typography>
          <IconButton onClick={handlerClick}>
            <CiEdit size={20} color="#000" />
          </IconButton>
        </Box>
      )}
      {open == true && (
        <Box>
          <Select
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          >
            {voiceCategory.map((categ) => {
              return (
                <MenuItem key={categ.name} value={categ.value}>
                  {categ.name}
                </MenuItem>
              );
            })}
          </Select>

          <IconButton onClick={handlerClick}>
            <IoMdCheckboxOutline size={20} color="#000" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};
