import { usePlayground } from "@pages/protocol-playground/hooks/playground-runtime";

import PlaygroundPage from "@pages/protocol-playground/playground-page";
import { StarterScreen } from "@pages/protocol-playground/ui/starter";

const StarterPage = () => {
    const { config } = usePlayground();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {config ? <PlaygroundPage /> : <StarterScreen />}
        </div>
    );
};

export default StarterPage;
