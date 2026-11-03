# Getting Started with Developer Guide

This section helps you quickly understand how to explore ONDC protocol flows, starting with the **Unified Credit** use case.

## 1. Start your ONDC journey

Sign up or sign in on the [ONDC Portal]({{ONDC_PORTAL_URL}}) to register as a Network Participant and begin your ONDC journey. The portal adds you to the ONDC Registry:

- **Pre-Production** — get your subscriber ID whitelisted; the portal subscribes you directly, no DNS TXT record required.
- **Production** — generate and host a DNS TXT record; the portal then calls the admin subscription API.

See the [Subscription Process](/developer-guide/docs/protocol#subscription-process) for the full steps.

## 2. Pick a use case

Start with the **Unified Credit** use case under the active domain. This is the reference implementation for exploring end-to-end flows.

## 3. Explore the flow details

Once you open a use case, the flow page shows:

- The sequence of protocol calls
- Request/response payloads
- Important attributes to pay attention to during implementation

## 4. Recommended next steps

- Validate sample payloads using the Schema Validation tool
- Use the Unified Credit flow as a reference for your integration
- Save notes about edge cases, error handling, and partner-specific behavior as you explore flows
