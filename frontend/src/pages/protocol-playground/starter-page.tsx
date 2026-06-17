import { useContext } from "react";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import PlaygroundPage from "@pages/protocol-playground/playground-page";
import { StarterScreen } from "@pages/protocol-playground/ui/starter";

const StarterPage = () => {
    const { config } = useContext(PlaygroundContext);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {config ? <PlaygroundPage /> : <StarterScreen />}
        </div>
    );
};

export default StarterPage;
