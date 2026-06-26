import { toast } from "react-toastify";

interface TagListItem {
    code: string;
    value: string;
}

interface Tag {
    code: string;
    list: TagListItem[];
}

interface Category {
    id: string;
    tags: Tag[];
}

interface Item {
    id: string;
    tags: Tag[];
    category_id?: string;
    category_ids?: string[];
}

interface BPPProvider {
    id: string;
    categories: Category[];
    items: Item[];
    locations?: unknown[];
}

interface Catalog {
    "bpp/providers": BPPProvider[];
}

interface Message {
    catalog: Catalog;
}

interface Payload {
    message: Message;
}

export const getItemsAndCustomistions = (payload: {
    context: { domain: string };
    message: Message;
}) => {
    if (payload.context.domain === "ONDC:RET11") {
        return parseRET11Items(payload);
    }
};

const parseRET11Items = (
    payload: Payload
): {
    itemList: Record<string, string>;
    catagoriesList: Record<
        string,
        { child?: string[]; items?: Record<string, { child: string[] }> }
    >;
    cutomistionToGroupMapping: Record<string, string>;
} => {
    const providers = payload.message.catalog["bpp/providers"];
    if (!providers || providers.length === 0)
        return { itemList: {}, catagoriesList: {}, cutomistionToGroupMapping: {} };

    const catagoriesList: Record<
        string,
        { child?: string[]; items?: Record<string, { child: string[] }> }
    > = {};
    const itemList: Record<string, string> = {};
    const cutomistionToGroupMapping: Record<string, string> = {};

    providers.forEach((provider) => {
        const catagories = provider.categories || [];
        const items = provider.items || [];

        catagories.forEach((item) => {
            item.tags?.forEach((tag) => {
                if (tag.code === "type") {
                    tag.list?.forEach((val) => {
                        if (
                            val.code === "type" &&
                            (val.value === "custom_group" || val.value === "custom_menu")
                        ) {
                            catagoriesList[item.id] = { child: [] };
                        }
                    });
                }
            });
        });

        items.forEach((item) => {
            let parent = "";
            let child: string[] = [];
            let isCusomistaion = false;
            let customGroup = "";

            // Try to get customGroup from category_ids if present (format category_id:rank or just category_id)
            if (item.category_ids && item.category_ids.length > 0) {
                const firstCatId = item.category_ids[0];
                customGroup = firstCatId.split(":")[0];
            }

            item.tags?.forEach((tag) => {
                if (tag.code === "type") {
                    tag.list?.forEach((val) => {
                        if (val.code === "type" && val.value === "customization") {
                            isCusomistaion = true;
                        }
                    });
                }

                if (tag.code === "custom_group") {
                    const idItem = tag.list?.find((listItem) => listItem.code === "id");
                    if (idItem) {
                        customGroup = idItem.value;
                    }
                }

                if (tag.code === "parent") {
                    const idItem = tag.list?.find((listItem) => listItem.code === "id");
                    if (idItem) {
                        parent = idItem.value;
                    }
                }

                if (tag.code === "child") {
                    const idItem = tag.list?.filter((listItem) => listItem.code === "id");
                    if (idItem) {
                        child = idItem.map((listItem) => listItem.value);
                    }
                }
            });

            if (isCusomistaion) {
                catagoriesList[`${parent}`] = {
                    ...catagoriesList[`${parent}`],
                    items: {
                        ...catagoriesList[`${parent}`]?.items,
                        [`${item.id}`]: { child: child },
                    },
                };

                cutomistionToGroupMapping[item.id] = parent;
            } else {
                // Default to being an item if it's not a customization
                itemList[`${item.id}`] = customGroup;
            }
        });
    });

    return { itemList, catagoriesList, cutomistionToGroupMapping };
};

export const openReportInNewTab = (decodedHtml: string, sessionId: string) => {
    // Step 1: Open new tab
    const newTab = window.open("", "_blank");
    if (!newTab) {
        toast.error("Popup blocked! Please allow popups for this site.");
        return;
    }

    // Step 2: Write a clean shell with header and iframe
    newTab.document.open();
    newTab.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Report - ${sessionId}</title>
        <style>
          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            background: #f8fafc;
          }
          header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 16px;
          }
          iframe {
            border: none;
            width: 100%;
            height: calc(100vh - 60px);
            margin-top: 60px;
          }
          button {
            background-color: #0ea5e9;
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          button:hover:not(:disabled) {
            background-color: #0284c7;
          }
          button:disabled {
            background-color: #94a3b8;
            cursor: not-allowed;
          }
          .loader {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #fff;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            animation: spin 1s linear infinite;
            display: none;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <header>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img
              src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
              alt="Logo"
              style="height: 36px; width: auto;"
            />
            <span style="
              font-size: 1.4rem;
              font-weight: 800;
              background: linear-gradient(to right, #0ea5e9, #38bdf8);
              -webkit-background-clip: text;
              color: transparent;
            ">
              WORKBENCH
            </span>
          </div>
          <button id="downloadPdfBtn">
            <span id="btnText">Download as PDF</span>
            <div id="btnLoader" class="loader"></div>
          </button>
        </header>
        <iframe id="reportFrame"></iframe>
      </body>
      </html>
    `);
    newTab.document.close();

    // Step 3: Write decoded HTML into iframe
    newTab.onload = () => {
        const iframe = newTab.document.getElementById("reportFrame") as HTMLIFrameElement;
        if (!iframe) return;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Inject print optimization CSS to speed up browser's native PDF rendering engine
        // by removing heavy rendering properties during the print phase.
        const printOptimizationStyles = `
            <style>
              @media print {
                * {
                  box-shadow: none !important;
                  text-shadow: none !important;
                  transition: none !important;
                  animation: none !important;
                }
              }
            </style>
        `;

        iframeDoc.open();
        iframeDoc.write(printOptimizationStyles + decodedHtml);
        iframeDoc.close();

        // Step 4: Handle PDF download using native print
        const downloadBtn = newTab.document.getElementById("downloadPdfBtn") as HTMLButtonElement;
        const btnText = newTab.document.getElementById("btnText");
        const btnLoader = newTab.document.getElementById("btnLoader");

        downloadBtn?.addEventListener("click", () => {
            // Show loading UI so the user doesn't think it's frozen
            if (downloadBtn) downloadBtn.disabled = true;
            if (btnText) btnText.innerText = "Opening Print Dialog...";
            if (btnLoader) btnLoader.style.display = "block";

            // Use setTimeout to allow the browser to paint the loading UI
            // before the print dialog completely blocks the thread
            setTimeout(() => {
                iframe.contentWindow?.print();

                // Restore UI after print dialog closes
                if (downloadBtn) downloadBtn.disabled = false;
                if (btnText) btnText.innerText = "Download as PDF";
                if (btnLoader) btnLoader.style.display = "none";
            }, 100);
        });
    };
};
