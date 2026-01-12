import Modal from "@components/modal";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
}

export default function GuideModal({ isOpen, onClose, domain }: GuideModalProps) {
  const renderGuideContent = () => {
    if (!domain) {
      return <p className="text-sm text-gray-600">No guide available for this domain.</p>;
    }

    if (domain.startsWith("ONDC:RET")) {
      return (
        <div className="space-y-3 text-sm">
          <h2 className="text-base font-semibold text-gray-800">
            For Retail Domain(RET10,RET11,RET12,RET13,RET14,RET15,RET16,RET18)
          </h2>

          <div className="space-y-2">
            <p className="font-medium">
              <span className="font-semibold">#1</span> To test Buyer app and Seller app in Retail
              Domain
            </p>
            <p className="ml-4">
              To test app start with{" "}
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                "Discovery Flow full catalog"
              </span>{" "}
              flow
            </p>

            <div className="ml-8 space-y-2">
              <p>
                <span className="font-semibold">#a</span> Click Play Button
              </p>

              <p>
                <span className="font-semibold">#b</span> Trigger Search from Buyer app if you are
                testing buyer app. If testing seller app check for Search request received from
                Workench
              </p>

              <p>
                <span className="font-semibold">#c</span> If testing the buyer app you will receive
                on_search from workbench. If testing seller app send on_search when search received
                from workbench
              </p>

              <p>
                <span className="font-semibold">#d</span> Once flow completed it will display like
                this. If any request NACKed then you will see NACK for that request
              </p>

              <div className="my-3 flex justify-center">
                <img
                  src="/images/ret-guide-1.png"
                  alt="Discovery Flow full catalog - Flow completion display"
                  className="w-full max-w-[600px] border border-gray-300 rounded"
                />
              </div>

              <p>
                <span className="font-semibold">#e</span> It can be stopped by clicking Stop button
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-3">
            <p>
              <span className="font-semibold">#2</span> Once{" "}
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                "Discovery Flow full catalog"
              </span>{" "}
              flow is completed other flows can be tested
            </p>
            <p className="font-medium">Example:- To test Delivery Flow in RET10 domain</p>
            <p className="ml-4">
              After{" "}
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                "Discovery Flow full catalog"
              </span>{" "}
              flow is completed click Play button to start Delivery Flow
            </p>
            <p className="ml-4">Once started click on select and Popup opens as give below</p>

            <div className="my-3 flex justify-center">
              <img
                src="/images/ret-guide-2.png"
                alt="Delivery Flow - Popup and selection"
                className="w-full max-w-[600px] border border-gray-300 rounded"
              />
            </div>

            <p className="ml-4">
              Click the button and paste on_Search. It will display options to select item as given
              below
            </p>
            <div className="my-3 flex justify-center">
              <img
                src="/images/ret-guide-3.png"
                alt="Delivery Flow - Pasting on_search"
                className="w-full max-w-[600px] border border-gray-300 rounded"
              />
            </div>

            <p className="ml-4">Complete the information and submit It will start the flow</p>
          </div>
        </div>
      );
    }

    if (domain.startsWith("ONDC:LOG")) {
      return (
        <div className="space-y-3 text-sm">
          <h2 className="text-base font-semibold text-gray-800">
            For Logistics Domain(LOG10,LOG11)
          </h2>

          <div className="space-y-2">
            <p className="font-medium">
              <span className="font-semibold">#1</span> To test Logistics Buyer app and Seller app
              in Retail Domain
            </p>
            <p className="ml-4">
              To test app start with any Flow like{" "}
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                "FEATURE DISCOVERY flow"
              </span>
            </p>

            <div className="ml-8 space-y-2">
              <p>
                <span className="font-semibold">#a</span> Click Play Button
              </p>

              <div className="my-3 flex justify-center">
                <img
                  src="/images/log-guide-1.png"
                  alt="FEATURE DISCOVERY flow"
                  className="w-full max-w-[600px] border border-gray-300 rounded"
                />
              </div>

              <p>
                <span className="font-semibold">#b</span> Trigger Search from Buyer app if you are
                testing Logistics buyer app.
              </p>
              <p className="ml-4">Once search received Popup will display similar to image below</p>

              <div className="my-3 flex justify-center">
                <img
                  src="/images/log-guide-2.png"
                  alt="Features supported popup"
                  className="w-full max-w-[600px] border border-gray-300 rounded"
                />
              </div>

              <p>
                <span className="font-semibold">#c</span> If testing seller app a popup similar to
                image will display
              </p>

              <div className="my-3 flex justify-center">
                <img
                  src="/images/log-guide-3.png"
                  alt="Seller app form and flow completion"
                  className="w-full max-w-[600px] border border-gray-300 rounded"
                />
              </div>

              <p>Enter the information</p>

              <p>
                <span className="font-semibold">#d</span> Once flow is completed You would see ACK
                or NACK. If any request NACKed then you will see NACK for that request and you can
                check reason Click on action which NACKed and the on right side panel click response
                It will display similar to below image
              </p>

              <p>
                <span className="font-semibold">#e</span> Flow can be stopped by clicking Stop
                button
              </p>
            </div>
          </div>
        </div>
      );
    }

    return <p className="text-sm text-gray-600">No guide available for this domain.</p>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col max-h-[70vh] bg-white rounded-lg">
        <h1 className="text-lg font-semibold text-gray-800 mb-3 sticky top-0 bg-white z-10 pb-2">
          Flow Testing Guide
        </h1>
        <div
          className="overflow-y-auto -mr-6 pr-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db #f3f4f6" }}
        >
          {renderGuideContent()}
        </div>
      </div>
    </Modal>
  );
}
