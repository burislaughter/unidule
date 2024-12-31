import { Box, IconButton, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { IoMdCheckboxOutline } from "react-icons/io";

export type EditTextProps = {
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

export const EditText = ({ uid, field, initValue, fixCallback }: EditTextProps) => {
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
          <TextField
            error
            label="タイトル"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
            }}
          />
          <IconButton onClick={handlerClick}>
            <IoMdCheckboxOutline size={20} color="#000" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};
