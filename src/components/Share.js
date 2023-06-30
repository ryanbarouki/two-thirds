import CopyToClipboard from "react-copy-to-clipboard";
import React, { useMemo } from "react";
import { toast } from "react-toastify";
import { DateTime } from "luxon";
import { Button } from "../styles/StyledComponents";

const FIRST_DAY_OF_TWOTHIRDS = DateTime.fromFormat('June 29 2023', 'LLLL dd yyyy');

export function Share({guess, rank}) {
  const shareText = useMemo(() => {
    const dayString = DateTime.now().toFormat("yyyy-MM-dd", {zone: 'utc'});
    const currentDate = DateTime.fromFormat(dayString, 'yyyy-MM-dd', {zone: 'utc'});
    const diffInDays = Math.floor(currentDate.diff(FIRST_DAY_OF_TWOTHIRDS, 'days').toObject().days);
    let shareString = `#TwoThirds #${diffInDays}
    I guessed ${guess} and ranked #${rank}
    Can you outsmart everyone tomorrow?
    https://www.twothirds.app`;
    return shareString
  }, [guess, rank]);

  return (
    <CopyToClipboard
      text={shareText}
      onCopy={() => toast("Copied Results to Clipboard", { autoClose: 2000 })}
      options={{ format: "text/plain" }}
    >
      <Button><span>Share Score</span></Button>
    </CopyToClipboard>
  )
}