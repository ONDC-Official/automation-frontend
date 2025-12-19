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
}

interface BPPProvider {
  categories: Category[];
  items: Item[];
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

export const getItemsAndCustomistions = (payload: any) => {
  if (payload.context.domain === "ONDC:RET11") {
    return parseRET11Items(payload);
  }
};

const parseRET11Items = (
  payload: Payload
): { itemList: any; catagoriesList: any; cutomistionToGroupMapping: any } => {
  const catagories = payload.message.catalog["bpp/providers"][0].categories;
  const items = payload.message.catalog["bpp/providers"][0].items;

  const catagoriesList: any = {};
  const itemList: any = {};
  const cutomistionToGroupMapping: any = {};

  catagories.forEach((item) => {
    item.tags.forEach((tag) => {
      if (tag.code === "type") {
        tag.list.forEach((val) => {
          if (val.code === "type" && val.value === "custom_group") {
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
    let isItem = false;
    let customGroup = "";
    item.tags.forEach((tag) => {
      if (tag.code === "type") {
        tag.list.forEach((val) => {
          if (val.code === "type" && val.value === "customization") {
            isCusomistaion = true;
          }
        });
      }

      if (tag.code === "type") {
        tag.list.forEach((val) => {
          if (val.code === "type" && val.value === "item") {
            isItem = true;
          }
        });
      }

      if (tag.code === "custom_group") {
        const idItem = tag.list.find((listItem) => listItem.code === "id");
        if (idItem) {
          customGroup = idItem.value;
        }
      }

      if (tag.code === "parent") {
        const idItem = tag.list.find((listItem) => listItem.code === "id");
        if (idItem) {
          parent = idItem.value;
        }
      }

      if (tag.code === "child") {
        const idItem = tag.list.filter((listItem) => listItem.code === "id");
        if (idItem) {
          child = idItem.map((listItem) => listItem.value);
        }
      }
    });

    if (isCusomistaion) {
      catagoriesList[`${parent}`] = {
        items: {
          ...catagoriesList[`${parent}`]?.items,
          [`${item.id}`]: { child: child },
        },
      };

      cutomistionToGroupMapping[item.id] = parent;
    }

    if (isItem) {
      itemList[`${item.id}`] = customGroup;
    }
  });

  console.log("catagoriesList: ", JSON.stringify(catagoriesList, null, 2));
  console.log("itemList: ", itemList);
  console.log("cutomistionToGroupMapping", cutomistionToGroupMapping);
  return { itemList, catagoriesList, cutomistionToGroupMapping };
};

export const openReportInNewTab = (decodedHtml: any, sessionId: any) => {
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
          }
          button:hover {
            background-color: #0284c7;
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
          <button id="downloadPdfBtn">Download as PDF</button>
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

      iframeDoc.open();
      iframeDoc.write(decodedHtml);
      iframeDoc.close();

      // Step 4: Handle PDF download
      const downloadBtn = newTab.document.getElementById("downloadPdfBtn");
      downloadBtn?.addEventListener("click", () => {
        iframe.contentWindow?.print();
      });
    };
}
