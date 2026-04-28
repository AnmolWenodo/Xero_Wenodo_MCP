/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { z } from "zod";
import { getSalesInvoiceHandler } from "../../handlers/get-sales-invoice.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";

const GetSalesInvoiceTool = CreateXeroTool(
  "get-sales-invoice-headers",
  `Get sales invoice header data.

Returns one record per transaction (check) including:
- Sales values (net, tax, gross, discount, tips, service charge)
- Customer count (covers)
- Transaction timestamps (open, close, cashup date)
- Business context (entity, branch, integration system)
- Session classification (e.g., breakfast, lunch, dinner)

Use this tool when the user asks about:
- Sales totals or summaries
- Revenue breakdowns
- Number of transactions
- Footfall (covers)
- Discounts, comps, voids
- Session or time-based sales trends
- Average bill value or per-check analysis

Do NOT use for:
- Item-level sales (use sales lines tool)
- Payment method breakdown (use payments tool)`,
  {
    fromDate: z.string().describe("Start date for the sales query (YYYY-MM-DD)"),
    toDate: z.string().describe("End date for the sales query (YYYY-MM-DD)"),
    entityId: z.number().describe("Entity ID to filter by"),
    branchId: z
      .union([z.number(), z.string(), z.array(z.number())])
      .optional()
      .default(0)
      .describe("Branch ID or multiple IDs"),
    customerId: z.number().describe("Customer ID to filter by"),
  },
  async ({ fromDate, toDate, entityId, branchId, customerId }) => {
    const res = await getSalesInvoiceHandler({ fromDate, toDate, entityId, branchId, customerId });

    if (res.error !== null) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing invoices: ${res.error}`,
          },
        ],
      };
    }

    const response = res.result as any;

    // normalize input
    let invoices: any[] = [];
    if (Array.isArray(response)) {
      invoices = response;
    } else if (Array.isArray(response?.data)) {
      invoices = response.data;
    } else if (response) {
      invoices = [response];
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${invoices.length} records`,
        },
        ...invoices.map((inv: any) => ({
          type: "text" as const,
          text: [
            `Sales ID: ${inv.EPOS_SALES_HEADER_ID}`,
            `Check ID: ${inv.CHECK_ID}`,
            `Check No: ${inv.CHECK_NO}`,
            `Entity: ${inv.ENTITY_NAME} (${inv.ENTITY_ID})`,
            `Branch: ${inv.BRANCH_NAME} (${inv.BRANCH_ID})`,
            inv.CASHUP_MAIN_ID && `Cashup ID: ${inv.CASHUP_MAIN_ID}`,
            inv.CASHUP_DATE && `Cashup Date: ${inv.CASHUP_DATE}`,
            inv.CREATED_DATE && `Created: ${inv.CREATED_DATE}`,
            inv.OPEN_TIME && `Open Time: ${inv.OPEN_TIME}`,
            inv.CLOSE_TIME && `Close Time: ${inv.CLOSE_TIME}`,
            inv.SESSION_NAME && `Session: ${inv.SESSION_NAME}`,
            inv.COVERS != null && `Covers: ${inv.COVERS}`,
            `Net: ${inv.NET}`,
            `Tax: ${inv.TAX}`,
            `Gross: ${inv.GROSS}`,
            inv.DISCOUNT != null && `Discount: ${inv.DISCOUNT}`,
            inv.COMP != null && `Comp: ${inv.COMP}`,
            inv.VOID != null && `Void: ${inv.VOID}`,
            inv.TIPS != null && `Tips: ${inv.TIPS}`,
            inv.SERVICE_CHARGE != null && `Service Charge: ${inv.SERVICE_CHARGE}`,
            inv.DONATION != null && `Donation: ${inv.DONATION}`,
            inv.INTEGRATION_SYSTEM_NAME &&
              `Source: ${inv.INTEGRATION_SYSTEM_NAME} (${inv.INTEGRATION_SYSTEM_ID})`,
          ]
            .filter(Boolean)
            .join("\n"),
        })),
      ],
    };
  },
);

export default GetSalesInvoiceTool;
