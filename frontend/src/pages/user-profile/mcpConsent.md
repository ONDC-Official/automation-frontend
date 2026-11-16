# ONDC Workbench MCP: Terms and Data Consent

**Version:** 2026-10-v1 · **Last updated:** 8 October 2026

Please read and agree to this before you create your MCP API key.

---

## 1. What the MCP is

- The ONDC Workbench MCP is a testing service that you connect to your AI assistant (Claude, Cursor, or any MCP client).
- Your AI assistant uses it to test your ONDC buyer app (BAP) or seller app (BPP).
- It acts as the other side of the transaction: a seller if you are testing a buyer app, and a buyer if you are testing a seller app.

## 2. What the MCP does

- **Test sessions:** creates a test session for your app's endpoint, domain, version and use case.
- **Test flows:** runs official ONDC test flows step by step (search, select, init, confirm, etc.).
- **Real requests:** sends real ONDC requests to the endpoint you provide.
- **Receiving replies:** receives your app's replies and accepts (ACK) or rejects (NACK) them.
- **Checking:** checks your requests and replies against the published ONDC rules.
- **Forms:** fills and submits forms that are part of a flow.
- **Protocol help:** answers questions about the ONDC protocol from the official specs.
- **Viewer link:** gives you a link to watch your test run live.
- **Issue reports:** reports problems in failed runs to the ONDC team so they can be fixed.

## 3. Your API key

- You get one personal key, linked to your GitHub account.
- Every MCP request must carry your key. Without a valid key, no tool works.
- We show the key only once. We store only a scrambled (hashed) copy, so even we can't read it.
- It expires 90 days after it is created. You can regenerate it at any time to get a fresh 90 days.
- Keep it secret. Anyone who has your key can use the MCP as you.
- If it leaks, regenerate it. The old key stops working immediately.

## 4. Data collected by the Workbench website

- **Account details:** GitHub username, name, email and avatar.
- **Consent record:** which version you agreed to, when, your IP address and browser details.
- **Key details:** the first few characters of your key, when it was created and when it was last used.

## 5. Data collected by the MCP

- **Your identity on each request:** your user ID and username, so we know who used which tool.
- **Tool activity:** which tools you used, when, and whether they worked.
- **Test session details:** your endpoint URL, domain, version, use case and test settings.
- **Test messages:** the ONDC requests and replies exchanged during your tests.
- **Form answers:** the values you or your AI assistant enter into test forms.
- **Issue reports:** what went wrong in a failed or stuck run, plus your AI assistant's description of the problem. Personal data is removed first (see section 8).
- **Monitoring summary:** the steps of each run and whether they were accepted or rejected. Cleaned the same way as issue reports.
- **Usage statistics:** counts only, such as the number of runs, errors and response times. They contain no personal details.

## 6. How long data is kept

- **Test sessions, messages and form answers:** deleted automatically after **48 hours**.
- **Your account and consent record:** kept as long as your account or key exists.
- **Tool activity, issue reports and monitoring summaries:** kept for 12 months.

## 7. Data we don't collect

- Your chats with your AI assistant. The MCP only sees the tool requests your assistant sends it.
- Your full API key.
- Your GitHub password, or access to your repositories.
- Real payload values in issue reports or monitoring summaries.
- Anything on your computer.

## 8. MCP guardrails

**Access**

- Every request is checked against your key.
- If your key can't be verified (for example, our system is down), the request is refused, never allowed through.
- Request limits are in place to prevent overload and misuse.

**Safe testing**

- Test messages are created by the official, published ONDC test flows, not invented by the AI.
- That flow code runs in an isolated sandbox.
- Every outgoing request is checked against ONDC rules before it is sent. If it breaks the rules, it is not sent.
- Forms from other apps are screened for unsafe content (such as scripts) before they are used.
- Your AI assistant can only correct specific fields in a message. It can't change the transaction ID or skip the rule checks.

**Privacy**

- Before any issue report or monitoring summary is saved or sent:
    - payload values are replaced with placeholders like `<string>`;
    - identifiers, such as your endpoint URL, are scrambled;
    - emails and phone numbers are removed from error messages.
- Usage statistics never include names, IDs or message contents.
- The viewer link uses a private access token. Anyone who has the link can see that session until it expires, so share it carefully.

## 9. How we use your data

- To run your tests.
- To keep the service secure and investigate misuse.
- To find and fix problems in the MCP and in ONDC test flows.
- To understand how the service is used and improve it.
- We do not sell your data or use it for ads.
- Only the ONDC Workbench team can access it.

## 10. Your responsibilities

- Only test endpoints you own or are allowed to test.
- Use test data only. Never use real customer data (names, phone numbers, addresses, bank or loan details).
- Keep your API key secret.
- Don't use the MCP to attack, overload or disrupt any system.
- Check results yourself. AI can make mistakes, and test results don't certify your app as ONDC-compliant.
- Your AI assistant is run by another company. What you share with it is covered by that company's terms.

## 11. Your choices

- Regenerate or delete your key at any time.
- To see or delete your data, write to PW-support@ondc.org.
- If these terms change in a meaningful way, we will ask you to agree again.
