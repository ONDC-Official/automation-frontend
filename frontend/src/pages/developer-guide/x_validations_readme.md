

- **search** : All the following sub conditions must pass as per the api requirement

	- **SEARCH_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["search"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["search"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **SEARCH_CATEGORY_CODE** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_CATEGORY_CODE**
		
		- $.message.intent.category.descriptor.code must be present in the payload
		
		#### **VALID_ENUM_CATEGORY_CODE**
		
		- All elements of $.message.intent.category.descriptor.code must be in ["GOLD_LOAN", "PERSONAL_LOAN"]
		
		> **Skip if:**
		>
		>     - $.message.intent.category.descriptor.code is not in the payload
	
	- **SEARCH_PAYMENT** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_COLLECTED_BY**
		
		- $.message.intent.payment.collected_by must be present in the payload
		
		#### **VALID_PAYMENT_COLLECTED_BY_ENUM**
		
		- At least one of $.message.intent.payment.collected_by must be in ["BPP", "BAP"]
		
		> **Skip if:**
		>
		>     - $.message.intent.payment.collected_by is not in the payload
		
		- **REQUIRED_PAYMENT_TAGS_GROUPS** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_BUYER_FINDER_FEES_TAG**
			
			- At least one of $.message.intent.payment.tags[*].descriptor.code must be in ["BUYER_FINDER_FEES"]
			
			#### **REQUIRED_BUYER_FINDER_FEES_LIST**
			
			- All elements of $.message.intent.payment.tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[*].descriptor.code must be in ["BUYER_FINDER_FEES_TYPE", "BUYER_FINDER_FEES_PERCENTAGE"]
			
			> **Skip if:**
			>
			>     - $.message.intent.payment.tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[*].descriptor.code is not in the payload
			
			#### **VALID_BUYER_FINDER_FEES_TYPE_VALUE**
			
			- All elements of $.message.intent.payment.tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[?(@.descriptor.code=='BUYER_FINDER_FEES_TYPE')].value must be in ["percent-annualized", "percent", "amount"]
			
			#### **REQUIRED_SETTLEMENT_TERMS_TAG**
			
			- At least one of $.message.intent.payment.tags[*].descriptor.code must be in ["SETTLEMENT_TERMS"]
			
			#### **REQUIRED_SETTLEMENT_TERMS_LIST**
			
			- All elements of $.message.intent.payment.tags[?(@.descriptor.code=='SETTLEMENT_TERMS')].list[*].descriptor.code must be in ["DELAY_INTEREST", "STATIC_TERMS", "OFFLINE_CONTRACT"]
			
			> **Skip if:**
			>
			>     - $.message.intent.payment.tags[?(@.descriptor.code=='SETTLEMENT_TERMS')].list[*].descriptor.code is not in the payload

- **on_search** : All the following sub conditions must pass as per the api requirement

	- **ON_SEARCH_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_search"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_search"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	#### **ON_SEARCH_CATALOG_NAME**
	
	- $.message.catalog.descriptor.name must be present in the payload
	
	- **ON_SEARCH_CATEGORIES** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_CATEGORIES_NAME**
		
		- $.message.catalog.providers[*].categories[*].descriptor.name must be present in the payload
		
		#### **REQUIRED_CATEGORIES_CODE**
		
		- $.message.catalog.providers[*].categories[*].descriptor.code must be present in the payload
		
		#### **VALID_ENUM_CATEGORIES_CODE**
		
		- All elements of $.message.catalog.providers[*].categories[*].descriptor.code must be in ["PERSONAL_LOAN", "BUREAU_LOAN", "AA_PERSONAL_LOAN", "GOLD_LOAN", "AA_LOAN", "LOAN", "PERSONAL_INFORMATION"]
		
		#### **REQUIRED_CATEGORIES_ID**
		
		- $.message.catalog.providers[*].categories[*].id must be present in the payload
		
		#### **REQUIRED_CATEGORIES_PARENT_ID**
		
		- $.message.catalog.providers[*].categories[*].parent_category_id must be present in the payload
		
		> **Skip if:**
		>
		>     - any of ["BUREAU_LOAN", "AA_LOAN", "PERSONAL_LOAN", "AA_PERSONAL_LOAN", "GOLD_LOAN"] are in $.message.catalog.providers[*].categories[*].descriptor.code
	
	- **ON_SEARCH_PROVIDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PROVIDER_ID**
		
		- $.message.catalog.providers[*].id must be present in the payload
		
		#### **REQUIRED_PROVIDER_NAME**
		
		- $.message.catalog.providers[*].descriptor.name must be present in the payload
		
		#### **REQUIRED_PROVIDER_IMAGES_URL**
		
		- $.message.catalog.providers[*].descriptor.images[*].url must be present in the payload
		
		#### **REQUIRED_PROVIDER_IMAGES_SIZE_TYPE**
		
		- $.message.catalog.providers[*].descriptor.images[*].size_type must be present in the payload
	
	- **ON_SEARCH_PROVIDER_CONTACT_INFO** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_CONTACT_INFO_TAG_GROUP**
		
		- At least one of $.message.catalog.providers[*].tags[*].descriptor.code must be in ["CONTACT_INFO"]
		
		#### **REQUIRED_CONTACT_INFO_LIST**
		
		- All elements of $.message.catalog.providers[*].tags[?(@.descriptor.code=='CONTACT_INFO')].list[*].descriptor.code must be in ["GRO_NAME", "GRO_EMAIL", "GRO_CONTACT_NUMBER", "CUSTOMER_SUPPORT_LINK", "CUSTOMER_SUPPORT_CONTACT_NUMBER", "CUSTOMER_SUPPORT_EMAIL"]
		
		> **Skip if:**
		>
		>     - $.message.catalog.providers[*].tags[?(@.descriptor.code=='CONTACT_INFO')].list[*].descriptor.code is not in the payload
	
	- **ON_SEARCH_PROVIDER_LSP_INFO** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_LSP_INFO_TAG_GROUP**
		
		- At least one of $.message.catalog.providers[*].tags[*].descriptor.code must be in ["LSP_INFO"]
		
		#### **REQUIRED_LSP_INFO_LIST**
		
		- All elements of $.message.catalog.providers[*].tags[?(@.descriptor.code=='LSP_INFO')].list[*].descriptor.code must be in ["LSP_NAME", "LSP_EMAIL", "LSP_CONTACT_NUMBER", "LSP_ADDRESS"]
		
		> **Skip if:**
		>
		>     - $.message.catalog.providers[*].tags[?(@.descriptor.code=='LSP_INFO')].list[*].descriptor.code is not in the payload
	
	- **ON_SEARCH_PAYMENT** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_COLLECTED_BY**
		
		- $.message.catalog.providers[*].payments[*].collected_by must be present in the payload
		
		#### **VALID_PAYMENT_COLLECTED_BY_ENUM**
		
		- All elements of $.message.catalog.providers[*].payments[*].collected_by must be in ["BPP", "BAP"]
		
		#### **REQUIRED_BUYER_FINDER_FEES_TAG**
		
		- At least one of $.message.catalog.providers[*].payments[*].tags[*].descriptor.code must be in ["BUYER_FINDER_FEES"]
		
		#### **REQUIRED_BUYER_FINDER_FEES_LIST**
		
		- All elements of $.message.catalog.providers[*].payments[*].tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[*].descriptor.code must be in ["BUYER_FINDER_FEES_TYPE", "BUYER_FINDER_FEES_PERCENTAGE"]
		
		> **Skip if:**
		>
		>     - $.message.catalog.providers[*].payments[*].tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[*].descriptor.code is not in the payload
		
		#### **VALID_BUYER_FINDER_FEES_TYPE_VALUE**
		
		- All elements of $.message.catalog.providers[*].payments[*].tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[?(@.descriptor.code=='BUYER_FINDER_FEES_TYPE')].value must be in ["PERCENT_ANNUALIZED"]
		
		#### **REQUIRED_SETTLEMENT_TERMS_TAG**
		
		- At least one of $.message.catalog.providers[*].payments[*].tags[*].descriptor.code must be in ["SETTLEMENT_TERMS"]
		
		#### **REQUIRED_SETTLEMENT_TERMS_LIST**
		
		- All elements of $.message.catalog.providers[*].payments[*].tags[?(@.descriptor.code=='SETTLEMENT_TERMS')].list[*].descriptor.code must be in ["SETTLEMENT_WINDOW", "SETTLEMENT_BASIS", "MANDATORY_ARBITRATION", "COURT_JURISDICTION", "STATIC_TERMS", "OFFLINE_CONTRACT"]
		
		> **Skip if:**
		>
		>     - $.message.catalog.providers[*].payments[*].tags[?(@.descriptor.code=='SETTLEMENT_TERMS')].list[*].descriptor.code is not in the payload
	
	- **ON_SEARCH_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.catalog.providers[*].items[*].id must be present in the payload
		
		#### **REQUIRED_ITEM_CATEGORY_IDS**
		
		- $.message.catalog.providers[*].items[*].category_ids[*] must be present in the payload
		
		#### **REQUIRED_ITEM_DESCRIPTOR_NAME**
		
		- $.message.catalog.providers[*].items[*].descriptor.name must be present in the payload
		
		#### **REQUIRED_GENERAL_INFO_TAG_GROUP**
		
		- At least one of $.message.catalog.providers[*].items[*].tags[*].descriptor.code must be in ["GENERAL_INFO"]
		
		#### **REQUIRED_GENERAL_INFO_LIST**
		
		- All elements of $.message.catalog.providers[*].items[*].tags[?(@.descriptor.code=='GENERAL_INFO')].list[*].descriptor.code must be in ["MIN_INTEREST_RATE", "MAX_INTEREST_RATE", "MIN_TENURE", "MAX_TENURE", "MIN_LOAN_AMOUNT", "MAX_LOAN_AMOUNT"]
		
		> **Skip if:**
		>
		>     - $.message.catalog.providers[*].items[*].tags[?(@.descriptor.code=='GENERAL_INFO')].list[*].descriptor.code is not in the payload
		
		#### **REQUIRED_XINPUT**
		
		- $.message.catalog.providers[*].items[*].xinput.required must be present in the payload
		
		#### **REQUIRED_XINPUT_FORM_URL**
		
		- $.message.catalog.providers[*].items[*].xinput.form.url must be present in the payload
		
		#### **VALID_XINPUT_HEADINGS_ENUM**
		
		- All elements of $.message.catalog.providers[*].items[*].xinput.head.headings[*] must be in ["KYC", "BUREAU_CONSENT", "AA_CONSENT", "Personal Information", "Set Loan Amount", "Know your Customer", "Account Information", "Emandate", "Loan Agreement", "PERSONAL_INFORMATION", "Loan Details"]

- **select** : All the following sub conditions must pass as per the api requirement

	- **SELECT_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["select"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["select"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	#### **SELECT_PROVIDER_ID**
	
	- $.message.order.provider.id must be present in the payload
	
	- **SELECT_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.order.items[*].id must be present in the payload
	
	- **SELECT_XINPUT_PERSONAL_LOAN** : All the following sub conditions must pass as per the api requirement
	
		- **REQUIRED_XINPUT_HEAD_INDEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_XINPUT_HEAD_INDEX_MIN**
			
			- $.message.order.items[*].xinput.head.index.min must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_CUR**
			
			- $.message.order.items[*].xinput.head.index.cur must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_MAX**
			
			- $.message.order.items[*].xinput.head.index.max must be present in the payload

- **on_select** : All the following sub conditions must pass as per the api requirement

	- **ON_SELECT_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_select"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_select"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **ON_SELECT_PROVIDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PROVIDER_ID**
		
		- $.message.order.provider.id must be present in the payload
		
		#### **REQUIRED_PROVIDER_NAME**
		
		- $.message.order.provider.descriptor.name must be present in the payload
	
	- **ON_SELECT_PROVIDER_LOCATIONS_GOLD** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PROVIDER_LOCATIONS**
		
		- $.message.order.provider.locations[*].id must be present in the payload
		
		#### **REQUIRED_PROVIDER_LOCATION_GPS**
		
		- $.message.order.provider.locations[*].gps must be present in the payload
		
		#### **REQUIRED_PROVIDER_LOCATION_ADDRESS**
		
		- $.message.order.provider.locations[*].address must be present in the payload
	
	- **ON_SELECT_PROVIDER_TAGS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_CONTACT_INFO_TAG_GROUP**
		
		- At least one of $.message.order.provider.tags[*].descriptor.code must be in ["CONTACT_INFO"]
		
		#### **REQUIRED_CONTACT_INFO_LIST**
		
		- All elements of $.message.order.provider.tags[?(@.descriptor.code=='CONTACT_INFO')].list[*].descriptor.code must be in ["GRO_NAME", "GRO_EMAIL", "GRO_CONTACT_NUMBER", "GRO_DESIGNATION", "GRO_ADDRESS", "CUSTOMER_SUPPORT_LINK", "CUSTOMER_SUPPORT_CONTACT_NUMBER", "CUSTOMER_SUPPORT_EMAIL"]
		
		> **Skip if:**
		>
		>     - $.message.order.provider.tags[?(@.descriptor.code=='CONTACT_INFO')].list[*].descriptor.code is not in the payload
		
		#### **REQUIRED_LSP_INFO_TAG_GROUP**
		
		- At least one of $.message.order.provider.tags[*].descriptor.code must be in ["LSP_INFO"]
		
		#### **REQUIRED_LSP_INFO_LIST**
		
		- All elements of $.message.order.provider.tags[?(@.descriptor.code=='LSP_INFO')].list[*].descriptor.code must be in ["LSP_NAME", "LSP_EMAIL", "LSP_CONTACT_NUMBER", "LSP_ADDRESS"]
		
		> **Skip if:**
		>
		>     - $.message.order.provider.tags[?(@.descriptor.code=='LSP_INFO')].list[*].descriptor.code is not in the payload
	
	- **ON_SELECT_ITEMS_BASIC** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.order.items[*].id must be present in the payload
		
		#### **REQUIRED_ITEM_DESCRIPTOR_CODE**
		
		- $.message.order.items[*].descriptor.code must be present in the payload
		
		#### **VALID_ITEM_DESCRIPTOR_CODE_ENUM**
		
		- All elements of $.message.order.items[*].descriptor.code must be in ["LOAN", "PERSONAL_LOAN"]
		
		#### **REQUIRED_ITEM_DESCRIPTOR_NAME**
		
		- $.message.order.items[*].descriptor.name must be present in the payload
	
	- **ON_SELECT_1_AA_CONSENT_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_CONSENT_INFO_TAG**
		
		- At least one of $.message.order.items[*].tags[*].descriptor.code must be in ["CONSENT_INFO"]
		
		#### **REQUIRED_CONSENT_HANDLER**
		
		- At least one of $.message.order.items[*].tags[?(@.descriptor.code=='CONSENT_INFO')].list[*].descriptor.code must be in ["CONSENT_HANDLER"]
	
	- **ON_SELECT_1_AA_CONSENT_XINPUT** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_XINPUT_FORM**
		
		- $.message.order.items[*].xinput.form.id must be present in the payload
		
		#### **REQUIRED_XINPUT_FORM_RESPONSE**
		
		- $.message.order.items[*].xinput.form_response.status must be present in the payload
		
		#### **VALID_XINPUT_FORM_RESPONSE_STATUS**
		
		- All elements of $.message.order.items[*].xinput.form_response.status must be in ["PENDING", "SUCCESS"]
		
		#### **REQUIRED_XINPUT_FORM_RESPONSE_SUBMISSION_ID**
		
		- $.message.order.items[*].xinput.form_response.submission_id must be present in the payload
	
	- **ON_SELECT_2_OFFER_ITEMS_PRICE** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_PRICE**
		
		- $.message.order.items[*].price.value must be present in the payload
		
		#### **REQUIRED_ITEM_PRICE_CURRENCY**
		
		- All elements of $.message.order.items[*].price.currency must be in ["INR"]
	
	- **ON_SELECT_2_OFFER_LOAN_INFO** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_LOAN_INFO_TAG_GROUP**
		
		- At least one of $.message.order.items[*].tags[*].descriptor.code must be in ["LOAN_INFO"]
		
		#### **REQUIRED_LOAN_INFO_LIST_COMMON**
		
		- At least one of $.message.order.items[*].tags[?(@.descriptor.code=='LOAN_INFO')].list[*].descriptor.code must be in ["INTEREST_RATE", "TERM", "INTEREST_RATE_TYPE", "APPLICATION_FEE", "FORECLOSURE_FEE", "INTEREST_RATE_CONVERSION_CHARGE", "DELAY_PENALTY_FEE", "OTHER_PENALTY_FEE", "ANNUAL_PERCENTAGE_RATE", "REPAYMENT_FREQUENCY", "NUMBER_OF_INSTALLMENTS_OF_REPAYMENT", "TNC_LINK", "COOL_OFF_PERIOD", "INSTALLMENT_AMOUNT"]
		
		> **Skip if:**
		>
		>     - $.message.order.items[*].tags[?(@.descriptor.code=='LOAN_INFO')].list[*].descriptor.code is not in the payload
		
		#### **REQUIRED_LOAN_INFO_LTV_RATIO_GOLD**
		
		- At least one of $.message.order.items[?(@.descriptor.code=='LOAN')].tags[?(@.descriptor.code=='LOAN_INFO')].list[*].descriptor.code must be in ["LTV_RATIO"]
	
	- **ON_SELECT_2_OFFER_QUOTE** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_QUOTE_ID**
		
		- $.message.order.quote.id must be present in the payload
		
		- **REQUIRED_QUOTE_PRICE** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_QUOTE_PRICE_VALUE**
			
			- $.message.order.quote.price.value must be present in the payload
			
			#### **REQUIRED_QUOTE_PRICE_CURRENCY**
			
			- All elements of $.message.order.quote.price.currency must be in ["INR"]
		
		- **REQUIRED_QUOTE_BREAKUP** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_QUOTE_BREAKUP_TITLE**
			
			- $.message.order.quote.breakup[*].title must be present in the payload
			
			#### **VALID_QUOTE_BREAKUP_TITLE_ENUM**
			
			- At least one of $.message.order.quote.breakup[*].title must be in ["PRINCIPAL", "INTEREST", "PROCESSING_FEE", "OTHER_UPFRONT_CHARGES", "INSURANCE_CHARGES", "NET_DISBURSED_AMOUNT", "OTHER_CHARGES"]
			
			#### **REQUIRED_QUOTE_BREAKUP_PRICE**
			
			- $.message.order.quote.breakup[*].price.value must be present in the payload
			
			#### **REQUIRED_QUOTE_BREAKUP_PRICE_CURRENCY**
			
			- All elements of $.message.order.quote.breakup[*].price.currency must be in ["INR"]
		
		#### **REQUIRED_QUOTE_TTL**
		
		- $.message.order.quote.ttl must be present in the payload
	
	- **ON_SELECT_2_OFFER_FULFILLMENT_GOLD** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_FULFILLMENT_TYPE**
		
		- All elements of $.message.order.fulfillments[*].type must be in ["LOAN"]
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].type is not in the payload
		
		#### **REQUIRED_FULFILLMENT_AGENT_NAME**
		
		- $.message.order.fulfillments[*].agent.person.name must be present in the payload
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].agent.person.name is not in the payload
		
		#### **REQUIRED_FULFILLMENT_AGENT_CONTACT**
		
		- $.message.order.fulfillments[*].agent.contact.phone must be present in the payload
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].agent.contact.phone is not in the payload
	
	- **ON_SELECT_2_OFFER_XINPUT_COMMON** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_XINPUT_REQUIRED**
		
		- $.message.order.items[*].xinput.required must be present in the payload
		
		#### **REQUIRED_XINPUT_FORM_ID**
		
		- $.message.order.items[*].xinput.form.id must be present in the payload
		
		#### **REQUIRED_XINPUT_FORM_URL**
		
		- $.message.order.items[*].xinput.form.url must be present in the payload
	
	- **ON_SELECT_2_OFFER_XINPUT_PERSONAL_LOAN** : All the following sub conditions must pass as per the api requirement
	
		- **REQUIRED_XINPUT_HEAD_INDEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_XINPUT_HEAD_INDEX_MIN**
			
			- $.message.order.items[*].xinput.head.index.min must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_CUR**
			
			- $.message.order.items[*].xinput.head.index.cur must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_MAX**
			
			- $.message.order.items[*].xinput.head.index.max must be present in the payload
		
		#### **REQUIRED_XINPUT_HEAD_DESCRIPTOR_NAME**
		
		- $.message.order.items[*].xinput.head.descriptor.name must be present in the payload
		
		#### **REQUIRED_XINPUT_HEAD_HEADINGS**
		
		- $.message.order.items[*].xinput.head.headings[*] must be present in the payload
	
	- **ON_SELECT_2_OFFER_XINPUT_GOLD** : All the following sub conditions must pass as per the api requirement
	
		- **REQUIRED_XINPUT_HEAD_INDEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_XINPUT_HEAD_INDEX_MIN**
			
			- $.message.order.items[*].xinput.head.index.min must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_CUR**
			
			- $.message.order.items[*].xinput.head.index.cur must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_MAX**
			
			- $.message.order.items[*].xinput.head.index.max must be present in the payload
		
		#### **REQUIRED_XINPUT_HEAD_DESCRIPTOR_NAME**
		
		- $.message.order.items[*].xinput.head.descriptor.name must be present in the payload
		
		#### **REQUIRED_XINPUT_HEAD_HEADINGS**
		
		- $.message.order.items[*].xinput.head.headings[*] must be present in the payload

- **init** : All the following sub conditions must pass as per the api requirement

	- **INIT_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["init"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["init"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	#### **INIT_PROVIDER_ID**
	
	- $.message.order.provider.id must be present in the payload
	
	- **INIT_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.order.items[*].id must be present in the payload
	
	- **INIT_XINPUT_PERSONAL_LOAN** : All the following sub conditions must pass as per the api requirement
	
		- **REQUIRED_XINPUT_HEAD_INDEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_XINPUT_HEAD_INDEX_MIN**
			
			- $.message.order.items[*].xinput.head.index.min must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_CUR**
			
			- $.message.order.items[*].xinput.head.index.cur must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_MAX**
			
			- $.message.order.items[*].xinput.head.index.max must be present in the payload

- **on_init** : All the following sub conditions must pass as per the api requirement

	- **ON_INIT_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_init"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_init"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **ON_INIT_PROVIDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PROVIDER_ID**
		
		- $.message.order.provider.id must be present in the payload
		
		#### **REQUIRED_PROVIDER_NAME**
		
		- $.message.order.provider.descriptor.name must be present in the payload
		
		- **REQUIRED_PROVIDER_TAGS** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTACT_INFO_TAG_GROUP**
			
			- At least one of $.message.order.provider.tags[*].descriptor.code must be in ["CONTACT_INFO"]
			
			#### **REQUIRED_LSP_INFO_TAG_GROUP**
			
			- At least one of $.message.order.provider.tags[*].descriptor.code must be in ["LSP_INFO"]
	
	- **ON_INIT_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.order.items[*].id must be present in the payload
		
		#### **REQUIRED_ITEM_DESCRIPTOR_CODE**
		
		- All elements of $.message.order.items[*].descriptor.code must be in ["LOAN", "PERSONAL_LOAN"]
		
		#### **REQUIRED_ITEM_PRICE_VALUE**
		
		- $.message.order.items[*].price.value must be present in the payload
		
		#### **REQUIRED_ITEM_PRICE_CURRENCY**
		
		- All elements of $.message.order.items[*].price.currency must be in ["INR"]
		
		#### **REQUIRED_LOAN_INFO_TAG_GROUP**
		
		- At least one of $.message.order.items[*].tags[*].descriptor.code must be in ["LOAN_INFO"]
	
	- **ON_INIT_QUOTE** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_QUOTE_ID**
		
		- $.message.order.quote.id must be present in the payload
		
		#### **REQUIRED_QUOTE_PRICE**
		
		- $.message.order.quote.price.value must be present in the payload
		
		#### **REQUIRED_QUOTE_PRICE_CURRENCY**
		
		- All elements of $.message.order.quote.price.currency must be in ["INR"]
		
		#### **REQUIRED_QUOTE_TTL**
		
		- $.message.order.quote.ttl must be present in the payload
		
		#### **VALID_QUOTE_TTL_REGEX**
		
		- All elements of $.message.order.quote.ttl must follow every regex in ["^P(?:(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?|T\\d+D)$"]
		
		#### **REQUIRED_QUOTE_BREAKUP**
		
		- At least one of $.message.order.quote.breakup[*].title must be in ["PRINCIPAL", "INTEREST", "PROCESSING_FEE", "OTHER_UPFRONT_CHARGES", "INSURANCE_CHARGES", "NET_DISBURSED_AMOUNT", "OTHER_CHARGES"]
	
	- **ON_INIT_PAYMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_TYPE**
		
		- $.message.order.payments[*].type must be present in the payload
		
		#### **VALID_PAYMENT_TYPE_ENUM**
		
		- All elements of $.message.order.payments[*].type must be in ["ON_ORDER", "ON_FULFILLMENT", "POST_FULFILLMENT"]
	
	- **ON_INIT_PAYMENTS_ON_ORDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_COLLECTED_BY**
		
		- $.message.order.payments[?(@.type=='ON_ORDER')].collected_by must be present in the payload
		
		- **REQUIRED_PAYMENT_TAGS** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_BUYER_FINDER_FEES_TAG**
			
			- At least one of $.message.order.payments[?(@.type=='ON_ORDER')].tags[*].descriptor.code must be in ["BUYER_FINDER_FEES"]
			
			#### **REQUIRED_SETTLEMENT_TERMS_TAG**
			
			- At least one of $.message.order.payments[?(@.type=='ON_ORDER')].tags[*].descriptor.code must be in ["SETTLEMENT_TERMS"]
	
	- **ON_INIT_FULFILLMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_FULFILLMENT_TYPE**
		
		- All elements of $.message.order.fulfillments[*].type must be in ["LOAN"]
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].type is not in the payload
		
		#### **REQUIRED_FULFILLMENT_CUSTOMER_PERSON_NAME**
		
		- $.message.order.fulfillments[*].customer.person.name must be present in the payload
		
		#### **REQUIRED_FULFILLMENT_STATE_CODE**
		
		- $.message.order.fulfillments[*].state.descriptor.code must be present in the payload
	
	- **ON_INIT_XINPUT_PERSONAL_LOAN** : All the following sub conditions must pass as per the api requirement
	
		- **REQUIRED_XINPUT_HEAD_INDEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_XINPUT_HEAD_INDEX_MIN**
			
			- $.message.order.items[*].xinput.head.index.min must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_CUR**
			
			- $.message.order.items[*].xinput.head.index.cur must be present in the payload
			
			#### **REQUIRED_XINPUT_HEAD_INDEX_MAX**
			
			- $.message.order.items[*].xinput.head.index.max must be present in the payload
		
		#### **REQUIRED_XINPUT_HEAD_DESCRIPTOR_NAME**
		
		- $.message.order.items[*].xinput.head.descriptor.name must be present in the payload
		
		#### **REQUIRED_XINPUT_HEAD_HEADINGS**
		
		- $.message.order.items[*].xinput.head.headings[*] must be present in the payload

- **confirm** : All the following sub conditions must pass as per the api requirement

	- **CONFIRM_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["confirm"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["confirm"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	#### **CONFIRM_PROVIDER_ID**
	
	- $.message.order.provider.id must be present in the payload
	
	- **CONFIRM_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.order.items[*].id must be present in the payload
	
	- **CONFIRM_PAYMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_PARAMS_BANK_CODE**
		
		- $.message.order.payments[*].params.bank_code must be present in the payload
		
		#### **REQUIRED_PAYMENT_PARAMS_BANK_ACCOUNT**
		
		- $.message.order.payments[*].params.bank_account_number must be present in the payload
		
		#### **REQUIRED_PAYMENT_PARAMS_VPA**
		
		- $.message.order.payments[*].params.virtual_payment_address must be present in the payload

- **on_confirm** : All the following sub conditions must pass as per the api requirement

	- **ON_CONFIRM_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_confirm"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_confirm"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **ON_CONFIRM_PROVIDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PROVIDER_ID**
		
		- $.message.order.provider.id must be present in the payload
		
		#### **REQUIRED_PROVIDER_NAME**
		
		- $.message.order.provider.descriptor.name must be present in the payload
		
		- **REQUIRED_PROVIDER_TAGS** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTACT_INFO_TAG_GROUP**
			
			- At least one of $.message.order.provider.tags[*].descriptor.code must be in ["CONTACT_INFO"]
			
			#### **REQUIRED_LSP_INFO_TAG_GROUP**
			
			- At least one of $.message.order.provider.tags[*].descriptor.code must be in ["LSP_INFO"]
	
	- **ON_CONFIRM_ITEMS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ITEM_ID**
		
		- $.message.order.items[*].id must be present in the payload
		
		#### **REQUIRED_ITEM_DESCRIPTOR_CODE**
		
		- All elements of $.message.order.items[*].descriptor.code must be in ["LOAN", "PERSONAL_LOAN"]
		
		#### **REQUIRED_ITEM_PRICE**
		
		- $.message.order.items[*].price.value must be present in the payload
		
		#### **REQUIRED_LOAN_INFO_TAG**
		
		- At least one of $.message.order.items[*].tags[*].descriptor.code must be in ["LOAN_INFO"]
	
	- **ON_CONFIRM_QUOTE** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_QUOTE_ID**
		
		- $.message.order.quote.id must be present in the payload
		
		#### **REQUIRED_QUOTE_PRICE**
		
		- $.message.order.quote.price.value must be present in the payload
		
		#### **REQUIRED_QUOTE_BREAKUP**
		
		- At least one of $.message.order.quote.breakup[*].title must be in ["PRINCIPAL", "INTEREST", "PROCESSING_FEE", "OTHER_UPFRONT_CHARGES", "INSURANCE_CHARGES", "NET_DISBURSED_AMOUNT", "OTHER_CHARGES"]
	
	- **ON_CONFIRM_FULFILLMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_FULFILLMENT_TYPE**
		
		- All elements of $.message.order.fulfillments[*].type must be in ["LOAN"]
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].type is not in the payload
		
		#### **REQUIRED_FULFILLMENT_STATE_DESCRIPTOR_CODE**
		
		- $.message.order.fulfillments[*].state.descriptor.code must be present in the payload
		
		#### **VALID_FULFILLMENT_STATE_ENUM**
		
		- All elements of $.message.order.fulfillments[*].state.descriptor.code must be in ["DISBURSED", "SANCTIONED"]
		
		#### **REQUIRED_FULFILLMENT_CUSTOMER**
		
		- $.message.order.fulfillments[*].customer.person.name must be present in the payload
	
	- **ON_CONFIRM_PAYMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_TYPE**
		
		- All elements of $.message.order.payments[*].type must be in ["ON_ORDER", "ON_FULFILLMENT", "POST_FULFILLMENT"]
		
		#### **REQUIRED_PAYMENT_STATUS**
		
		- $.message.order.payments[*].status must be present in the payload
		
		#### **VALID_PAYMENT_STATUS_ENUM**
		
		- All elements of $.message.order.payments[*].status must be in ["PAID", "NOT-PAID"]
	
	- **ON_CONFIRM_PAYMENTS_COLLECTED_BY** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_COLLECTED_BY**
		
		- All elements of $.message.order.payments[?(@.type=='ON_ORDER')].collected_by must be in ["BPP", "BAP"]
	
	- **ON_CONFIRM_DOCUMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_DOCUMENT_DESCRIPTOR_CODE**
		
		- $.message.order.documents[*].descriptor.code must be present in the payload
		
		#### **REQUIRED_DOCUMENT_URL**
		
		- $.message.order.documents[*].url must be present in the payload
		
		#### **REQUIRED_DOCUMENT_MIME_TYPE**
		
		- All elements of $.message.order.documents[*].mime_type must be in ["application/pdf", "text/html"]
	
	#### **ON_CONFIRM_CANCELLATION_TERMS**
	
	- All elements of $.message.order.cancellation_terms[*].fulfillment_state.descriptor.code must be in ["SANCTIONED", "DISBURSED"]

- **update** : All the following sub conditions must pass as per the api requirement

	- **UPDATE_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["update"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["update"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	#### **UPDATE_ORDER_ID**
	
	- $.message.order.id must be present in the payload
	
	- **UPDATE_PAYMENT_TARGET** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_TYPE**
		
		- All elements of $.message.order.payments[*].type must be in ["POST_FULFILLMENT", "ON_ORDER"]
		
		#### **REQUIRED_PAYMENT_TIME_LABEL**
		
		- $.message.order.payments[*].time.label must be present in the payload
		
		#### **VALID_PAYMENT_TIME_LABEL_ENUM**
		
		- All elements of $.message.order.payments[*].time.label must be in ["PRE_PART_PAYMENT", "INSTALLMENT", "FORECLOSURE", "MISSED_EMI_PAYMENT"]
		
		#### **REQUIRED_PAYMENT_PARAMS_AMOUNT**
		
		- $.message.order.payments[*].params.amount must be present in the payload
	
	- **UPDATE_PAYMENT_REF_ID_GOLD** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_REF_ID**
		
		- $.message.order.payments[*].tags[?(@.descriptor.code=='LOAN_REPAYMENT')].list[?(@.descriptor.code=='ref_id')].value must be present in the payload
	
	- **UPDATE_FULFILLMENT_TARGET** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_FULFILLMENT_STATE_CODE**
		
		- $.message.order.fulfillments[*].state.descriptor.code must be present in the payload
		
		#### **VALID_FULFILLMENT_STATE_ENUM**
		
		- All elements of $.message.order.fulfillments[*].state.descriptor.code must be in ["INITIATED", "SANCTIONED", "DISBURSED", "PENDING", "REJECTED", "COMPLETED", "CONSENT_REQUIRED", "APPROVED"]

- **on_update** : All the following sub conditions must pass as per the api requirement

	- **ON_UPDATE_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_update"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_update"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **ON_UPDATE_ORDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ORDER_ID**
		
		- $.message.order.id must be present in the payload
		
		#### **REQUIRED_ORDER_PROVIDER_ID**
		
		- $.message.order.provider.id must be present in the payload
		
		#### **REQUIRED_ORDER_ITEMS**
		
		- $.message.order.items[*].id must be present in the payload
	
	- **ON_UPDATE_FULFILLMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_FULFILLMENT_TYPE**
		
		- All elements of $.message.order.fulfillments[*].type must be in ["LOAN"]
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].type is not in the payload
		
		#### **REQUIRED_FULFILLMENT_STATE_CODE**
		
		- All elements of $.message.order.fulfillments[*].state.descriptor.code must be in ["INITIATED", "SANCTIONED", "DISBURSED", "PENDING", "REJECTED", "COMPLETED", "CONSENT_REQUIRED", "APPROVED"]
	
	- **ON_UPDATE_PAYMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_TYPE**
		
		- $.message.order.payments[*].type must be present in the payload
		
		#### **REQUIRED_PAYMENT_STATUS**
		
		- $.message.order.payments[*].status must be present in the payload
		
		#### **VALID_PAYMENT_STATUS_ENUM**
		
		- All elements of $.message.order.payments[*].status must be in ["PAID", "NOT-PAID", "FAILED", "DELAYED", "DEFERRED"]
	
	- **ON_UPDATE_QUOTE** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_QUOTE_BREAKUP_TITLE**
		
		- $.message.order.quote.breakup[*].title must be present in the payload
		
		#### **VALID_QUOTE_BREAKUP_TITLE_ON_UPDATE_ENUM**
		
		- At least one of $.message.order.quote.breakup[*].title must be in ["PRINCIPAL", "INTEREST", "PROCESSING_FEE", "OTHER_UPFRONT_CHARGES", "INSURANCE_CHARGES", "NET_DISBURSED_AMOUNT", "OTHER_CHARGES", "LATE_FEE_AMOUNT", "OUTSTANDING_PRINCIPAL", "FORCLOSUER_CHARGES", "OUTSTANDING_INTEREST", "PRE_PAYMENT_CHARGE", "INSURANCE_TOTAL_FEE", "INSURANCE_PRODUCT_FEE", "TAX"]
		
		#### **REQUIRED_QUOTE_BREAKUP_PRICE**
		
		- $.message.order.quote.breakup[*].price.value must be present in the payload

- **status** : All the following sub conditions must pass as per the api requirement

	- **STATUS_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["status"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["status"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **STATUS_ORDER_ID_PERSONAL_LOAN** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_STATUS_ORDER_ID**
		
		- $.message.order_id must be present in the payload
	
	- **STATUS_REF_ID_GOLD_LOAN** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_STATUS_REF_ID**
		
		- $.message.ref_id must be present in the payload

- **on_status** : All the following sub conditions must pass as per the api requirement

	- **ON_STATUS_CONTEXT** : All the following sub conditions must pass as per the api requirement
	
		- **CONTEXT_REQUIRED** : All the following sub conditions must pass as per the api requirement
		
			#### **REQUIRED_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- $.context.location.country.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_LOCATION_CITY_CODE**
			
			- $.context.location.city.code must be present in the payload
			
			#### **REQUIRED_CONTEXT_DOMAIN**
			
			- $.context.domain must be present in the payload
			
			#### **REQUIRED_CONTEXT_TIMESTAMP**
			
			- $.context.timestamp must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_ID**
			
			- $.context.bap_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_BAP_URI**
			
			- $.context.bap_uri must be present in the payload
			
			#### **REQUIRED_CONTEXT_BPP_ID**
			
			- $.context.bpp_id must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_status"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_BPP_URI**
			
			- $.context.bpp_uri must be present in the payload
			
			> **Skip if:**
			>
			>     - all elements of ["on_status"] are in ["search"]
			
			#### **REQUIRED_CONTEXT_TRANSACTION_ID**
			
			- $.context.transaction_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_MESSAGE_ID**
			
			- $.context.message_id must be present in the payload
			
			#### **REQUIRED_CONTEXT_VERSION**
			
			- $.context.version must be present in the payload
			
			#### **REQUIRED_CONTEXT_TTL**
			
			- $.context.ttl must be present in the payload
		
		- **CONTEXT_ENUM** : All the following sub conditions must pass as per the api requirement
		
			#### **VALID_CONTEXT_LOCATION_COUNTRY_CODE**
			
			- At least one of $.context.location.country.code must be in ["IND"]
			
			> **Skip if:**
			>
			>     - $.context.location.country.code is not in the payload
			
			#### **VALID_CONTEXT_DOMAIN**
			
			- All elements of $.context.domain must be in ["ONDC:FIS12"]
			
			> **Skip if:**
			>
			>     - $.context.domain is not in the payload
		
		- **CONTEXT_REGEX** : All the following sub conditions must pass as per the api requirement
		
			#### **REGEX_CONTEXT_LOCATION_CITY_CODE**
			
			- All elements of $.context.location.city.code must follow every regex in ["^\*$"]
			
			> **Skip if:**
			>
			>     - $.context.location.city.code is not in the payload
			
			#### **REGEX_CONTEXT_TIMESTAMP**
			
			- All elements of $.context.timestamp must follow every regex in ["^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"]
			
			> **Skip if:**
			>
			>     - $.context.timestamp is not in the payload
			
			#### **REGEX_CONTEXT_BAP_ID**
			
			- All elements of $.context.bap_id must follow every regex in ["^(?!.*\b(?:http|https|www)\b)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_id is not in the payload
			
			#### **REGEX_CONTEXT_BAP_URI**
			
			- All elements of $.context.bap_uri must follow every regex in ["^https?://([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*|localhost)(:\d+)?(/.*)?$"]
			
			> **Skip if:**
			>
			>     - $.context.bap_uri is not in the payload
			
			#### **REGEX_CONTEXT_TTL**
			
			- All elements of $.context.ttl must follow every regex in ["^P(?=\\d|T\\d)(\\d+Y)?(\\d+M)?(\\d+D)?(T(\\d+H)?(\\d+M)?(\\d+S)?)?$"]
			
			> **Skip if:**
			>
			>     - $.context.ttl is not in the payload
	
	- **ON_STATUS_ORDER** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_ORDER_PROVIDER_ID**
		
		- $.message.order.provider.id must be present in the payload
		
		#### **REQUIRED_ORDER_ITEMS**
		
		- $.message.order.items[*].id must be present in the payload
	
	- **ON_STATUS_FULFILLMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_FULFILLMENT_TYPE**
		
		- All elements of $.message.order.fulfillments[*].type must be in ["LOAN"]
		
		> **Skip if:**
		>
		>     - $.message.order.fulfillments[*].type is not in the payload
	
	- **ON_STATUS_FULFILLMENT_STATE** : All the following sub conditions must pass as per the api requirement
	
		#### **VALID_FULFILLMENT_STATE_CODE**
		
		- All elements of $.message.order.fulfillments[*].state.descriptor.code must be in ["INITIATED", "SANCTIONED", "DISBURSED", "PENDING", "REJECTED", "COMPLETED", "CONSENT_REQUIRED", "APPROVED"]
	
	- **ON_STATUS_PAYMENTS** : All the following sub conditions must pass as per the api requirement
	
		#### **REQUIRED_PAYMENT_TYPE**
		
		- $.message.order.payments[*].type must be present in the payload
		
		#### **REQUIRED_PAYMENT_STATUS**
		
		- All elements of $.message.order.payments[*].status must be in ["PAID", "NOT-PAID", "FAILED", "DELAYED", "DEFERRED"]
	
	#### **ON_STATUS_QUOTE**
	
	- At least one of $.message.order.quote.breakup[*].title must be in ["PRINCIPAL", "INTEREST", "PROCESSING_FEE", "OTHER_UPFRONT_CHARGES", "INSURANCE_CHARGES", "NET_DISBURSED_AMOUNT", "OTHER_CHARGES", "LATE_FEE_AMOUNT", "OUTSTANDING_PRINCIPAL", "FORCLOSUER_CHARGES", "OUTSTANDING_INTEREST", "PRE_PAYMENT_CHARGE", "INSURANCE_TOTAL_FEE", "INSURANCE_PRODUCT_FEE", "TAX"]