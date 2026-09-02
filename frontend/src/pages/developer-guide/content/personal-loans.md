# Personal Loans

## On this page

- [Overview](#overview)
- [Participants](#participants)
- [The User Journey](#the-user-journey)
    - [1. Loan Application and Discovery](#1-loan-application-and-discovery)
    - [2. Loan Offers](#2-loan-offers)
    - [3. Offer Selection](#3-offer-selection)
    - [4. Lender Onboarding and Verification](#4-lender-onboarding-and-verification)
    - [5. Final Underwriting and Loan Offer](#5-final-underwriting-and-loan-offer)
    - [6. Application Status and Processing](#6-application-status-and-processing)
    - [7. Offline Processing](#7-offline-processing)
    - [8. Loan Confirmation and Disbursement](#8-loan-confirmation-and-disbursement)
- [Additional Scenarios](#additional-scenarios)
    - [1. Loan Servicing and Repayment](#1-loan-servicing-and-repayment)
    - [2. Missed EMI Payment](#2-missed-emi-payment)
    - [3. Part-Prepayment](#3-part-prepayment)
    - [4. Loan Foreclosure](#4-loan-foreclosure)
    - [5. Loan Status After Repayment](#5-loan-status-after-repayment)
- [Issue and Grievance Management](#issue-and-grievance-management)

---

## Overview

Personal loans are unsecured, collateral-free loans offered by banks and NBFCs based on factors such as the borrower's income, credit profile, and eligibility. Each lender independently manages its loan products, underwriting, pricing, terms, application process, and servicing.

ONDC enables these lenders and lending apps to connect through a common, open protocol instead of building separate integrations with each other. A lending app integrates with the ONDC network as a Loan Service Provider (LSP) and can discover and offer loan products from participating lenders. Lenders integrate once with the network to make their loan products available to participating lending apps.

The lender remains responsible for the loan product, including eligibility, underwriting, approval, pricing, terms, disbursal, and servicing. ONDC standardizes the network interactions for discovering, comparing, applying for, and servicing personal loans across participating network participants.

This guide explains the personal loan use case and end-to-end journey from a business and product perspective, before covering the corresponding technical specifications and API flows.

---

## Participants

| Participant                             | What This Means                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lender**                              | An RBI-regulated lending institution that offers personal loan products on the network. This includes Scheduled Commercial Banks, NBFCs, Primary (Urban) Co-operative Banks, and Regional Rural Banks. The lender is responsible for the loan product, including eligibility, underwriting, approval, pricing, disbursal, and servicing.                                                                    |
| **Lending App (Loan Service Provider)** | A buyer application that offers personal loan products to its users by connecting with participating lenders through the ONDC network. This can include lending, payments, e-commerce, or personal finance applications. The LSP facilitates loan discovery and application while the lender remains responsible for credit assessment and lending decisions, in accordance with applicable RBI guidelines. |

---

## The User Journey

The personal loan journey enables a borrower to discover loan offers, select a lender, complete the lender's onboarding and verification process, and receive the loan. The journey consists of the following stages:

### 1. Loan Application and Discovery

The borrower provides their basic information through the Lending App (LSP), including:

- PAN
- Mobile number
- Name
- Pincode
- Date of birth
- Employment type — salaried or self-employed
- Income
- Employer name
- UDYAM number, where applicable for self-employed borrowers
- Bureau consent

The LSP verifies the borrower's mobile number through OTP and obtains the required consent to share the information with participating lenders and allow lenders to access the borrower's credit bureau information.

The LSP then sends the loan search request to participating lenders through the network.

**Network interaction:**

##### `/search`

The LSP sends the borrower's loan requirements, including the requested loan amount, tenure, and personal loan category.

##### `/on_search`

Participating lenders respond with their available loan products and relevant parameters such as loan amount range, tenure, interest rate, processing fees, and applicable product attributes.

### 2. Loan Offers

Based on the information available to them, lenders return loan offers that may include:

- Bureau-based offers
- Tentative offers subject to additional information or verification

The LSP presents the available offers to the borrower for comparison.

The borrower can compare parameters such as loan amount, interest rate, tenure, EMI, and applicable fees.

### 3. Offer Selection

The borrower selects a loan offer through the LSP.

**Network interaction:**

##### `/select`

The LSP sends the selected loan product.

##### `/on_select`

The lender responds with the applicable loan quote, including APR, processing fees, EMI details, and other applicable charges or terms and the link to continue the loan processing journey.

### 4. Lender Onboarding and Verification

After the borrower selects an offer, the borrower proceeds to the lender's onboarding journey, which is rendered within the LSP experience (app-in-app experience).

The lender is responsible for determining and executing the required onboarding and verification steps. These may include:

- KYC and identity verification
- Bank account verification
- Repayment mandate setup
- Loan agreement execution

The specific verification method may vary by lender.

#### KYC

The lender may use methods such as Aadhaar OTP, offline eKYC, Video KYC, liveness checks, DigiLocker, field verification, or other permitted verification methods.

#### Bank Account Verification

The lender verifies the borrower's bank account using methods such as penny-drop verification or account-holder name matching.

#### Repayment Setup

The lender sets up the mechanism for collecting future EMIs. This may include eMandate, eNACH, UPI AutoPay, or standing instructions.

#### Loan Agreement

The borrower executes the loan agreement using the method supported by the lender, such as clickwrap or Aadhaar-based e-sign.

The lender communicates the status of these activities to the LSP through asynchronous `/on_status` updates.

### 5. Final Underwriting and Loan Offer

The lender completes its credit assessment using the information available to it and any additional information collected during the onboarding journey.

Where required, the borrower may be asked to provide additional documents, such as bank statements in PDF format. The lender uses this information along with bureau and other relevant data to complete its underwriting.

The lender then generates the final loan offer, including the applicable loan amount, pricing, tenure, EMI, fees, and other terms.

The lender communicates the status of the final offer through `/on_status`.

> **Account Aggregator:** Account Aggregator is not part of this network flow. This can be carried out by the lender in its journey to enhance the offered amount or ROI.

### 6. Application Status and Processing

The lender sends asynchronous (unsolicited) `/on_status` updates to the LSP throughout the loan journey. These updates keep the LSP informed of the borrower's application status without requiring the LSP to manage the lender's internal processing.

The status updates can cover the following stages:

| Stage                       | Purpose                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `KYC`                       | Tracks the progress and outcome of identity verification.                                     |
| `LOAN_OFFER`                | Indicates generation and acceptance of the final loan offer.                                  |
| `BANK_ACCOUNT_VERIFICATION` | Indicates the status of bank account verification.                                            |
| `REPAYMENT`                 | Indicates the status of mandate or repayment setup.                                           |
| `LOAN_AGREEMENT`            | Indicates the status of agreement execution and provides the signed agreement once completed. |

### 7. Offline Processing

A lender may require manual verification or processing that cannot be completed through the digital journey. This may include field verification, branch checks, telephone verification, or manual underwriting.

In such cases, the lender sends an `/on_status` update indicating that the application is `IN_PROGRESS` and that processing is continuing offline.

Once the offline activity is completed, the lender sends another `/on_status` update with the outcome:

- **`SUCCESSFUL`** — The application can proceed with the remaining digital steps.
- **`FAILED`** — The application is rejected, along with the applicable rejection information.

The LSP uses these updates to communicate the application status to the borrower.

### 8. Loan Confirmation and Disbursement

Once all required onboarding activities are successfully completed, the LSP sends `/confirm` to the lender.

The lender validates the completed journey and confirms the loan booking through `/on_confirm`.

The lender then shares the relevant loan details, which may include:

- Loan Account ID
- Disbursal or remittance details
- Repayment schedule

The lender disburses the loan amount to the borrower's bank account.

After disbursement, the loan moves into the repayment stage. The lender continues to share relevant loan status updates with the LSP, including updates associated with subsequent EMI payments.

---

## Additional Scenarios

The personal loan journey continues after loan booking through loan servicing, repayment, and grievance management. The network supports the following additional scenarios.

### 1. Loan Servicing and Repayment

After disbursement, the borrower can view the status of their active and closed loans through the Lending App (LSP). Regular EMI collection continues through the repayment mandate set up with the lender.

The lender sends relevant loan and repayment status updates to the LSP through `/on_status`, allowing the LSP to keep the borrower's loan information up to date.

The borrower can initiate the following servicing actions for an active loan, subject to the lender's applicable policies:

- Pay a missed or overdue EMI
- Make a part-prepayment
- Foreclose the loan by making full repayment

The lender determines whether the requested action is applicable to the loan and calculates the amount payable, including any applicable charges.

### 2. Missed EMI Payment

A borrower can make a manual payment when an EMI has not been successfully collected through the configured repayment mandate.

**Network interaction:**

##### `/update`

The LSP sends a repayment servicing request to the lender, identifying the action as a `LATE_PAYMENT` request.

##### `/on_update` / `/on_status`

The lender validates the request and returns the outstanding amount, applicable charges, and payment link or payment instructions.

##### `/on_status`

After successful payment, the lender updates the loan account and sends the payment status and updated outstanding information to the LSP.

The LSP displays the applicable dues and payment status to the borrower.

### 3. Part-Prepayment

A borrower can make a partial repayment towards the outstanding loan principal, subject to the lender's product terms and applicable regulations.

**Network interaction:**

##### `/update`

The LSP sends a `PART-PREPAYMENT` request with the amount the borrower intends to repay.

##### `/on_update` / `/on_status`

The lender validates the request and returns the applicable amount, charges, and payment link or payment instructions.

##### `/on_status`

After successful payment, the lender updates the outstanding principal and provides the revised repayment information, including the updated EMI or repayment schedule where applicable.

Applicable prepayment charges and conditions are determined by the lender and must be communicated to the borrower in accordance with applicable regulations and product terms.

### 4. Loan Foreclosure

A borrower can request full repayment of an active loan before the scheduled end of its tenure, subject to the lender's applicable terms and regulations.

**Network interaction:**

##### `/update`

The LSP sends a `FORECLOSURE` request for the selected loan.

##### `/on_update` / `/on_status`

The lender calculates the total foreclosure amount and returns the applicable outstanding principal, accrued interest, charges, and payment link or payment instructions.

##### `/on_status`

After successful payment, the lender updates the loan account as fully repaid and sends the updated loan status to the LSP.

The lender is responsible for calculating and disclosing applicable foreclosure or prepayment charges. For certain floating-rate personal loans to individual borrowers, RBI regulations restrict the levy of foreclosure/prepayment penalties.

### 5. Loan Status After Repayment

After a successful part-prepayment, missed EMI payment, or foreclosure, the lender updates the loan account and communicates the latest status to the LSP through `/on_status`.

For a fully repaid loan, the lender marks the loan as closed and provides the relevant closure or repayment information supported by the network.

---

## Issue and Grievance Management

A borrower can raise a grievance through the LSP for issues related to their loan or the network transaction. The LSP routes the grievance to the relevant lending partner through the network's grievance mechanism.

The lender is responsible for investigating and resolving the grievance. The lender communicates the grievance status and resolution to the LSP, which makes the relevant information available to the borrower.

The grievance process can include:

- **Grievance Registration** — The borrower raises an issue through the LSP.
- **Grievance Routing** — The LSP routes the grievance to the relevant lender.
- **Resolution** — The lender investigates the issue and takes the required action.
- **Status Updates** — The lender communicates progress and resolution status to the LSP.
- **Closure** — The LSP communicates the resolution to the borrower and closes the grievance when appropriate.

The lender and LSP remain responsible for complying with applicable grievance redressal requirements. RBI guidance provides for grievance redressal mechanisms for digital lending and identifies the lender/LSP's designated grievance channels.
