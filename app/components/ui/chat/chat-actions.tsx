import { PauseCircle, RefreshCw, FileText } from "lucide-react"; // Import icon for PPT

import { Button } from "../button";
import { ChatHandler } from "./chat.interface";

export default function ChatActions(
  props: Pick<ChatHandler, "stop" | "reload"> & {
    showReload?: boolean;
    showStop?: boolean;
    showGeneratePpt?: boolean;  // New prop for showing the PPT button
    onGeneratePpt?: () => void;  // Function to trigger PPT generation
  },
) {
  return (
    <div className="space-x-4">
      {props.showStop && (
        <Button variant="outline" size="sm" onClick={props.stop}>
          <PauseCircle className="mr-2 h-4 w-4" />
          Stop generating
        </Button>
      )}
      {props.showReload && (
        <Button variant="outline" size="sm" onClick={props.reload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      )}
      {props.showGeneratePpt && (
        <Button variant="green" size="sm" onClick={props.onGeneratePpt}>
          <FileText className="mr-2 h-4 w-4" />
          Generate PPT
        </Button>
      )}
    </div>
  );
}
