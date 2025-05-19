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
